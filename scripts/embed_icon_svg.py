
import base64
import os

def embed_icon_in_svg():
    icon_path = os.path.join('public', 'icons', 'icon128.png')
    svg_path = os.path.join('public', 'icons', 'kotodama-button.svg')
    
    if not os.path.exists(icon_path):
        print(f"Error: Icon not found at {icon_path}")
        return

    with open(icon_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
    svg_content = f'''<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="128" height="128" xlink:href="data:image/png;base64,{encoded_string}"/>
</svg>'''

    with open(svg_path, "w") as svg_file:
        svg_file.write(svg_content)
        
    print(f"Embedded icon in {svg_path}")

if __name__ == "__main__":
    embed_icon_in_svg()
