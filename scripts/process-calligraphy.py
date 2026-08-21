from PIL import Image
import numpy as np
import os

input_path = r"C:\Users\kic17\.gemini\antigravity-ide\brain\5dd6ece3-6058-4ad4-b3da-81485cf5b5ae\calligraphy_cursive_bold_1787328094916.jpg"
output_path = r"c:\work\tour\public\calligraphy-title.png"

img = Image.open(input_path).convert("RGB")
data = np.array(img, dtype=np.float32)

# Calculate grayscale/luminance: 0.299 R + 0.587 G + 0.114 B
lum = 0.299 * data[:, :, 0] + 0.587 * data[:, :, 1] + 0.114 * data[:, :, 2]

# Thresholding & Smooth Alpha curve
# Background white/cream luminance is typically > 230
# Ink luminance is typically < 120
# Map luminance: lum >= 240 -> alpha = 0; lum <= 90 -> alpha = 255; linear in between
alpha = np.clip((240.0 - lum) / (240.0 - 90.0) * 255.0, 0.0, 255.0).astype(np.uint8)

# Target ink color is app ink #1c1c1a (28, 28, 26)
rgba = np.zeros((img.height, img.width, 4), dtype=np.uint8)
rgba[:, :, 0] = 28
rgba[:, :, 1] = 28
rgba[:, :, 2] = 26
rgba[:, :, 3] = alpha

out_img = Image.fromarray(rgba, mode="RGBA")

# Find bounding box where alpha > 15 to crop out all empty margins
bbox = out_img.getbbox()
if bbox:
    # Add a small 16px safety padding
    pad = 16
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(out_img.width, bbox[2] + pad)
    bottom = min(out_img.height, bbox[3] + pad)
    out_img = out_img.crop((left, top, right, bottom))

out_img.save(output_path, "PNG", optimize=True)
print(f"Processed successfully! Cropped size: {out_img.size} saved to {output_path}")
