from PIL import Image, ImageFilter
import numpy as np

input_path = r"C:\Users\kic17\.gemini\antigravity-ide\brain\5dd6ece3-6058-4ad4-b3da-81485cf5b5ae\calligraphy_option_5_1787327770560.jpg"
output_path = r"c:\work\tour\public\calligraphy-title.png"

img = Image.open(input_path).convert("RGB")
data = np.array(img, dtype=np.float32)

# Calculate grayscale/luminance
lum = 0.299 * data[:, :, 0] + 0.587 * data[:, :, 1] + 0.114 * data[:, :, 2]

# In option 5:
# Paper texture is luminance 225 ~ 255.
# Ink is luminance 20 ~ 170.
# Any pixel with lum >= 205 is 100% background (alpha = 0) with zero noise.
# Ink core (lum <= 110) has alpha = 255.
alpha_raw = np.zeros_like(lum)
mask = lum < 205.0
alpha_raw[mask] = np.clip((205.0 - lum[mask]) / (205.0 - 100.0) * 255.0, 0.0, 255.0)
alpha_raw = alpha_raw.astype(np.uint8)

alpha_img = Image.fromarray(alpha_raw, mode="L")

# Apply subtle stroke thickening on ink pixels only
thickened = alpha_img.filter(ImageFilter.MaxFilter(3))
alpha_boosted = Image.blend(alpha_img, thickened, 0.5)

# Hard cutoff on very faint noise
alpha_final = np.array(alpha_boosted, dtype=np.uint8)
alpha_final[alpha_final < 18] = 0

# App ink color #1c1c1a (28, 28, 26)
rgba = np.zeros((img.height, img.width, 4), dtype=np.uint8)
rgba[:, :, 0] = 28
rgba[:, :, 1] = 28
rgba[:, :, 2] = 26
rgba[:, :, 3] = alpha_final

out_img = Image.fromarray(rgba, mode="RGBA")

# Bounding box crop
bbox = out_img.getbbox()
if bbox:
    pad = 8
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(out_img.width, bbox[2] + pad)
    bottom = min(out_img.height, bbox[3] + pad)
    out_img = out_img.crop((left, top, right, bottom))

out_img.save(output_path, "PNG", optimize=True)
print(f"Processed crystal clean! Size: {out_img.size}")
