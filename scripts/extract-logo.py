from PIL import Image, ImageFilter
import numpy as np

input_path = r"C:\Users\kic17\.gemini\antigravity-ide\brain\5dd6ece3-6058-4ad4-b3da-81485cf5b5ae\nav_mockups_comparison_1787328972252.jpg"
output_path = r"c:\work\tour\public\pack-to-go-logo.png"

img = Image.open(input_path).convert("RGB")

# Crop the exact logo region from the olive navbar
logo_crop = img.crop((128, 569, 324, 631))

# Upscale 3x with high quality Lanczos filter for razor-sharp Retina rendering
scale = 3
w, h = logo_crop.size[0] * scale, logo_crop.size[1] * scale
upscaled = logo_crop.resize((w, h), Image.Resampling.LANCZOS)

arr = np.array(upscaled, dtype=np.float32)

# Background color in the olive navbar is approximately RGB(46, 59, 24)
bg_color = np.array([46.0, 59.0, 24.0])

# Calculate color distance and luminance to extract pure foreground lettering
diff = arr - bg_color
dist = np.linalg.norm(diff, axis=2)
lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]

# Alpha thresholding:
# Dist < 22 is pure background (alpha = 0)
# Dist > 60 is solid lettering (alpha = 255)
alpha = np.clip((dist - 22.0) / (60.0 - 22.0) * 255.0, 0.0, 255.0).astype(np.uint8)

# Target lettering color: preserve warm golden ivory #fefae0 (254, 250, 224)
# with original subtle shading
rgba = np.zeros((h, w, 4), dtype=np.uint8)
rgba[:, :, 0] = np.clip(arr[:, :, 0] * 1.05 + 10, 0, 255).astype(np.uint8)
rgba[:, :, 1] = np.clip(arr[:, :, 1] * 1.05 + 10, 0, 255).astype(np.uint8)
rgba[:, :, 2] = np.clip(arr[:, :, 2] * 1.08 + 15, 0, 255).astype(np.uint8)
rgba[:, :, 3] = alpha

out_img = Image.fromarray(rgba, mode="RGBA")

# Bounding box crop to remove any edge padding
bbox = out_img.getbbox()
if bbox:
    pad = 4
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(out_img.width, bbox[2] + pad)
    bottom = min(out_img.height, bbox[3] + pad)
    out_img = out_img.crop((left, top, right, bottom))

out_img.save(output_path, "PNG", optimize=True)
print(f"Extracted original mockup logo successfully! Cropped size: {out_img.size} saved to {output_path}")
