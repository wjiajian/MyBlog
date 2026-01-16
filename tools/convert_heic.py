import os
from PIL import Image
from pillow_heif import register_heif_opener

# Register HEIC opener
register_heif_opener()

directory = 'public/images/2025-summary'

for filename in os.listdir(directory):
    if filename.lower().endswith('.heic'):
        heic_path = os.path.join(directory, filename)
        png_path = os.path.join(directory, os.path.splitext(filename)[0] + '.png')
        
        print(f"Converting {filename} to PNG...")
        try:
            image = Image.open(heic_path)
            image.save(png_path, "PNG")
            print(f"Saved {png_path}")
            # Remove original HEIC file
            os.remove(heic_path) 
        except Exception as e:
            print(f"Failed to convert {filename}: {e}")

print("Conversion complete.")
