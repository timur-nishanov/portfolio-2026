/**
 * The pill's (and the round buttons') displacement map, worked out once on
 * the CPU instead of by the filter on every frame (PillGlassFilter).
 *
 * In the filter the map is a chain of a dozen primitives — the shape, a blur
 * into a ramp, four offsets, two differences — and Chromium keeps no result
 * between them: every primitive that reads the map runs the whole chain
 * again, and the dispersion reads it three times (one bend per channel). So
 * each frame of a scroll re-derived the same static image ~60 times per
 * glass surface, ~60 GPU passes for a 20px button. Here it is the same
 * arithmetic, step for step, done once:
 *
 * - the shape is the same SVG image, rasterised the way the filter gets it
 *   (at 1x, then stretched to the screen's pixels with bilinear sampling);
 * - the ramp is the same Gaussian, with Skia's own shortcut for a wide one
 *   (halve the image until σ ≤ 4, blur, stretch back), kept to 8 bits as the
 *   filter's intermediate image is;
 * - the offsets snap to whole device pixels, as Skia resolves them;
 * - the differences are the filter's, 0.5·back + 0.5·(1 − forward).
 *
 * Checked against the filter's own map (rendered as a plain CSS filter and
 * read back) at 1x, 2x and 3x: within ±2/255 inside the shape, where the map
 * is used, which moves the refracted rim by well under a pixel. Other pixel
 * ratios are left to the filter (see glassMapScale).
 *
 * The result is two grey images, x and y, not one red/green map: Chromium
 * colour-manages images inside a filter, and on a wide-gamut screen (every
 * recent Mac) a red/green map comes out shifted by up to 21/255. Neutral
 * greys convert to themselves. They cover the shape plus a small margin and
 * are stored at CSS-pixel size: the filter is re-sent to the GPU with every
 * frame, image included, and a device-pixel copy cost more to ship (at 2x)
 * than the passes it saved. The glass drawn with them matches the old one to
 * within 2/255 over the page itself at 1x–3x, and to within ~12–20/255 on a
 * few hundred pixels over a worst case of fine black-and-white stripes.
 */

import { zoomOf } from '@/lib/zoom';

/** What the filter would compute, in its own user units (CSS px). */
export type GlassMapSpec = {
  width: number;
  height: number;
  /** σ of the ramp, and the slope step. */
  rim: number;
  step: number;
  /** The filter region's margin around the shape. */
  pad: number;
  /** The shape image the filter draws (an SVG data URL). */
  shape: string;
};

export type GlassMaps = { dx: string; dy: string };

/** The maps' margin around the shape (CSS px): the bend is only ever seen
    inside it, and a margin keeps the stretched image's edge off the rim. */
export const GLASS_MAP_MARGIN = 2;

// Skia blurs directly up to this σ (device px) and downsamples above it.
const MAX_DIRECT_SIGMA = 4;

/**
 * Device pixels per CSS pixel the map can be drawn for, or null to keep the
 * filter's own map. Only whole ratios (1x, 2x, 3x) were checked against
 * Skia's output: at fractional ones the shape lands on part pixels and the
 * steps on half pixels, which the copy above does not reproduce exactly.
 */
export function glassMapScale(step: number): number | null {
  // The glass sits inside the body's zoom (globals.css, lib/zoom).
  const dev = window.devicePixelRatio * zoomOf(document.body);
  if (Math.abs(dev - Math.round(dev)) > 1e-3) return null;
  const d = Math.round(dev);
  if (d < 1 || d > 3) return null;
  // A step on a half pixel rounds either way in Skia (none of today's do:
  // 3, 6, 9 for the pill; 1.26, 2.52, 3.78 for the buttons).
  const s = step * d;
  if (Math.abs(s - Math.floor(s) - 0.5) < 0.01) return null;
  return d;
}

async function rasterShape(spec: GlassMapSpec) {
  const img = new Image();
  img.src = spec.shape;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = spec.width;
  c.height = spec.height;
  // willReadFrequently: a software canvas, which rasterises the SVG as the
  // filter's image is rasterised (and reads back without a GPU round trip).
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(img, 0, 0, spec.width, spec.height);
  const px = g.getImageData(0, 0, spec.width, spec.height).data;
  const a = new Float32Array(spec.width * spec.height);
  for (let i = 0; i < a.length; i++) a[i] = px[i * 4 + 3] / 255;
  return a;
}

/** Bilinear sample at (x, y) in pixel units, texel centres on the halves;
    clamped to the edge, or transparent past it. */
function sample(src: Float32Array, w: number, h: number, x: number, y: number, clamp: boolean) {
  const fx = x - 0.5;
  const fy = y - 0.5;
  const i0 = Math.floor(fx);
  const j0 = Math.floor(fy);
  const ax = fx - i0;
  const ay = fy - j0;
  const at = (i: number, j: number) => {
    if (clamp) {
      i = i < 0 ? 0 : i >= w ? w - 1 : i;
      j = j < 0 ? 0 : j >= h ? h - 1 : j;
    } else if (i < 0 || j < 0 || i >= w || j >= h) {
      return 0;
    }
    return src[j * w + i];
  };
  return (at(i0, j0) * (1 - ax) + at(i0 + 1, j0) * ax) * (1 - ay) + (at(i0, j0 + 1) * (1 - ax) + at(i0 + 1, j0 + 1) * ax) * ay;
}

/** Separable Gaussian, radius ⌈3σ⌉, transparent past the edges (as the
    filter's region is). */
