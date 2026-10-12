'use client';

import { useEffect, useRef } from 'react';
import './glass-orbs.css';

type Item = { title: string; text: string };
type Three = typeof import('three');

/*
 * Three questions, each under a sphere of glass (as on wabi.ai). The glass is
 * real: a solid ball of a light glass floating a touch above the page, drawn
 * on a canvas over the text. Rays are bent in at its front and out at its
 * back, and where they land on the page is what the glass shows — the text
 * read a little larger through the middle, pulled out toward the rim, where
 * the colours part. Twelve rays of different colours per pixel make the
 * rainbow at the edge continuous rather than three copies.
 *
 * The text under each sphere is the page's own (the <li>, for screen readers
 * and for browsers without WebGL, where glass-orbs.css paints a lit disc
 * behind it); the canvas draws the same words into a texture, smaller by
 * what the glass magnifies, so they come out at size. The spheres lean
 * toward the cursor, as the page's buttons do, and float a little; nothing is
 * drawn while they are off screen, and nothing outside the spheres at all.
 */

// The glass: how much it bends (its index), how far the colours part across
// the spectrum, and how far above the page it floats, in radii. Light, so
// the words stay readable through the middle.
const IOR = 1.055;
const DISPERSION = 0.006;
const GAP = 0.3;
// The text block no wider than this share of the diameter: within the flat
// middle, clear of the rim, where the glass pulls the page out.
const TEXT_WIDTH = 0.54;
// The lean: a fraction of the cursor's distance, capped, within this reach
// past the edge; the same pull as the page's buttons (useMagnetic).
const LEAN = 0.045;
const LEAN_MAX = 12;
const REACH = 90;
// The float: a slow rise and fall, each sphere a beat behind the last.
const FLOAT = 3;
// How far, in device pixels, a sphere moves before the glass is drawn
// again. The float alone moves a sphere at most ~2.7px a second, under a
// twentieth of a pixel a frame: drawing every frame (twelve rays a pixel,
// the heaviest thing on the page) redrew the same picture over and over at
// the screen's full refresh rate, scrolling or not. A quarter of a pixel
// can't be seen; the lean, which moves pixels a frame, is still drawn every
// frame.
const REDRAW_STEP = 0.25;

const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform vec3 uBg;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uScale;
varying vec2 vUv;

const float IOR = ${IOR.toFixed(3)};
const float DISP = ${DISPERSION.toFixed(4)};
const float GAP = ${GAP.toFixed(3)};

// The page at a point, in radii from the sphere's centre: its colour, and the
// text over it. Only the sphere's own words, and only from the middle: a
// neighbour's, or its own brought back round the rim, read as noise.
vec3 pageAt(vec2 p) {
  vec2 q = uCenter + vec2(p.x, -p.y) * uRadius;
  vec4 t = texture2D(uTex, vec2(q.x / uSize.x, 1.0 - q.y / uSize.y));
  t.a *= 1.0 - smoothstep(0.76, 0.92, length(p));
  return mix(uBg, t.rgb, t.a);
}

