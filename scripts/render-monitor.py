"""Draw the monitor the home page's cards show (MonitorMockup), front on: a 27"
5K display with a black glass front on an aluminium stand, its screen cut
out for the recording that plays under it.

It is drawn here from shapes and gradients, not from a photo or vendor
artwork: each edge gets its coverage from a signed distance, at SS times the
size, and the result is scaled down. The sizes are the product's, in the
output's pixels: the display is 623 mm wide, so 1 mm is 1600 / 623 = 2.57 px.

The screen's box below (SCREEN) is what MonitorMockup puts the recording in;
change one, change the other.

usage: python3 scripts/render-monitor.py public/mockups/monitor-frame.webp
needs numpy, scipy and Pillow.
"""

import sys

import numpy as np
from PIL import Image
from scipy import ndimage

W, H = 1600, 1232
SS = 3  # supersampling

# The display: the whole width, 362 mm tall, small round corners.
DISP = (0, 0, 1600, 930)
DISP_R = 16
# The screen, 16:9 in a near even bezel (33 px, 13 mm).
SCREEN = (33, 33, 1567, 896)
CAMERA = (800, 16.5)
# The stand: one aluminium sheet, 152 mm wide, down from behind the display
# and bent forward at the bottom into the foot; 116 mm of it shows.
ARM = (605, 995)
BEND = (1199.5, 1213.0)
SEAM = (1213.0, 1214.2)
FOOT = (1214.2, 1228.0)
HOLE = (800, 911.3, 54.0, 4.4)  # the cable hole: centre, radius, chamfer

ys, xs = np.mgrid[0:H * SS, 0:W * SS].astype(np.float32)
X, Y = (xs + 0.5) / SS, (ys + 0.5) / SS
del xs, ys


def cov(d):
    """Coverage from a signed distance in output pixels (negative inside)."""
    return np.clip(0.5 - d * SS, 0.0, 1.0)


def rrect(x0, y0, x1, y1, r):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    qx, qy = np.abs(X - cx) - ((x1 - x0) / 2 - r), np.abs(Y - cy) - ((y1 - y0) / 2 - r)
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r


def circle(cx, cy, r):
    return np.hypot(X - cx, Y - cy) - r


def profile(v, stops):
    """Piecewise linear through (position, value) stops."""
    p, q = zip(*stops)
    return np.interp(v, p, q).astype(np.float32)


def grey(lum, tint=(0, 1, 3)):
    """A neutral grey, a touch cool, as anodised aluminium and dark glass are."""
    return np.stack([lum + tint[0], lum + tint[1], lum + tint[2]], -1)


rng = np.random.default_rng(7)


def grain(amount):
    """The aluminium's fine grain: noise a little over a pixel across."""
    n = ndimage.gaussian_filter(rng.standard_normal((H * SS, W * SS)).astype(np.float32), 0.6 * SS)
    return n / n.std() * amount


# Premultiplied RGBA, painted back to front.
canvas = np.zeros((H * SS, W * SS, 4), np.float32)


def over(rgb, a):
    a = a[..., None]
    canvas[..., :3] = rgb * a + canvas[..., :3] * (1 - a)
    canvas[..., 3:] = a + canvas[..., 3:] * (1 - a)


# --- the stand -------------------------------------------------------------------
x0, x1 = ARM
u = (X - (x0 + x1) / 2) / ((x1 - x0) / 2)  # -1..1 across the sheet
edge = np.minimum(X - x0, x1 - X)  # px in from its nearer side

# The arm, in the display's shadow at the top and opening up below; its cut
# edges catch the light, a hairline each side.
lum = profile(Y, [(900, 158), (931, 158), (935, 169), (960, 181), (1000, 195), (1050, 206), (1100, 212),
                  (1160, 214), (1199.5, 211)])
