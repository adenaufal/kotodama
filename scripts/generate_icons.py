import os
from PIL import Image

def generate_icons():
    source_path = os.path.join('public', 'source-logo.png')
    icons_dir = os.path.join('public', 'icons')
    
    if not os.path.exists(source_path):
        print(f"Error: Source image not found at {source_path}")
        return

    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)

    sizes = [16, 32, 48, 128]
    
    try:
        with Image.open(source_path) as img:
            # Ensure image is square
            width, height = img.size
            if width != height:
                print(f"Warning: Source image is not square ({width}x{height}). It will be resized/cropped.")
                
            for size in sizes:
                # Resize with high quality resampling
                icon_img = img.resize((size, size), Image.Resampling.LANCZOS)
                output_path = os.path.join(icons_dir, f'icon{size}.png')
                icon_img.save(output_path, "PNG")
                print(f"Generated {output_path}")
                
        print("Icon generation complete.")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    generate_icons()