void main() {
  vec2 p = (vUv - 0.5) * uScale;
  float r = length(p);
  float aa = 1.5 / uRadius;
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, r);
  if (alpha <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float rr = min(r, 1.0);
  float z = sqrt(max(0.0, 1.0 - rr * rr));
  vec3 n = vec3(p / max(r, 1e-4) * rr, z);
  vec3 I = vec3(0.0, 0.0, -1.0);
  // Through the glass: in at the front, across, out at the back, down to
  // the page — once for each colour, red bent least.
  vec3 col = vec3(0.0);
  vec3 wsum = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float t = float(i) / 11.0;
    float ior = IOR + (t - 0.5) * 2.0 * DISP;
    vec3 w = vec3(smoothstep(0.8, 0.2, t), 1.0 - min(1.0, abs(t - 0.5) * 2.2), smoothstep(0.2, 0.8, t));
    vec3 d1 = refract(I, n, 1.0 / ior);
    vec3 P2 = n + d1 * (-2.0 * dot(n, d1));
    vec3 d2 = refract(d1, -P2, ior);
    if (dot(d2, d2) < 1e-6) d2 = d1;
    float s = (-1.0 - GAP - P2.z) / min(d2.z, -1e-3);
    col += pageAt(P2.xy + d2.xy * s) * w;
    wsum += w;
  }
  col /= wsum;
  // The edge of the glass: a thin dark band of its thickness just inside a
  // bright line.
  float band = smoothstep(0.945, 0.985, rr) - smoothstep(0.985, 1.0, rr);
  col *= 1.0 - band * 0.14;
  // What it reflects: a soft sky, mostly at the rim where glass mirrors; a
  // small window light up and to the left; and the light the rim gathers,
  // a crescent on that side and a fainter one opposite.
  vec3 R = reflect(I, n);
  float F = 0.04 + 0.96 * pow(1.0 - z, 5.0);
  vec3 env = mix(vec3(0.99, 0.995, 1.0), vec3(1.0), smoothstep(-0.4, 1.0, R.y * 0.8 - R.x * 0.25));
  col = mix(col, env, F * 0.3);
  vec3 L = normalize(vec3(-0.5, 0.65, 0.6));
  float dl = max(dot(R, L), 0.0);
  float light = pow(dl, 160.0) * 0.45 + pow(dl, 24.0) * 0.04;
  vec2 dir = p / max(r, 1e-4);
  float up = max(dot(dir, normalize(vec2(-0.5, 0.85))), 0.0);
  light += smoothstep(0.3, 1.0, rr) * up * up * 0.1;
  light += smoothstep(0.9, 1.0, rr) * up * up * up * 0.45;
  float down = max(dot(dir, normalize(vec2(0.6, -0.8))), 0.0);
  light += smoothstep(0.9, 1.0, rr) * down * down * down * 0.2;
  col += light;
  col = mix(col, vec3(1.0), smoothstep(0.984, 1.0, rr) * 0.85);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

type Vec3 = [number, number, number];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const refract = (I: Vec3, N: Vec3, eta: number): Vec3 => {
  const d = dot(N, I);
  const k = 1 - eta * eta * (1 - d * d);
  if (k < 0) return [0, 0, 0];
  const f = eta * d + Math.sqrt(k);
  return [eta * I[0] - f * N[0], eta * I[1] - f * N[1], eta * I[2] - f * N[2]];
};
/** How much larger the glass shows the page through its middle: one ray
    traced as the shader traces them, near the centre. The words are drawn
    smaller by this, so they read at their size. */
function magnification() {
  const x = 0.12;
  const z = Math.sqrt(1 - x * x);
  const n: Vec3 = [x, 0, z];
  const d1 = refract([0, 0, -1], n, 1 / IOR);
  const t = -2 * dot(n, d1);
  const P2: Vec3 = [n[0] + d1[0] * t, n[1] + d1[1] * t, n[2] + d1[2] * t];
  let d2 = refract(d1, [-P2[0], -P2[1], -P2[2]], IOR);
  if (dot(d2, d2) < 1e-6) d2 = d1;
  const s = (-1 - GAP - P2[2]) / Math.min(d2[2], -1e-3);
  return x / (P2[0] + d2[0] * s);
}

type Orb = { el: HTMLElement; cx: number; cy: number; r: number; lean: [number, number]; target: [number, number]; engaged: boolean };