lum = lum * (1 - 0.03 * u ** 6) + grain(1.6) + 10 * np.clip(1.4 - edge, 0, 1)
# The cable hole through it, the chamfer round it lit from above, and a soft
# shade where the sheet turns into the chamfer.
hx, hy, hr, hc = HOLE
lit = np.clip(np.sin(np.arctan2(Y - hy, X - hx)), 0, 1)  # 1 straight below the centre
in_cham = cov(circle(hx, hy, hr + hc)) * (1 - cov(circle(hx, hy, hr)))
lum = lum * (1 - in_cham) + profile(lit, [(0, 196), (0.5, 222), (1, 246)]) * in_cham
lum -= 7 * np.clip(1 - circle(hx, hy, hr + hc) / 5, 0, 1) * (1 - cov(circle(hx, hy, hr + hc)))
over(grey(lum), cov(rrect(x0, 880, x1, BEND[1] + 2, 1.0)) * (1 - cov(circle(hx, hy, hr))))

# The bend, where the sheet turns forward toward the viewer: a band of light.
lum = profile(Y, [(BEND[0], 211), (BEND[0] + 4.5, 232), (BEND[0] + 8, 245), (BEND[0] + 10.5, 236), (BEND[1], 206)])
over(grey(lum + grain(1.0) + 8 * np.clip(1.4 - edge, 0, 1)), cov(rrect(x0, BEND[0], x1, BEND[1], 0.8)))

# Rubber feet, peeking out under the foot's corners.
for fx in (x0 + 7, x1 - 41):
    over(grey(np.full_like(X, 38.0), (0, 0, 2)), cov(rrect(fx, FOOT[1] - 2, fx + 34, FOOT[1] + 2.6, 1.3)))

# The seam between the bend and the foot, then the foot's front edge.
over(grey(np.full_like(X, 148.0)), cov(rrect(x0 + 0.5, SEAM[0], x1 - 0.5, SEAM[1], 0.3)))
lum = profile(Y, [(FOOT[0], 240), (FOOT[0] + 1.6, 230), (FOOT[0] + 6, 221), (FOOT[1] - 1.6, 214), (FOOT[1], 192)])
over(grey(lum + grain(1.0) - 14 * np.clip(1.6 - edge, 0, 1) / 1.6), cov(rrect(x0, FOOT[0], x1, FOOT[1], 2.6)))

# --- the display -------------------------------------------------------------------
dx0, dy0, dx1, dy1 = DISP
body = rrect(dx0, dy0, dx1, dy1, DISP_R)
t = (Y - (dy0 + dy1) / 2) / ((dy1 - dy0) / 2)  # -1 at the top .. 1 at the bottom
# Black glass, a shade lighter at the top; round it the aluminium rim, lit
# along the top and in shade below.
rim = np.clip(1 + body / 1.3, 0, 1)  # 1 at the outer edge, 0 from 1.3 px in
lum = profile(t, [(-1, 21), (1, 14)]) * (1 - rim) + profile(t, [(-1, 70), (-0.9, 50), (0.9, 40), (1, 28)]) * rim
# The panel's black border round the screen, a shade lighter than the glass.
sx0, sy0, sx1, sy1 = SCREEN
lip = cov(rrect(sx0 - 2.0, sy0 - 2.0, sx1 + 2.0, sy1 + 2.0, 1.0))
over(grey(lum * (1 - lip) + 31 * lip, (0, 1, 2)), cov(body))

# The camera, barely there.
cx, cy = CAMERA
over(grey(np.full_like(X, 27.0)), cov(circle(cx, cy, 4.0)))
over(grey(np.full_like(X, 8.0)), cov(circle(cx, cy, 2.3)))
over(grey(np.full_like(X, 64.0), (0, 4, 10)), 0.5 * cov(circle(cx - 0.9, cy - 0.9, 0.75)))

# The screen: cut out, for the recording under it.
canvas *= (1 - cov(rrect(sx0, sy0, sx1, sy1, 0.5)))[..., None]

# --- down to size ------------------------------------------------------------------
small = canvas.reshape(H, SS, W, SS, 4).mean(axis=(1, 3))
a = small[..., 3:]
rgb = np.where(a > 1e-4, small[..., :3] / np.maximum(a, 1e-4), 0)
img = Image.fromarray(np.round(np.concatenate([np.clip(rgb, 0, 255), a * 255], -1)).astype(np.uint8), 'RGBA')
out = sys.argv[1]
if out.endswith('.webp'):
    img.save(out, 'WEBP', lossless=True, method=6)  # lossy blots the grain
else:
    img.save(out)
print(f'{out}: {W}x{H}, screen x {sx0}..{sx1}, y {sy0}..{sy1}')
