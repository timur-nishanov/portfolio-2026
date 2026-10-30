"""Flatten a mockup render's background (a radial vignette, the devices' soft
shadows on it) to one flat colour, the case cards' grey, leaving the devices
and their screens as they are.

Per pixel: r = frame / background. The background and the shadows on it are
the background darkened evenly (r the same in every channel, never above 1)
and change slowly from pixel to pixel; a device or a screen is another hue,
brighter, or ends at a sharp edge. The flat colour floods in from the frame's
edges, from where it is plain background, over everything that reads as
background or shadow, and stops at the devices' edges: a grey part of a
device (an iMac's stand) is walled off by its own outline, even where it
runs off the frame. Flooded pixels take the flat colour, eased in over a
pixel at the edge of the flood; elsewhere nothing changes. Works as well on a
clip already recoloured, with its shadows kept (the vignette's banding and
the shadows go).

Where a grey part of a device fades into the background with no edge at all
(an iMac's chin at its right end), --keep fences it in by hand: a box
x0:y0:x1:y1 in the frame's pixels the flood never enters (as many as needed).

usage: python3 scripts/recolor-random.py SRC DST CRF [--keep X0:Y0:X1:Y1 ...] [--frames N] [--debug DIR]
  e.g. python3 scripts/recolor-random.py render.mp4 public/random/name.mp4 20
  the iMac in public/random/moneta-site.mp4 and stepicon-site.mp4: --keep 248:700:1353:819
needs ffmpeg, and numpy and scipy for Python. The poster is the new first
frame, as the others are (public/random/*.webp).
"""

import argparse
import json
import subprocess
import sys

import numpy as np
from scipy import ndimage

TARGET = np.array([0xE6, 0xE6, 0xE7], np.float32)  # the case cards (.cs-card)


def probe(path):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height,nb_frames,r_frame_rate',
         '-show_entries', 'format=duration', '-of', 'json', path], capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    s = j['streams'][0]
    num, den = s['r_frame_rate'].split('/')
    return int(s['width']), int(s['height']), int(s.get('nb_frames') or 0), int(num) / int(den), float(j['format']['duration'])


DECODE = 'scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24'


def read_frames(path, w, h, vf=DECODE):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    p.wait()