function gaussian(src: Float32Array, w: number, h: number, sigma: number) {
  const r = Math.ceil(3 * sigma);
  const k = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let t = -r; t <= r; t++) {
    k[t + r] = Math.exp(-(t * t) / (2 * sigma * sigma));
    sum += k[t + r];
  }
  for (let t = 0; t < k.length; t++) k[t] /= sum;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let acc = 0;
      for (let t = Math.max(-r, -i); t <= Math.min(r, w - 1 - i); t++) acc += k[t + r] * src[j * w + i + t];
      tmp[j * w + i] = acc;
    }
  }
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let acc = 0;
      for (let t = Math.max(-r, -j); t <= Math.min(r, h - 1 - j); t++) acc += k[t + r] * tmp[(j + t) * w + i];
      out[j * w + i] = acc;
    }
  }
  return out;
}

const to8 = (a: Float32Array) => {
  for (let i = 0; i < a.length; i++) a[i] = Math.round(a[i] * 255) / 255;
};

/** The ramp over the whole filter region at `dev` device px per CSS px. */
function ramp(shape1x: Float32Array, spec: GlassMapSpec, dev: number, W: number, H: number) {
  const { width: w, height: h, pad } = spec;
  // The shape image, stretched to device pixels and cut to its rectangle.
  const shape = new Float32Array(W * H);
  const x0 = pad * dev;
  const y0 = pad * dev;
  const x1 = (pad + w) * dev;
  const y1 = (pad + h) * dev;
  for (let j = Math.floor(y0); j < Math.ceil(y1); j++) {
    for (let i = Math.floor(x0); i < Math.ceil(x1); i++) {
      const cx = i + 0.5;
      const cy = j + 0.5;
      if (cx < x0 || cx > x1 || cy < y0 || cy > y1) continue;
      shape[j * W + i] = sample(shape1x, w, h, (cx - x0) / dev, (cy - y0) / dev, true);
    }
  }
  to8(shape);
  const sigma = spec.rim * dev;
  if (sigma <= MAX_DIRECT_SIGMA) {
    const r = gaussian(shape, W, H, sigma);
    to8(r);
    return r;
  }
  // Halve (2×2 average) until σ is small enough, blur there, stretch back.
  let img = shape;
  let iw = W;
  let ih = H;
  let f = 1;
  let sg = sigma;
  while (sg > MAX_DIRECT_SIGMA) {
    const nw = Math.ceil(iw / 2);
    const nh = Math.ceil(ih / 2);
    const half = new Float32Array(nw * nh);
    for (let j = 0; j < nh; j++) {
      for (let i = 0; i < nw; i++) {
        let s = 0;
        for (let dj = 0; dj < 2; dj++) {
          for (let di = 0; di < 2; di++) {
            const ii = 2 * i + di;
            const jj = 2 * j + dj;
            if (ii < iw && jj < ih) s += img[jj * iw + ii];
          }
        }
        half[j * nw + i] = s / 4;
      }
    }
    img = half;
    iw = nw;
    ih = nh;
    f *= 2;
    sg /= 2;
  }
  const low = gaussian(img, iw, ih, sg);
  const r = new Float32Array(W * H);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) r[j * W + i] = sample(low, iw, ih, (i + 0.5) / f, (j + 0.5) / f, true);
  }
  to8(r);
  return r;
}

/** A grey PNG (data URL) of one 8-bit value per pixel: how a displacement map
    reaches a filter intact (see above). The case's glass spheres send their
    lens this way too (case/Orbs). */
export function greyImage(values: Uint8ClampedArray, w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) return null;
  const img = g.createImageData(w, h);
  for (let i = 0; i < values.length; i++) {
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = values[i];
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

/** The x and y maps over the shape plus GLASS_MAP_MARGIN, as grey PNG data
    URLs at CSS-pixel size, decoded and ready to draw. */
export async function makeGlassMaps(spec: GlassMapSpec, dev: number): Promise<GlassMaps | null> {
  const shape1x = await rasterShape(spec);
  if (!shape1x) return null;
  const W = (spec.width + spec.pad * 2) * dev;
  const H = (spec.height + spec.pad * 2) * dev;
  const r = ramp(shape1x, spec, dev, W, H);
  const s = Math.round(spec.step * dev);
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= W || j >= H ? 0 : r[j * W + i]);
  // The maps' box, in CSS px; each of its pixels averages its dev×dev
  // device pixels of the full-resolution map.
  const m = GLASS_MAP_MARGIN;
  const bw = spec.width + m * 2;
  const bh = spec.height + m * 2;
  const ox = (spec.pad - m) * dev;
  const oy = (spec.pad - m) * dev;
  const dx = new Uint8ClampedArray(bw * bh);
  const dy = new Uint8ClampedArray(bw * bh);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      let sx = 0;
      let sy = 0;
      for (let b = 0; b < dev; b++) {
        for (let a = 0; a < dev; a++) {
          const i = ox + x * dev + a;
          const j = oy + y * dev + b;
          sx += Math.round((0.5 * at(i - s, j) + 0.5 * (1 - at(i + s, j))) * 255);
          sy += Math.round((0.5 * at(i, j - s) + 0.5 * (1 - at(i, j + s))) * 255);
        }
      }
      dx[y * bw + x] = Math.round(sx / (dev * dev));
      dy[y * bw + x] = Math.round(sy / (dev * dev));
    }
  }
  const urls = [greyImage(dx, bw, bh), greyImage(dy, bw, bh)];
  if (!urls[0] || !urls[1]) return null;
  // Decoded before the filter switches over, so it never draws a frame with
  // a map still loading (a missing map reads as a full-strength bend).
  await Promise.all(
    urls.map((u) => {
      const img = new Image();
      img.src = u as string;
      return img.decode();
    }),
  );
  return { dx: urls[0], dy: urls[1] };
}
