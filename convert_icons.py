#!/usr/bin/env python3
"""
Convert SVG icons to PNG for use in the web app and PWA
"""

import os
from PIL import Image
import cairosvg

def convert_svg_to_png(svg_path, output_path, size):
    """Convert SVG file to PNG with specified size"""
    cairosvg.svg2png(url=svg_path, write_to=output_path, output_width=size, output_height=size)
    print(f"Converted {svg_path} to {output_path} ({size}x{size})")

def create_pngs_from_svg():
    """Create all needed PNG icons from SVG source"""
    # Ensure directories exist
    os.makedirs("icons", exist_ok=True)
    
    # Define icon sizes needed for PWA
    sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512]
    
    # Convert main icon
    svg_file = "icons/icon-512x512.svg"
    for size in sizes:
        output_file = f"icons/icon-{size}x{size}.png"
        convert_svg_to_png(svg_file, output_file, size)
    
    # Create shortcut icons if they exist
    shortcut_icons = [
        ("icons/image-icon.svg", "icons/image-icon.png", 96),
        ("icons/document-icon.svg", "icons/document-icon.png", 96)
    ]
    
    for svg_path, png_path, size in shortcut_icons:
        if os.path.exists(svg_path):
            convert_svg_to_png(svg_path, png_path, size)

if __name__ == "__main__":
    create_pngs_from_svg()