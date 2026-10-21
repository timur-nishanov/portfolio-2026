type Three = typeof import('@/lib/three');

/*
 * Spheres of glass over the page (as on wabi.ai): the three questions in the
 * Chums case (case/GlassOrbs, through startGlassSpheres) and the balls at the
 * end of the home page (outro/Outro, which moves them itself). The glass is
 * real: a solid ball of a light glass floating a touch above the page, drawn
 * on a canvas over it. Rays are bent in at its front and out at its back, and
 * where they land on the page is what the glass shows — the page read a
 * little larger through the middle, pulled out toward the rim, where the
 * colours part. Twelve rays of different colours per pixel make the rainbow
 * at the edge continuous rather than three copies.
 *
 * What lies under each sphere is the page's own (its words), and the canvas
 * draws the same into a texture (the caller's paint). A sphere can also carry
 * something inside it, a logo, from a texture of its own, which goes where it
 * goes. Nothing is drawn outside the spheres at all.
 */

// The glass: how much it bends (its index), how far the colours part across
// the spectrum, and how far above the page it floats, in radii. Light, so
// the words stay readable through the middle.
const IOR = 1.055;
const DISPERSION = 0.006;
const GAP = 0.3;
// The lean: a fraction of the cursor's distance, capped, within this reach
// past the edge; the pull the page's buttons had.
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
uniform float uSoft;
uniform sampler2D uCarry;
uniform vec2 uCarrySize;
uniform vec2 uHome;
uniform float uCarries;
varying vec2 vUv;

const float IOR = ${IOR.toFixed(3)};
const float DISP = ${DISPERSION.toFixed(4)};
const float GAP = ${GAP.toFixed(3)};

