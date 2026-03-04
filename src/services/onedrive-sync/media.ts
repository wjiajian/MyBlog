import path from 'path';
import { createRequire } from 'module';
import sharp from 'sharp';
import exifr from 'exifr';
import OSS from 'ali-oss';
import { PROJECT_ROOT, formatDate } from './config.js';
import type { OneDriveSyncConfig } from './types.js';

const requireFromEsm = createRequire(import.meta.url);
const { isSupportedPhotoExtension } = requireFromEsm(path.join(PROJECT_ROOT, 'shared', 'photo-extensions.cjs')) as {
  isSupportedPhotoExtension: (ext: string) => boolean;
};
const heicConvert = requireFromEsm('heic-convert') as (params: {
  buffer: Buffer;
  format: 'JPEG';
  quality: number;
}) => Promise<Uint8Array>;

export function isSupportedPhoto(filename: string): boolean {
  const extension = path.extname(filename).toLowerCase();
  return isSupportedPhotoExtension(extension);
}

export function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function getBaseName(filename: string): string {
  return path.basename(filename, getExtension(filename));
}

export function getPhotoObjectKeys(baseName: string): { fullKey: string; mediumKey: string; tinyKey: string } {
  return {
    fullKey: `photowall/thumbnails/full/${baseName}.jpg`,
    mediumKey: `photowall/thumbnails/medium/${baseName}.jpg`,
    tinyKey: `photowall/thumbnails/tiny/${baseName}.jpg`,
  };
}

export function createOssClient(config: OneDriveSyncConfig): OSS {
  return new OSS({
    region: config.ossRegion,
    bucket: config.ossBucket,
    accessKeyId: config.ossAccessKeyId,
    accessKeySecret: config.ossAccessKeySecret,
    endpoint: config.ossEndpoint || undefined,
    secure: true,
  });
}

export async function putObject(client: OSS, key: string, body: Buffer, contentType: string): Promise<void> {
  await client.put(key, body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function deleteObjectIgnoreNotFound(client: OSS, key: string): Promise<void> {
  try {
    await client.delete(key);
  } catch (error) {
    const status = (error as { status?: number }).status;
    const code = (error as { code?: string }).code;
    if (status === 404 || code === 'NoSuchKey') {
      return;
    }
    throw error;
  }
}

export async function convertToJpegBuffer(inputBuffer: Buffer, extension: string): Promise<Buffer> {
  const isHeic = extension === '.heic' || extension === '.heif';
  if (isHeic) {
    const converted = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9,
    });
    return Buffer.from(converted);
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    return inputBuffer;
  }

  return await sharp(inputBuffer)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

export async function buildPhotoVariants(fullSourceBuffer: Buffer): Promise<{
  fullBuffer: Buffer;
  mediumBuffer: Buffer;
  tinyBuffer: Buffer;
  width: number;
  height: number;
}> {
  const fullBuffer = await sharp(fullSourceBuffer)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  const fullSharp = sharp(fullBuffer);
  const info = await fullSharp.metadata();

  const mediumBuffer = await fullSharp
    .clone()
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  const tinyBuffer = await fullSharp
    .clone()
    .resize(50, 50, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 60 })
    .toBuffer();

  return {
    fullBuffer,
    mediumBuffer,
    tinyBuffer,
    width: info.width || 0,
    height: info.height || 0,
  };
}

export async function extractPhotoDate(sourceBuffer: Buffer, fallbackIsoDate?: string): Promise<string | null> {
  try {
    const meta = await exifr.parse(sourceBuffer);
    const candidate = meta?.DateTimeOriginal || meta?.CreateDate || meta?.ModifyDate;
    const parsed = formatDate(candidate);
    if (parsed) return parsed;
  } catch {
    // ignore EXIF parse errors
  }

  return formatDate(fallbackIsoDate || null);
}