def pool(a, k):
    h, w = a.shape[:2]
    return a[: h - h % k, : w - w % k].reshape(h // k, k, w // k, k, *a.shape[2:]).mean(axis=(1, 3))


def design(h, w):
    v, u = np.mgrid[0:h, 0:w].astype(np.float64)
    u = u / (w - 1) - 0.5
    v = v / (h - 1) - 0.5
    terms = [u ** i * v ** j for i in range(5) for j in range(5) if i + j <= 4]
    return np.stack([t.ravel() for t in terms], axis=1)


def fit_background(path, w, h, samples=40):
    """The background without the devices: a smooth field fitted to the
    per-pixel median of frames across the clip, shadows and devices left out
    by refitting to what stays close to it."""
    _, _, _, fps, dur = probe(path)
    vf = f'fps={samples / dur},' + DECODE
    frames = [pool(f.astype(np.float32), 8) for f in read_frames(path, w, h, vf)]
    med = np.median(np.stack(frames), axis=0)  # (h/8, w/8, 3)
    ph, pw = med.shape[:2]
    X = design(ph, pw)
    corner = med[:4, :4].reshape(-1, 3).mean(axis=0)
    keep = (np.abs(med - corner) < 14).all(axis=2).ravel()
    coef = None
    for _ in range(6):
        coef, *_ = np.linalg.lstsq(X[keep], med.reshape(-1, 3)[keep], rcond=None)
        fit = (X @ coef).reshape(ph, pw, 3)
        res = med - fit
        keep = (np.abs(res) < 2.5).all(axis=2).ravel()
    fit = (X @ coef).reshape(ph, pw, 3)
    rms = np.sqrt(((med - fit) ** 2).reshape(-1, 3)[keep].mean())
    Xf = design(h, w)
    return (Xf @ coef).reshape(h, w, 3).astype(np.float32), rms, keep.mean()


def flood(frame, bg, keep):
    """How much of each pixel is background (1) or device (0); never in keep."""
    r = frame / bg
    mean = r.mean(axis=2)
    chroma = np.abs(r - mean[..., None]).max(axis=2)
    # An edge is a step: steeper close up than from further off, where a
    # shadow's ramp is as steep either way. A device's grey part (an iMac's
    # chin) is fenced in by its outline even where the step is a few levels.
    g = frame.mean(axis=2)
    g1 = ndimage.gaussian_filter(g, 1.0)
    g3 = ndimage.gaussian_filter(g, 3.0)
    grad1 = np.hypot(ndimage.sobel(g1, 0), ndimage.sobel(g1, 1)) / 8
    grad3 = np.hypot(ndimage.sobel(g3, 0), ndimage.sobel(g3, 1)) / 8
    edge = ndimage.binary_dilation((grad1 - grad3 > 0.8) | (grad1 > 6))
    grey = (chroma < 0.02) & (mean > 0.6) & (mean < 1.02) & ~keep
    lab, _ = ndimage.label(grey & ~edge, structure=np.ones((3, 3)))
    # It comes in where the frame's edge is plain background.
    border = np.zeros_like(edge)
    border[0] = border[-1] = True
    border[:, 0] = border[:, -1] = True
    seeds = np.unique(lab[border & ~edge & grey & (np.abs(mean - 1) < 0.015)])
    w = np.isin(lab, seeds[seeds > 0])
    # And on up to the devices' edges, over the shadow left in the fence: no
    # dark line round a device where its shadow was.
    w |= ndimage.binary_dilation(w, iterations=2) & grey & (mean < 1)
    # Specks of background the tests missed, here and there in the flood.
    lab, n = ndimage.label(~w)
    size = ndimage.sum(np.ones_like(mean), lab, np.arange(1, n + 1))
    speck = np.isin(lab, np.arange(1, n + 1)[size < 64]) & (np.abs(mean - 1) < 0.04) & (chroma < 0.03) & ~keep
    w = (w | speck).astype(np.float32)
    return np.maximum(w, ndimage.gaussian_filter(w, 0.6))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('crf')
    ap.add_argument('--keep', action='append', default=[])
    ap.add_argument('--frames', type=int, default=0)
    ap.add_argument('--debug')
    a = ap.parse_args()
    w, h, n, fps, dur = probe(a.src)
    bg, rms, share = fit_background(a.src, w, h)
    keep = np.zeros((h, w), bool)
    for box in a.keep:
        x0, y0, x1, y1 = (int(v) for v in box.split(':'))
        keep[y0:y1, x0:x1] = True
    print(f'{a.src}: {w}x{h} {fps:g}fps {n} frames; background fit rms {rms:.2f} levels over {share:.0%} of the frame', file=sys.stderr)
    print(f'  background corners {bg[0, 0].round()} {bg[-1, -1].round()} centre {bg[h // 2, w // 2].round()}', file=sys.stderr)
    enc = subprocess.Popen(
        ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-r', f'{fps:g}', '-i', '-',
         '-vf', 'scale=out_color_matrix=bt709:in_range=pc:out_range=tv,format=yuv420p',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', a.crf, '-profile:v', 'high',
         '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
         '-movflags', '+faststart', '-an', a.dst], stdin=subprocess.PIPE)
    done = 0
    for i, f in enumerate(read_frames(a.src, w, h)):
        if a.frames and i >= a.frames:
            break
        f = f.astype(np.float32)
        wt = flood(f, bg, keep)[..., None]
        out = np.clip(f + wt * (TARGET - f) + 0.5, 0, 255).astype(np.uint8)
        enc.stdin.write(out.tobytes())
        if a.debug and i in (0, n // 2 if n else 60):
            from PIL import Image
            Image.fromarray(out).save(f'{a.debug}/out-{i}.png')
            Image.fromarray(f.astype(np.uint8)).save(f'{a.debug}/in-{i}.png')
            Image.fromarray((wt[..., 0] * 255).astype(np.uint8)).save(f'{a.debug}/w-{i}.png')
        done += 1
    enc.stdin.close()
    enc.wait()
    print(f'  wrote {done} frames to {a.dst}', file=sys.stderr)


if __name__ == '__main__':
    main()
