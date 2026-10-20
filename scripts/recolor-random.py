"""Recolour a mockup render's warm background (a radial vignette, the devices'
soft shadows on it) to a flat target colour, leaving the devices and their
screens as they are.

Per pixel: r = frame / background. The background and the shadows on it are
the background darkened evenly (r the same in every channel, never above 1);
a device or a screen is not (another hue, or brighter). Where a pixel reads as
background it is moved by target / background, so a shadow stays a shadow of
the same depth, on the target colour; elsewhere nothing changes. The weight
is worked out on 4x4 blocks (noise averages out), grown a block into the
devices' edges (no warm fringe left round them) and eased in between.

usage: python3 scripts/recolor-random.py SRC DST CRF [--frames N] [--debug DIR]
  e.g. python3 scripts/recolor-random.py render.mp4 public/random/name.mp4 23
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


def upsample(a, h, w):
    """Bilinear, from block centres, to the full frame."""
    ph, pw = a.shape[:2]
    ys = (np.arange(h) + 0.5) * ph / h - 0.5
    xs = (np.arange(w) + 0.5) * pw / w - 0.5
    y0 = np.clip(np.floor(ys).astype(int), 0, ph - 1)
    x0 = np.clip(np.floor(xs).astype(int), 0, pw - 1)
    y1 = np.clip(y0 + 1, 0, ph - 1)
    x1 = np.clip(x0 + 1, 0, pw - 1)
    fy = np.clip(ys - y0, 0, 1)[:, None]
    fx = np.clip(xs - x0, 0, 1)[None, :]
    top = a[y0][:, x0] * (1 - fx) + a[y0][:, x1] * fx
    bot = a[y1][:, x0] * (1 - fx) + a[y1][:, x1] * fx
    return top * (1 - fy) + bot * fy


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


def weights(frame, bg4):
    f4 = pool(frame, 4)
    r = f4 / bg4
    mean = np.maximum(r.mean(axis=2), 1e-3)
    c1 = (r[..., 0] - r[..., 2]) / mean
    c2 = (r[..., 1] - (r[..., 0] + r[..., 2]) / 2) / mean
    # Near black the hue is noise; the move there is a level at most anyway.
    chroma = np.where(mean < 0.06, 0.0, np.sqrt(c1 * c1 + c2 * c2))
    bright = r.max(axis=2)
    w = (np.clip((0.03 - chroma) / 0.015, 0, 1) * np.clip((1.035 - bright) / 0.02, 0, 1)
         # A shadow on the background is never this dark; a device's black is.
         * np.clip((mean - 0.3) / 0.2, 0, 1))
    # Only what reaches the frame's edge is background: the background and the
    # shadows on it always do, a grey inside a window or a screen never does.
    lab, _ = ndimage.label(w > 0.3)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    w = w * np.isin(lab, edge[edge > 0])
    # Grow the background a block into the devices' edges: an edge pixel of a
    # device moved a little is invisible; a background pixel left warm is a fringe.
    g = w.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            g = np.maximum(g, np.roll(np.roll(w, dy, 0), dx, 1))
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('crf')
    ap.add_argument('--frames', type=int, default=0)
    ap.add_argument('--debug')
    a = ap.parse_args()
    w, h, n, fps, dur = probe(a.src)
    bg, rms, share = fit_background(a.src, w, h)
    print(f'{a.src}: {w}x{h} {fps:g}fps {n} frames; background fit rms {rms:.2f} levels over {share:.0%} of the frame', file=sys.stderr)
    print(f'  background corners {bg[0, 0].round()} {bg[-1, -1].round()} centre {bg[h // 2, w // 2].round()}', file=sys.stderr)
    m = TARGET / bg
    bg4 = pool(bg, 4)
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
        wt = upsample(weights(f, bg4), h, w)[..., None]
        out = np.clip(f * (1 + wt * (m - 1)) + 0.5, 0, 255).astype(np.uint8)
        enc.stdin.write(out.tobytes())
        if a.debug and i in (0, n // 2 if n else 60):
            from PIL import Image
            Image.fromarray(out).save(f'{a.debug}/out-{i}.png')
            Image.fromarray(f.astype(np.uint8)).save(f'{a.debug}/in-{i}.png')
            Image.fromarray((upsample(weights(f, bg4), h, w) * 255).astype(np.uint8)).save(f'{a.debug}/w-{i}.png')
        done += 1
    enc.stdin.close()
    enc.wait()
    print(f'  wrote {done} frames to {a.dst}', file=sys.stderr)


if __name__ == '__main__':
    main()