// The page at a point, in radii from the sphere's centre: its colour, and
// what is drawn over it. Only from the middle: a neighbour's words, or its
// own brought back round the rim, read as noise. What the sphere carries
// lies over the page, read round its own place in its own texture.
vec3 pageAt(vec2 p) {
  vec2 o = vec2(p.x, -p.y) * uRadius;
  vec2 q = uCenter + o;
  vec4 t = texture2D(uTex, vec2(q.x / uSize.x, 1.0 - q.y / uSize.y));
  t.a *= 1.0 - smoothstep(0.76, 0.92, length(p));
  vec3 c = mix(uBg, t.rgb, t.a);
  if (uCarries > 0.5) {
    vec2 h = uHome + o;
    vec4 k = texture2D(uCarry, vec2(h.x / uCarrySize.x, 1.0 - h.y / uCarrySize.y));
    c = mix(c, k.rgb, k.a * (1.0 - smoothstep(0.76, 0.92, length(p))));
  }
  return c;
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
  // a crescent on that side and a fainter one opposite. uSoft (0 to 1)
  // blurs the window and the crescents: the window spreads into a glow, the
  // crescents fade in from further inside the rim.
  vec3 R = reflect(I, n);
  float F = 0.04 + 0.96 * pow(1.0 - z, 5.0);
  vec3 env = mix(vec3(0.99, 0.995, 1.0), vec3(1.0), smoothstep(-0.4, 1.0, R.y * 0.8 - R.x * 0.25));
  col = mix(col, env, F * 0.3);
  vec3 L = normalize(vec3(-0.5, 0.65, 0.6));
  float dl = max(dot(R, L), 0.0);
  float light = pow(dl, mix(160.0, 20.0, uSoft)) * mix(0.45, 0.32, uSoft) + pow(dl, 24.0) * 0.04;
  vec2 dir = p / max(r, 1e-4);
  float up = max(dot(dir, normalize(vec2(-0.5, 0.85))), 0.0);
  light += smoothstep(0.3, 1.0, rr) * up * up * 0.1;
  light += smoothstep(mix(0.9, 0.6, uSoft), 1.0, rr) * up * up * up * 0.45;
  float down = max(dot(dir, normalize(vec2(0.6, -0.8))), 0.0);
  light += smoothstep(mix(0.9, 0.7, uSoft), 1.0, rr) * down * down * down * 0.2;
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
    traced as the shader traces them, near the centre. What lies under it is
    drawn smaller by this, so it reads at its size. */
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

/** Draws into a sheet at CSS px; shrink is how much larger the glass shows
    its middle, for what should read at its size through it. */
export type SheetPaint = (ctx: CanvasRenderingContext2D, shrink: number) => void;

/**
 * The glass itself, for a caller that places the spheres: `count` spheres on
 * `canvas`, over the page drawn into one sheet, each perhaps carrying
 * something drawn into another. Nothing is drawn until render(). Nothing
 * where WebGL can't start.
 */
export type GlassView = {
  /** The canvas's drawing size, in CSS px. */
  size: (W: number, H: number) => void;
  /** The page under the spheres, w×h CSS px, as the canvas lies over it;
      finer than the screen by up to `fine`. */
  page: (w: number, h: number, paint: SheetPaint, fine?: number) => void;
  /** What the spheres carry, w×h CSS px of their own. */
  carry: (w: number, h: number, paint: SheetPaint, fine?: number) => void;
  /** Sphere i: its centre and radius on the canvas, the page read round
      (px, py), and what it carries round (hx, hy) in the carried sheet, or
      nothing. */
  set: (i: number, x: number, y: number, r: number, px: number, py: number, home?: [number, number]) => void;
  render: () => void;
  dispose: () => void;
};

export function createGlass(
  THREE: Three,
  canvas: HTMLCanvasElement,
  count: number,
  /** Where to read the page's colour (--bg) from. */
  from: HTMLElement,
  soft = 0,
): GlassView | undefined {
  let renderer: import('@/lib/three').WebGLRenderer;
  // Not on a software renderer: twelve rays a pixel over five balls, on the
  // CPU, stalled the last screen for seconds. Refused, the context throws,
  // and the discs painted by the stylesheet stand in, as the still head
  // does for the head (hero/FloatingHead).
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true,
    });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  // The page's colour as the screen shows it (three.js would take a Color
  // into linear light, and the glass would come out darker than the page).
  const bg = new THREE.Vector3(0.97, 0.97, 0.96);
  {
    const probe = document.createElement('canvas').getContext('2d');
    if (probe) {
      probe.fillStyle = getComputedStyle(from).getPropertyValue('--bg').trim() || '#f7f7f5';
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      bg.set(r / 255, g / 255, b / 255);
    }
  }
  const sheet = () => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return { c, ctx, tex };
  };
  const pageSheet = sheet();
  const carrySheet = sheet();
  if (!pageSheet.ctx || !carrySheet.ctx) return;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const meshes = Array.from({ length: count }, (_, i) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: true,
      uniforms: {
        uTex: { value: pageSheet.tex },
        uSize: { value: new THREE.Vector2(1, 1) },
        uBg: { value: bg },
        uCenter: { value: new THREE.Vector2() },
        uRadius: { value: 1 },
        uScale: { value: 1 },
        uSoft: { value: soft },
        uCarry: { value: carrySheet.tex },
        uCarrySize: { value: new THREE.Vector2(1, 1) },
        uHome: { value: new THREE.Vector2() },
        uCarries: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = i;
    scene.add(mesh);
    return mesh;
  });
  const uniforms = (i: number) => (meshes[i].material as import('@/lib/three').ShaderMaterial).uniforms;
  const shrink = 1 / magnification();
  let H = 1;
  // Drawn finer than the screen (up to the texture's limit), as the glass
  // reads it at the screen's pixels and a touch between.
  const paintSheet = (s: typeof pageSheet, w: number, h: number, paint: SheetPaint, fine: number, sizeOf: 'uSize' | 'uCarrySize') => {
    const scale = Math.min((window.devicePixelRatio || 1) * 2, 4096 / w, fine);
    s.c.width = Math.round(w * scale);
    s.c.height = Math.round(h * scale);
    s.ctx!.setTransform(scale, 0, 0, scale, 0, 0);
    s.ctx!.clearRect(0, 0, w, h);
    paint(s.ctx!, shrink);
    s.tex.needsUpdate = true;
    meshes.forEach((_, i) => uniforms(i)[sizeOf].value.set(w, h));
  };

  return {
    size: (w, h) => {
      H = h;
      renderer.setSize(w, h, false);
      camera.right = w;
      camera.top = h;
      camera.updateProjectionMatrix();
    },
    page: (w, h, paint, fine = 4) => paintSheet(pageSheet, w, h, paint, fine, 'uSize'),
    carry: (w, h, paint, fine = 4) => paintSheet(carrySheet, w, h, paint, fine, 'uCarrySize'),
    set: (i, x, y, r, px, py, home) => {
      const size = r * 2 * 1.04; // a little over the sphere, for its soft edge
      meshes[i].scale.set(size, size, 1);
      meshes[i].position.set(x, H - y, 0);
      const u = uniforms(i);
      u.uRadius.value = r;
      u.uScale.value = size / r;
      u.uCenter.value.set(px, py);
      u.uCarries.value = home ? 1 : 0;
      if (home) u.uHome.value.set(home[0], home[1]);
    },
    render: () => renderer.render(scene, camera),
    dispose: () => {
      meshes.forEach((m) => (m.material as import('@/lib/three').ShaderMaterial).dispose());
      geometry.dispose();
      pageSheet.tex.dispose();
      carrySheet.tex.dispose();
      renderer.dispose();
    },
  };
}

/** A sphere over an element: the element, and its centre and radius on the
    canvas, in CSS px. */
export type Sphere = { el: HTMLElement; cx: number; cy: number; r: number };
type Orb = Sphere & { lean: [number, number]; target: [number, number]; engaged: boolean };

/** Draws what lies under the spheres into the glass's texture: where it is
    on the canvas, in CSS px, smaller by `shrink`, which the glass makes up. */
