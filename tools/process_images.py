#!/usr/bin/env python3
"""
Image Processor for Photo Wall
- Scans public/photowall for images/videos
- Generates multi-resolution thumbnails (Tiny 50px, Medium 400px)
- Extracts metadata (dimensions, size, exif) to JSON
- Handles HEIC conversion (if pillow-heif is installed)
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime

# Install dependencies if missing
try:
    from PIL import Image, ExifTags
except ImportError:
    print("Installing Pillow...")
    os.system(f"{sys.executable} -m pip install Pillow")
    from PIL import Image, ExifTags

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HAS_HEIF = True
except ImportError:
    print("pillow-heif not found. HEIC support limited. Install with: pip install pillow-heif")
    HAS_HEIF = False

# Configuration
BASE_DIR = Path(__file__).parent.parent / "public" / "photowall"
SOURCE_DIR = BASE_DIR / "origin"  # Scan originals here
OUTPUT_DIR = BASE_DIR             # Metadata goes to public/photowall root
THUMB_DIR = BASE_DIR / "thumbnails"

# Thumbnail sizes (height in pixels)
SIZES = {
    "tiny": 50,      # For thumbnail list
    "medium": 400,   # For photo wall grid
    "full": 2560,    # Web-friendly full size (compressed JPG), max height
}

SUPPORTED_IMAGES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
SUPPORTED_VIDEOS = {".mov", ".mp4", ".webm"}

def get_image_metadata(img_path):
    """Extract metadata from image."""
    try:
        with Image.open(img_path) as img:
            width, height = img.size
            
            # Extract basic EXIF
            exif_date = None
            if hasattr(img, "_getexif") and img._getexif():
                exif = {
                    ExifTags.TAGS[k]: v
                    for k, v in img._getexif().items()
                    if k in ExifTags.TAGS
                }
                # Try to get date from various tags
                date_str = exif.get("DateTimeOriginal") or exif.get("DateTimeDigitized") or exif.get("DateTime")
                if date_str:
                    try:
                        # Normalize format if needed (usually YYYY:MM:DD HH:MM:SS)
                        exif_date = date_str
                    except Exception:
                        pass
            
            # If no EXIF date, try file modification time as fallback?
            # User specifically asked for "shooting time" (拍摄时间), so maybe fallback to mtime if needed,
            # or just leave None and sort these latast/earliest.
            # Let's fallback to mtime if no EXIF, as "newest file" often means "newest photo" for non-camera sources.
            if not exif_date:
                mtime = img_path.stat().st_mtime
                exif_date = datetime.fromtimestamp(mtime).strftime("%Y:%m:%d %H:%M:%S")

            # Basic info
            meta = {
                "filename": img_path.name,
                "width": width,
                "height": height,
                "size": img_path.stat().st_size,
                "format": img.format,
                "date": exif_date,
            }
            return meta
    except Exception as e:
        print(f"Error reading metadata for {img_path.name}: {e}")
        return None

def generate_thumbnails(img_path, base_name):
    """Generate thumbnails for a single image."""
    try:
        with Image.open(img_path) as img:
            # Convert to RGB if necessary
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
                
            original_width, original_height = img.size
            
            for size_name, target_height in SIZES.items():
                ratio = target_height / original_height
                new_width = int(original_width * ratio)
                new_height = target_height
                
                output_folder = THUMB_DIR / size_name
                output_folder.mkdir(parents=True, exist_ok=True)
                
                output_path = output_folder / f"{base_name}.jpg"
                
                # Resize
                if original_height > target_height:
                    resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                else:
                    resized = img.copy()
                
                # Save
                quality = 60 if size_name == "tiny" else 85
                resized.save(output_path, "JPEG", quality=quality, optimize=True)
                
    except Exception as e:
        print(f"Error generating thumbnails for {img_path.name}: {e}")

def process_images():
    print(f"Scanning {SOURCE_DIR}...")
    
    if not SOURCE_DIR.exists():
        print(f"Source directory {SOURCE_DIR} does not exist!")
        return

    metadata_list = []
    
    # Get all files
    files = sorted([f for f in SOURCE_DIR.iterdir() if f.is_file()])
    
    for idx, f in enumerate(files, 1):
        if f.suffix.lower() in SUPPORTED_IMAGES:
            print(f"[{idx}/{len(files)}] Processing Image: {f.name}")
            
            # Metadata
            meta = get_image_metadata(f)
            if meta:
                # Check for Live Photo video
                base_name = f.stem
                video_name = None
                for vid_ext in SUPPORTED_VIDEOS:
                    vid_path = SOURCE_DIR / (base_name + vid_ext)
                    if vid_path.exists():
                        video_name = vid_path.name
                        break
                
                if video_name:
                    meta["videoSrc"] = f"/photowall/origin/{video_name}"
                    print(f"  Found Live Photo video: {video_name}")

                metadata_list.append(meta)
                
                # Thumbnails
                generate_thumbnails(f, base_name)
                
        elif f.suffix.lower() in SUPPORTED_VIDEOS:
            # Skip video files content processing, handled via image association
            pass
            
    # Save metadata.json
    json_path = OUTPUT_DIR / "images-metadata.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metadata_list, f, indent=2, ensure_ascii=False)
        
    print(f"\nSaved metadata for {len(metadata_list)} images to {json_path}")

if __name__ == "__main__":
    process_images()
