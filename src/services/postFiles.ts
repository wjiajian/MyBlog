import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = (() => {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  }
  const isDistServer = __dirname.split(path.sep).includes('dist-server');
  return isDistServer
    ? path.resolve(__dirname, '..', '..', '..')
    : path.resolve(__dirname, '..', '..');
})();

const CONTENT_DIR = path.join(PROJECT_ROOT, 'src', 'content');
const POST_TYPES = ['tech', 'life'] as const;

function normalizePostFilename(postId: string): string | null {
  if (!postId || postId.includes('\0')) return null;
  if (postId.includes('/') || postId.includes('\\')) return null;

  const filename = postId.endsWith('.md') ? postId : `${postId}.md`;
  if (path.basename(filename) !== filename) return null;
  if (!filename.toLowerCase().endsWith('.md')) return null;
  return filename;
}

export function postExistsById(postId: string): boolean {
  const filename = normalizePostFilename(postId);
  if (!filename) return false;

  return POST_TYPES.some((type) => {
    const typeDir = path.resolve(CONTENT_DIR, type);
    const resolved = path.resolve(typeDir, filename);
    if (!resolved.startsWith(typeDir + path.sep)) return false;
    return fs.existsSync(resolved);
  });
}