/** Lines no wider than maxW, and as even as they can be: the greedy wrap's
    count, at the narrowest width that still gives it (text-wrap: balance). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines = (w: number) => {
    const out: string[] = [];
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > w) {
        out.push(line);
        line = word;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  };
  const n = lines(maxW).length;
  let lo = maxW * 0.3;
  let hi = maxW;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (lines(mid).length > n) lo = mid;
    else hi = mid;
  }
  return lines(hi);
}

function start(THREE: Three, root: HTMLElement, canvas: HTMLCanvasElement) {
  let renderer: import('three').WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch {
    return;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // The page's colour as the screen shows it (three.js would take a Color
  // into linear light, and the glass would come out darker than the page).
  const bg = new THREE.Vector3(0.97, 0.97, 0.96);
  {
    const probe = document.createElement('canvas').getContext('2d');
    if (probe) {
      probe.fillStyle = getComputedStyle(root).getPropertyValue('--bg').trim() || '#f7f7f5';
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      bg.set(r / 255, g / 255, b / 255);
    }
  }

  const sheet = document.createElement('canvas');
  const ctx = sheet.getContext('2d');
  if (!ctx) return;
  const tex = new THREE.CanvasTexture(sheet);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const items = Array.from(root.querySelectorAll<HTMLElement>('.go__orb'));
  const orbs: Orb[] = items.map((el) => ({ el, cx: 0, cy: 0, r: 1, lean: [0, 0], target: [0, 0], engaged: false }));
  const meshes = orbs.map((_, i) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: true,
      uniforms: {
        uTex: { value: tex },
        uSize: { value: new THREE.Vector2(1, 1) },
        uBg: { value: bg },
        uCenter: { value: new THREE.Vector2() },
        uRadius: { value: 1 },
        uScale: { value: 1 },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = i;
    scene.add(mesh);
    return mesh;
  });
  const shrink = 1 / magnification();

  let W = 1;
  let H = 1;
  let box = canvas.getBoundingClientRect();
  // The words of each sphere drawn once into the texture, where they are
  // on the page, in the page's own type, smaller by what the glass adds.
  // Drawn finer than the screen (up to the texture's limit), as the glass
  // reads them at the screen's pixels and a touch between.
  const draw = () => {
    const scale = Math.min((window.devicePixelRatio || 1) * 2, 4096 / W, 4);
    sheet.width = Math.round(W * scale);
    sheet.height = Math.round(H * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const s = shrink;
    for (const orb of orbs) {
      const title = orb.el.querySelector<HTMLElement>('.go__title');
      const text = orb.el.querySelector<HTMLElement>('.go__p');
      if (!title || !text) continue;
      const maxW = orb.r * 2 * TEXT_WIDTH * s;
      const font = (el: HTMLElement) => {
        const cs = getComputedStyle(el);
        const size = parseFloat(cs.fontSize) * s;
        ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = `${parseFloat(cs.letterSpacing) * s || 0}px`;
        return { lh: parseFloat(cs.lineHeight) * s, color: cs.color, gap: parseFloat(cs.marginTop) * s || 0 };
      };
      const t = font(title);
      const titleLines = wrap(ctx, title.textContent ?? '', maxW);
      const p = font(text);
      const textLines = wrap(ctx, text.textContent ?? '', maxW);
      const total = titleLines.length * t.lh + p.gap + textLines.length * p.lh;
      // A touch below the middle, where the eye puts the middle of a circle.
      let y = orb.cy - total / 2 + orb.r * 0.03;
      font(title);
      ctx.fillStyle = t.color;
      for (const line of titleLines) {
        ctx.fillText(line, orb.cx, y + t.lh * 0.72);
        y += t.lh;
      }
      y += p.gap;
      font(text);
      ctx.fillStyle = p.color;
      for (const line of textLines) {
        ctx.fillText(line, orb.cx, y + p.lh * 0.72);
        y += p.lh;
      }
    }
    tex.needsUpdate = true;
  };
  const measure = () => {
    box = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(box.width));
    H = Math.max(1, Math.round(box.height));
    renderer.setSize(W, H, false);
    camera.right = W;
    camera.top = H;
    camera.updateProjectionMatrix();
    orbs.forEach((orb, i) => {
      const r = orb.el.getBoundingClientRect();
      orb.cx = r.left - box.left + r.width / 2;
      orb.cy = r.top - box.top + r.height / 2;
      orb.r = r.width / 2;
      const size = orb.r * 2 * 1.04; // a little over the sphere, for its soft edge
      const m = meshes[i];
      m.scale.set(size, size, 1);
      const u = (m.material as import('three').ShaderMaterial).uniforms;
      u.uSize.value.set(W, H);
      u.uRadius.value = orb.r;
      u.uScale.value = size / orb.r;
    });
    draw();
    place(performance.now());
    render(true);
  };
  // Where each sphere is this frame: its place, its lean, its float.
  const place = (now: number) => {
    orbs.forEach((orb, i) => {
      const bob = motion ? Math.sin(now / 1000 * 0.9 + i * 2.1) * FLOAT : 0;
      const x = orb.cx + orb.lean[0];
      const y = orb.cy + orb.lean[1] - bob;
      meshes[i].position.set(x, H - y, 0);
      (meshes[i].material as import('three').ShaderMaterial).uniforms.uCenter.value.set(x, y);
    });
  };
  // Drawn only once a sphere has moved REDRAW_STEP since it was last drawn
  // (or when asked: a new size, the words redrawn).
  const step = REDRAW_STEP / dpr;
  const drawnAt = orbs.map(() => [NaN, NaN]);
  const render = (force = false) => {
    const centre = (i: number) => (meshes[i].material as import('three').ShaderMaterial).uniforms.uCenter.value;
    const moved = orbs.some((_, i) => {
      const c = centre(i);
      return !(Math.abs(c.x - drawnAt[i][0]) < step && Math.abs(c.y - drawnAt[i][1]) < step);
    });
    if (!force && !moved) return;
    orbs.forEach((_, i) => {
      const c = centre(i);
      drawnAt[i][0] = c.x;
      drawnAt[i][1] = c.y;
    });
    renderer.render(scene, camera);
  };

  let raf = 0;
  let visible = false;
  const settled = () => orbs.every((o) => !o.engaged && Math.abs(o.lean[0]) < 0.05 && Math.abs(o.lean[1]) < 0.05);
  const loop = (now: number) => {
    raf = 0;
    for (const orb of orbs) {
      const k = orb.engaged ? 0.15 : 0.12;
      orb.lean[0] += (orb.target[0] - orb.lean[0]) * k;
      orb.lean[1] += (orb.target[1] - orb.lean[1]) * k;
    }
    place(now);
    const going = visible && (motion || !settled());
    // The last frame before it stops is drawn exactly where it settled.
    render(!going);
    if (going) raf = requestAnimationFrame(loop);
  };
  const wake = () => {
    if (!raf && visible) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    },
    { rootMargin: '30% 0px' },
  );
  io.observe(root);
  const ro = new ResizeObserver(() => {
    measure();
    wake();
  });
  ro.observe(root);
  // The lean, as the page's buttons have it: toward a cursor within reach,
  // back when it goes.
  const onMove = (e: PointerEvent) => {
    if (!visible) return;
    const b = canvas.getBoundingClientRect();
    for (const orb of orbs) {
      const dx = e.clientX - (b.left + orb.cx);
      const dy = e.clientY - (b.top + orb.cy);
      const out = Math.max(0, Math.hypot(dx, dy) - orb.r);
      orb.engaged = out <= REACH;
      orb.target = orb.engaged
        ? [Math.max(-LEAN_MAX, Math.min(LEAN_MAX, dx * LEAN)), Math.max(-LEAN_MAX, Math.min(LEAN_MAX, dy * LEAN))]
        : [0, 0];
    }
    wake();
  };
  if (hover && motion) window.addEventListener('pointermove', onMove);
  root.setAttribute('data-gl', '');
  // The words are drawn once the face is in: before, the texture would hold
  // the fallback face. Shown at once, not on the next move.
  document.fonts?.ready
    .then(() => {
      draw();
      render(true);
    })
    .catch(() => {});
  measure();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    root.removeAttribute('data-gl');
    meshes.forEach((m) => (m.material as import('three').ShaderMaterial).dispose());
    geometry.dispose();
    tex.dispose();
    renderer.dispose();
  };
}

export function GlassOrbs({ items }: { items: Item[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    // Where colours or transparency are turned off, the painted disc is the
    // one that follows the setting.
    if (window.matchMedia('(forced-colors: active)').matches) return;
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    let stop: (() => void) | undefined;
    let gone = false;
    // three.js comes in only here, and only once the spheres are on the page.
    import('three').then((THREE) => {
      if (!gone) stop = start(THREE, root, canvas);
    });
    return () => {
      gone = true;
      stop?.();
    };
  }, []);

  return (
    <div ref={rootRef} className="go cp-reveal">
      <ol className="go__list">
        {items.map((item) => (
          <li key={item.title} className="go__orb">
            <div className="go__text">
              <h3 className="go__title">{item.title}</h3>
              <p className="go__p">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <canvas ref={canvasRef} className="go__canvas" aria-hidden="true" />
    </div>
  );
}
