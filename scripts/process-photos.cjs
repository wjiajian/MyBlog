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

    const files = fs.readdirSync(ORIGIN_DIR).filter(file => EXTENSIONS.test(file));
    console.log(`Found ${files.length} images in origin.`);

    const newMetadata = [];

    for (const file of files) {
        const filePath = path.join(ORIGIN_DIR, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext); // filename without ext
        
        console.log(`Processing: ${file}`);

        let date = null;
        let width = 0;
        let height = 0;
        let finalFormat = 'JPEG';
        
        // Paths for generated files
        // Full: Only for HEIC converted, or logic described by user. 
        // User: "When uploaded is JPEG use origin... when heic use full"
        // But for consistency of filenames in 'full' dir, let's see.
        // Actually, let's keep it simple: 
        // 1. Convert HEIC to JPG in 'full'.
        // 2. JPG in origin is just referenced.
        // 3. To make frontend easy, 'src' property will point to the right place.
        
        const isHeic = ext === '.heic';
        let fullSrcPath = ''; // Relative path for frontend
        let mediumPathDisplay = `/photowall/thumbnails/medium/${baseName}.jpg`;
        let tinyPathDisplay = `/photowall/thumbnails/tiny/${baseName}.jpg`;

        try {
            // 1. EXTRACT DATA & PREPARE BUFFER
            let inputBuffer = fs.readFileSync(filePath);
            let sharpInstance;

            // Extract Date using exifr (handles HEIC and JPEG)
            try {
                // We parse metadata from original file
                const meta = await exifr.parse(inputBuffer);
                if (meta && (meta.DateTimeOriginal || meta.CreateDate || meta.ModifyDate)) {
                    date = formatDate(meta.DateTimeOriginal || meta.CreateDate || meta.ModifyDate);
                }
            } catch (err) {
                console.warn(`  Warning: Could not extract EXIF from ${file}`, err.message);
            }

            // Fallback Date
            if (!date && existingMap.has(file)) {
                date = existingMap.get(file).date;
            }
            if (!date) {
                date = formatDate(stats.mtime);
            }

            // 2. CONVERT / PREPARE IMAGE
            if (isHeic) {
                // Convert HEIC to JPEG
                const outputFullCjs = path.join(FULL_DIR, `${baseName}.jpg`);
                
                // If full image doesn't exist or is older, convert
                // Note: heic-convert gives raw/jpeg/png.
                if (!fs.existsSync(outputFullCjs)) {
                    console.log(`  Converting HEIC to JPEG...`);
                    const jpegBuffer = await convert({
                        buffer: inputBuffer,
                        format: 'JPEG',
                        quality: 0.9 // High quality for full image
                    });
                    fs.writeFileSync(outputFullCjs, jpegBuffer);
                    
                    // Update input buffer for thumbnail generation to use the converted JPEG version 
                    // (Sharp might handle HEIC but using the converted buffer is safer if Sharp lacks libheif)
                    inputBuffer = jpegBuffer; 
                } else {
                     // Load the converted jpeg for thumbnail processing just in case sharp needs it
                    inputBuffer = fs.readFileSync(outputFullCjs);
                }
                
                fullSrcPath = `/photowall/thumbnails/full/${baseName}.jpg`;
                finalFormat = 'JPEG';
            } else {
                // JPEG / PNG
                fullSrcPath = `/photowall/origin/${file}`;
                finalFormat = ext.substring(1).toUpperCase();
            }

            // 3. GENERATE THUMBNAILS
            // Always generate thumbnails as .jpg for consistency and size
            const mediumFsPath = path.join(MEDIUM_DIR, `${baseName}.jpg`);
            const tinyFsPath = path.join(TINY_DIR, `${baseName}.jpg`);

            sharpInstance = sharp(inputBuffer);
            const metadata = await sharpInstance.metadata();
            width = metadata.width;
            height = metadata.height;

            // Medium Thumbnail
            if (!fs.existsSync(mediumFsPath)) {
                console.log(`  Generating Medium Thumbnail...`);
                await sharpInstance
                    .clone()
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(mediumFsPath);
            }

            // Tiny Thumbnail
            if (!fs.existsSync(tinyFsPath)) {
                console.log(`  Generating Tiny Thumbnail...`);
                await sharpInstance
                    .clone()
                    .resize(50, 50, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 60 })
                    .toFile(tinyFsPath);
            }

            // 4. ADD TO METADATA
            // Preserve videoSrc if exists
            let videoSrc = undefined;
            if (existingMap.has(file)) {
                videoSrc = existingMap.get(file).videoSrc;
            }

            newMetadata.push({
                filename: file,
                // Helper mainly for debug, frontend uses src/srcMedium/srcTiny
                originalSrc: `/photowall/origin/${file}`, 
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
            console.error(`  Error processing ${file}:`, err);
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
