const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const convert = require('heic-convert');
const exifr = require('exifr');

const ROOT = path.join(__dirname, '../public/photowall');
const ORIGIN_DIR = path.join(ROOT, 'origin');
const THUMBNAILS_DIR = path.join(ROOT, 'thumbnails');
const FULL_DIR = path.join(THUMBNAILS_DIR, 'full');
const MEDIUM_DIR = path.join(THUMBNAILS_DIR, 'medium');
const TINY_DIR = path.join(THUMBNAILS_DIR, 'tiny');
const OUTPUT_FILE = path.join(__dirname, '../src/data/images-metadata.json');

// 确保目录存在
[FULL_DIR, MEDIUM_DIR, TINY_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const EXTENSIONS = /\.(jpg|jpeg|png|webp|heic|heif)$/i;

function formatDate(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function processPhotos() {
    console.log('🚀 Starting photo processing...');

    // 读取已有元数据，必要时保留信息/日期
    let existingMetadata = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            existingMetadata = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        } catch(e) {}
    }
    const existingMap = new Map(existingMetadata.map(item => [item.filename, item]));

    // 2. 同时扫描 origin 与 full 目录（包含已转换文件）
    // 优先使用 origin 文件；若仅存在于 full，视为已转换文件保留
    const originFiles = fs.existsSync(ORIGIN_DIR) ? fs.readdirSync(ORIGIN_DIR).filter(file => EXTENSIONS.test(file)) : [];
    const fullFiles = fs.existsSync(FULL_DIR) ? fs.readdirSync(FULL_DIR).filter(file => EXTENSIONS.test(file)) : [];
    
    // 创建 baseName -> { origin, full } 的映射
    const fileMap = new Map();
    
    originFiles.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        const base = path.basename(file, ext);
        if (!fileMap.has(base)) fileMap.set(base, {});
        fileMap.get(base).origin = file;
    });

    fullFiles.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        const base = path.basename(file, ext);
        if (!fileMap.has(base)) fileMap.set(base, {});
        fileMap.get(base).full = file;
    });

    console.log(`Found ${fileMap.size} unique images.`);
    
    const newMetadata = [];

    for (const [baseName, locations] of fileMap) {
        // 确定源文件：优先 origin（原始），否则 full（已转换）
        // 若 origin 为 HEIC，则转换并按需删除原文件
        
        let sourcePath = '';
        let file = '';
        let isOrigin = false;

        if (locations.origin) {
            sourcePath = path.join(ORIGIN_DIR, locations.origin);
            file = locations.origin;
            isOrigin = true;
        } else if (locations.full) {
            sourcePath = path.join(FULL_DIR, locations.full);
            file = locations.full;
            isOrigin = false;
        } else {
            continue;
        }

        const stats = fs.statSync(sourcePath);
        const ext = path.extname(file).toLowerCase();
        
        console.log(`Processing: ${baseName} (${ext})`);

        let date = null;
        let width = 0;
        let height = 0;
        let finalFormat = 'JPEG';

        const isHeic = ext === '.heic' || ext === '.heif';
        const outputFullPath = path.join(FULL_DIR, `${baseName}.jpg`);
        let fullSrcPath = '';
        let mediumPathDisplay = `/photowall/thumbnails/medium/${baseName}.jpg`;
        let tinyPathDisplay = `/photowall/thumbnails/tiny/${baseName}.jpg`;

        try {
            let inputBuffer = fs.readFileSync(sourcePath);
            let sharpInstance;

            // 使用 exifr 提取日期
            try {
                const meta = await exifr.parse(inputBuffer);
                if (meta && (meta.DateTimeOriginal || meta.CreateDate || meta.ModifyDate)) {
                    date = formatDate(meta.DateTimeOriginal || meta.CreateDate || meta.ModifyDate);
                }
            } catch (err) {}

            // 日期兜底
            if (!date && existingMap.has(locations.origin || locations.full)) {
                date = existingMap.get(locations.origin || locations.full).date;
            }
            if (!date) {
                date = formatDate(stats.mtime);
            }

            // 2. 统一生成 full JPEG，确保前端展示路径稳定
            const shouldRegenerateFull =
                !fs.existsSync(outputFullPath) ||
                (sourcePath !== outputFullPath && fs.statSync(outputFullPath).mtimeMs < stats.mtimeMs);

            if (shouldRegenerateFull) {
                if (isHeic) {
                    console.log('  Converting HEIC/HEIF to JPEG...');
                    const jpegBuffer = await convert({
                        buffer: inputBuffer,
                        format: 'JPEG',
                        quality: 0.9
                    });
                    fs.writeFileSync(outputFullPath, jpegBuffer);
                } else if (ext === '.jpg' || ext === '.jpeg') {
                    if (sourcePath !== outputFullPath) {
                        fs.copyFileSync(sourcePath, outputFullPath);
                    }
                } else {
                    // PNG/WebP 等格式统一转为 JPEG，避免展示链路分叉
                    await sharp(inputBuffer)
                        .jpeg({ quality: 92, mozjpeg: true })
                        .toFile(outputFullPath);
                }
            }

            if (!fs.existsSync(outputFullPath)) {
                throw new Error(`Missing full image after processing: ${outputFullPath}`);
            }

            inputBuffer = fs.readFileSync(outputFullPath);
            fullSrcPath = `/photowall/thumbnails/full/${baseName}.jpg`;
            finalFormat = 'JPEG';

            // 3. 生成缩略图
            const mediumFsPath = path.join(MEDIUM_DIR, `${baseName}.jpg`);
            const tinyFsPath = path.join(TINY_DIR, `${baseName}.jpg`);
            const fullStats = fs.statSync(outputFullPath);

            sharpInstance = sharp(inputBuffer);
            const metadata = await sharpInstance.metadata();
            width = metadata.width;
            height = metadata.height;

            if (!fs.existsSync(mediumFsPath) || fs.statSync(mediumFsPath).mtimeMs < fullStats.mtimeMs) {
                // 如需调试，可输出“生成中等缩略图...”日志
                await sharpInstance
                    .clone()
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(mediumFsPath);
            }

            if (!fs.existsSync(tinyFsPath) || fs.statSync(tinyFsPath).mtimeMs < fullStats.mtimeMs) {
                // 如需调试，可输出“生成微型缩略图...”日志
                await sharpInstance
                    .clone()
                    .resize(50, 50, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 60 })
                    .toFile(tinyFsPath);
            }

            // 从 origin 删除 HEIC/HEIF，保留转换后的 JPEG
            if (isOrigin && isHeic && fs.existsSync(sourcePath) && sourcePath !== outputFullPath) {
                try {
                    console.log(`  Deleting original HEIC/HEIF file: ${file}`);
                    fs.unlinkSync(sourcePath);
                } catch (e) {
                    console.error('  Failed to delete HEIC/HEIF:', e.message);
                }
            }

            // 4. 写入元数据
            let videoSrc = undefined;
            // 尝试从已有元数据中读取 videoSrc
            // 同时检查 origin 与 full 的文件名
            const key = locations.origin || locations.full;
            if (existingMap.has(key)) {
                videoSrc = existingMap.get(key).videoSrc;
            }

            newMetadata.push({
                filename: key, // 使用找到的文件名（优先 origin）
                originalSrc: fullSrcPath, // 作为灯箱显示的实际源
                src: fullSrcPath,
                srcMedium: mediumPathDisplay,
                srcTiny: tinyPathDisplay,
                width,
                height,
                size: fullStats.size,
                format: finalFormat,
                date,
                videoSrc
            });

        } catch (err) {
            console.error(`  Error processing ${baseName}:`, err);
        }
    }

    // 按日期降序排序
    newMetadata.sort((a, b) => {
        if (a.date && b.date) {
            return b.date.localeCompare(a.date);
        }
        return a.filename.localeCompare(b.filename);
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newMetadata, null, 2));
    console.log(`✅ Done! Processed ${newMetadata.length} images.`);
    console.log(`Metadata saved to ${OUTPUT_FILE}`);
}

processPhotos().catch(console.error);
