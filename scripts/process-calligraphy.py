from PIL import Image, ImageFilter
import numpy as np
import os

input_path = r"C:\Users\kic17\.gemini\antigravity-ide\brain\5dd6ece3-6058-4ad4-b3da-81485cf5b5ae\calligraphy_option_5_1787327770560.jpg"
output_path = r"c:\work\tour\public\calligraphy-title.png"

img = Image.open(input_path).convert("RGB")
data = np.array(img, dtype=np.float32)

# Calculate grayscale/luminance: 0.299 R + 0.587 G + 0.114 B
lum = 0.299 * data[:, :, 0] + 0.587 * data[:, :, 1] + 0.114 * data[:, :, 2]

# Paper background in option 5 is around luminance 235~245
# Ink luminance ranges from 30 to 180
# High-precision alpha extraction:
# Background (lum >= 232) -> alpha = 0 (100% transparent)
# Ink core (lum <= 160) -> alpha = 255 (solid rich ink)
# Smooth anti-aliasing gradient between 160 and 232
alpha_raw = np.clip((232.0 - lum) / (232.0 - 150.0) * 255.0, 0.0, 255.0).astype(np.uint8)

alpha_img = Image.fromarray(alpha_raw, mode="L")

# Apply slight stroke-thickening boost using MaxFilter(3) blended with original
# This slightly thickens the very thin hairline strokes by 1~1.5px so they are bold and crisp!
thickened = alpha_img.filter(ImageFilter.MaxFilter(3))
alpha_boosted = Image.blend(alpha_img, thickened, 0.65)
alpha_final = np.array(alpha_boosted, dtype=np.uint8)

# Target ink color is app ink #1c1c1a (28, 28, 26)
rgba = np.zeros((img.height, img.width, 4), dtype=np.uint8)
rgba[:, :, 0] = 28
rgba[:, :, 1] = 28
rgba[:, :, 2] = 26
rgba[:, :, 3] = alpha_final

out_img = Image.fromarray(rgba, mode="RGBA")

# Find bounding box where alpha > 10 to crop out all empty margins tightly
bbox = out_img.getbbox()
if bbox:
    pad = 12
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(out_img.width, bbox[2] + pad)
    bottom = min(out_img.height, bbox[3] + pad)
    out_img = out_img.crop((left, top, right, bottom))

out_img.save(output_path, "PNG", optimize=True)
print(f"Processed original calligraphy successfully! Cropped size: {out_img.size} saved to {output_path}")
