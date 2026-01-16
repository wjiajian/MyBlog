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
const OUTPUT_FILE = path.join(ROOT, 'images-metadata.json');

// Ensure directories exist
[FULL_DIR, MEDIUM_DIR, TINY_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const EXTENSIONS = /\.(jpg|jpeg|png|webp|heic)$/i;

function formatDate(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function processPhotos() {
    console.log('🚀 Starting photo processing...');

    // Load existing metadata to preserve info/dates if needed
    let existingMetadata = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            existingMetadata = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        } catch(e) {}
    }
    const existingMap = new Map(existingMetadata.map(item => [item.filename, item]));

    // 2. Scan both origin and full directory (for converted files)
    // We prioritize origin files. If a file exists in full but not origin, it's a converted file we should keep.
    const originFiles = fs.existsSync(ORIGIN_DIR) ? fs.readdirSync(ORIGIN_DIR).filter(file => EXTENSIONS.test(file)) : [];
    const fullFiles = fs.existsSync(FULL_DIR) ? fs.readdirSync(FULL_DIR).filter(file => EXTENSIONS.test(file)) : [];
    
    // Create a map of baseName -> { origin: file, full: file }
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
        // Determine source file: use origin if available (master), else full (converted)
        // If origin is HEIC, we will convert and optionally delete it.
        
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
        
        const isHeic = ext === '.heic';
        let fullSrcPath = ''; 
        let mediumPathDisplay = `/photowall/thumbnails/medium/${baseName}.jpg`;
        let tinyPathDisplay = `/photowall/thumbnails/tiny/${baseName}.jpg`;

        try {
            let inputBuffer = fs.readFileSync(sourcePath);
            let sharpInstance;

            // Extract Date using exifr
            try {
                const meta = await exifr.parse(inputBuffer);
                if (meta && (meta.DateTimeOriginal || meta.CreateDate || meta.ModifyDate)) {
                    date = formatDate(meta.DateTimeOriginal || meta.CreateDate || meta.ModifyDate);
                }
            } catch (err) {}

            // Fallback Date
            if (!date && existingMap.has(locations.origin || locations.full)) {
                date = existingMap.get(locations.origin || locations.full).date;
            }
            if (!date) {
                date = formatDate(stats.mtime);
            }

            // 2. CONVERT / PREPARE IMAGE
            if (isHeic) {
                // Convert HEIC to JPEG in FULL_DIR
                const outputFullCjs = path.join(FULL_DIR, `${baseName}.jpg`);
                
                if (!fs.existsSync(outputFullCjs)) {
                    console.log(`  Converting HEIC to JPEG...`);
                    const jpegBuffer = await convert({
                        buffer: inputBuffer,
                        format: 'JPEG',
                        quality: 0.9
                    });
                    fs.writeFileSync(outputFullCjs, jpegBuffer);
                    inputBuffer = jpegBuffer; 
                } else {
                    inputBuffer = fs.readFileSync(outputFullCjs);
                }
                
                fullSrcPath = `/photowall/thumbnails/full/${baseName}.jpg`;
                finalFormat = 'JPEG';

                // DELETE HEIC FROM ORIGIN (User Request)
                try {
                    console.log(`  Deleting original HEIC file: ${file}`);
                    fs.unlinkSync(sourcePath);
                } catch (e) {
                    console.error('  Failed to delete HEIC:', e.message);
                }

            } else {
                // JPEG / PNG
                if (isOrigin) {
                    // It's in origin, so we use it as is (reference it)
                    // BUT: user structure says "full" has converted. 
                    // If it's already jpg in origin, we can just ref it.
                    fullSrcPath = `/photowall/origin/${file}`;
                } else {
                    // It's in full (already converted previously)
                    fullSrcPath = `/photowall/thumbnails/full/${file}`;
                }
                finalFormat = ext.substring(1).toUpperCase();
            }

            // 3. GENERATE THUMBNAILS
            const mediumFsPath = path.join(MEDIUM_DIR, `${baseName}.jpg`);
            const tinyFsPath = path.join(TINY_DIR, `${baseName}.jpg`);

            sharpInstance = sharp(inputBuffer);
            const metadata = await sharpInstance.metadata();
            width = metadata.width;
            height = metadata.height;

            if (!fs.existsSync(mediumFsPath)) {
                // console.log(`  Generating Medium Thumbnail...`);
                await sharpInstance
                    .clone()
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(mediumFsPath);
            }

            if (!fs.existsSync(tinyFsPath)) {
                // console.log(`  Generating Tiny Thumbnail...`);
                await sharpInstance
                    .clone()
                    .resize(50, 50, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 60 })
                    .toFile(tinyFsPath);
            }

            // 4. ADD TO METADATA
            let videoSrc = undefined;
            // Try to find videoSrc from existing meta
            // Check keys for both origin and full filename
            const key = locations.origin || locations.full;
            if (existingMap.has(key)) {
                videoSrc = existingMap.get(key).videoSrc;
            }

            newMetadata.push({
                filename: key, // Use the filename we found (origin preferred)
                originalSrc: fullSrcPath, // effectively the source we use for lightbox
                src: fullSrcPath,
                srcMedium: mediumPathDisplay,
                srcTiny: tinyPathDisplay,
                width,
                height,
                size: stats.size,
                format: finalFormat,
                date,
                videoSrc
            });

        } catch (err) {
            console.error(`  Error processing ${baseName}:`, err);
        }
    }

    // Sort by date descending
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
