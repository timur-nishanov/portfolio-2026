"""The tab and home-screen icons, from the still head (public/head/head.webp).

    python3 scripts/render-icons.py public/head/head.webp <out dir>

The head is lit as StaticHead lights it (brightness .8, contrast .9,
saturation 1.35), cropped to its opaque bounds, and centred:
- icon-*.png: transparent background (browser tabs); icon-48 is src/app/icon.png
- apple-icon.png: on the page's colour (#f7f7f5), iOS rounds it itself
  (src/app/apple-icon.png)
- favicon.ico: 16/32/48 from the transparent set (src/app/favicon.ico)
Copy the three into src/app; Next serves them from there. Needs Pillow.
"""
import sys
from PIL import Image, ImageEnhance

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')

# StaticHead's light, approximated with PIL's enhancers on the colour only.
rgb = im.convert('RGB')
rgb = ImageEnhance.Brightness(rgb).enhance(0.8)
rgb = ImageEnhance.Contrast(rgb).enhance(0.9)
rgb = ImageEnhance.Color(rgb).enhance(1.35)
im = Image.merge('RGBA', (*rgb.split(), im.split()[-1]))

bb = im.getbbox()
head = im.crop(bb)
w, h = head.size


def square(size, pad, bg=None):
    inner = size - 2 * pad
    s = min(inner / w, inner / h)
    hw, hh = round(w * s), round(h * s)
    canvas = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    scaled = head.resize((hw, hh), Image.LANCZOS)
    canvas.alpha_composite(scaled, ((size - hw) // 2, (size - hh) // 2))
    return canvas


for size in (16, 32, 48, 64, 192, 512):
    square(size, round(size * 0.04)).save(f'{out}/icon-{size}.png')
square(180, 18, (247, 247, 245, 255)).convert('RGB').save(f'{out}/apple-icon.png')
square(32, 1).save(f'{out}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('icons written')