export type GlassPaint = (ctx: CanvasRenderingContext2D, spheres: readonly Sphere[], shrink: number) => void;

export type Glass = {
  /** What lies under the spheres has changed (a face or a picture has come
      in): drawn again, and shown at once. */
  repaint: () => void;
  stop: () => void;
};

/**
 * A sphere of glass over each element in root that `selector` finds, drawn on
 * `canvas`, which covers root and a margin round it for the lean: the
 * spheres stand where the elements are, lean toward the cursor, as the
 * page's buttons did, and float a little; nothing is drawn while they are off
 * screen. Root wears data-gl while the glass is drawn, so its stylesheet can
 * hide what the glass now shows. Nothing where WebGL can't start.
 */
export function startGlassSpheres(
  THREE: Three,
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  selector: string,
  paint: GlassPaint,
): Glass | undefined {
  const items = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const view = createGlass(THREE, canvas, items.length, root);
  if (!view) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const orbs: Orb[] = items.map((el) => ({ el, cx: 0, cy: 0, r: 1, lean: [0, 0], target: [0, 0], engaged: false }));

  let W = 1;
  let H = 1;
  // The words' sheet at a reading density: the glass shows them at most a
  // third larger than the page sets them, so three times the screen's
  // pixels is still oversampled. At the default four, the sheet behind
  // three short labels ran to tens of megabytes on a phone.
  const draw = () => view.page(W, H, (ctx, shrink) => paint(ctx, orbs, shrink), Math.min(dpr * 1.5, 3));
  const measure = () => {
    const box = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(box.width));
    H = Math.max(1, Math.round(box.height));
    view.size(W, H);
    orbs.forEach((orb) => {
      const r = orb.el.getBoundingClientRect();
      orb.cx = r.left - box.left + r.width / 2;
      orb.cy = r.top - box.top + r.height / 2;
      orb.r = r.width / 2;
    });
    draw();
    place(performance.now());
    render(true);
  };
  // Where each sphere is this frame: its place, its lean, its float.
  const pos = orbs.map(() => [0, 0]);
  const place = (now: number) => {
    orbs.forEach((orb, i) => {
      const bob = motion ? Math.sin(now / 1000 * 0.9 + i * 2.1) * FLOAT : 0;
      const x = orb.cx + orb.lean[0];
      const y = orb.cy + orb.lean[1] - bob;
      pos[i][0] = x;
      pos[i][1] = y;
      view.set(i, x, y, orb.r, x, y);
    });
  };
  // Drawn only once a sphere has moved REDRAW_STEP since it was last drawn
  // (or when asked: a new size, the page under it drawn again).
  const step = REDRAW_STEP / dpr;
  const drawnAt = orbs.map(() => [NaN, NaN]);
  const render = (force = false) => {
    const moved = pos.some((p, i) => !(Math.abs(p[0] - drawnAt[i][0]) < step && Math.abs(p[1] - drawnAt[i][1]) < step));
    if (!force && !moved) return;
    pos.forEach((p, i) => {
      drawnAt[i][0] = p[0];
      drawnAt[i][1] = p[1];
    });
    view.render();
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
    // Settled, the spheres come to rest exactly where they started, not the
    // hair of lean the easing leaves.
    const rest = settled();
    if (rest) for (const orb of orbs) orb.lean = [0, 0];
    place(now);
    const going = visible && (motion || !rest);
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
  // The lean, as the page's buttons had it: toward a cursor within reach,
  // back when it goes, off the window too, and when the page scrolls the
  // spheres out from under a cursor that stays put.
  let pointer: [number, number] | null = null;
  const capped = (v: number) => Math.max(-LEAN_MAX, Math.min(LEAN_MAX, v * LEAN));
  const aim = () => {
    const b = canvas.getBoundingClientRect();
    for (const orb of orbs) {
      const dx = pointer ? pointer[0] - (b.left + orb.cx) : 0;
      const dy = pointer ? pointer[1] - (b.top + orb.cy) : 0;
      orb.engaged = !!pointer && Math.max(0, Math.hypot(dx, dy) - orb.r) <= REACH;
      orb.target = orb.engaged ? [capped(dx), capped(dy)] : [0, 0];
    }
    wake();
  };
  const onMove = (e: PointerEvent) => {
    pointer = [e.clientX, e.clientY];
    if (visible) aim();
  };
  const onOut = (e: PointerEvent) => {
    if (e.relatedTarget) return;
    pointer = null;
    aim();
  };
  const onBlur = () => {
    pointer = null;
    aim();
  };
  const onScroll = () => {
    if (pointer && visible) aim();
  };
  if (hover && motion) {
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerout', onOut);
    window.addEventListener('blur', onBlur);
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  root.setAttribute('data-gl', '');
  measure();

  return {
    repaint: () => {
      draw();
      render(true);
    },
    stop: () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerout', onOut);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('scroll', onScroll);
      root.removeAttribute('data-gl');
      view.dispose();
    },
  };
}
