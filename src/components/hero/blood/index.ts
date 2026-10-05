/**
 * Real-time blood for the floating head — the offline look the client
 * approved (blood_final), rebuilt as a few GPU passes on the head's own
 * WebGL renderer. Landed blood lives on the back wall: it is drawn into the
 * canvas before the head, so the head passes in front of it; drops in the
 * air are drawn again after the head (they fly at the camera).
 *
 * Cost: nothing at all while no blood is alive — Head3D only calls in when
 * `active` is true. While a splash lives, every pass is limited to the
 * rectangles the blood occupies; the field is stage-sized half floats,
 * allocated on the first splash and released after a quiet spell.
 */
import * as THREE from 'three';
import { Splash, K_STRIDE, P_STRIDE, F_STRIDE, type Wall, type HeadCovers, type SplashInput } from './splash';
import * as S from './shaders';

export type { Wall, HeadCovers };

// Only a hard knock bleeds, and only now and then: a full flick into a wall
// lands at ~1.9-2.3 world units/s (the throw is capped at 2.6 and glides),
// a tap (1.8 at launch) or a drift never gets there.
const MIN_IMPACT = 1.85;
const FULL_IMPACT = 2.3;
const COOLDOWN = [7, 11]; // s between splashes
const MAX_SPLASHES = 3;
const IDLE_RELEASE = 20; // s without blood before the field is freed
// The approved render's head was ~520 px wide; its pixels map onto the stage
// at (visible head width / 520), so the blood keeps its size next to the head.
const REF_HEAD_W = 520;
// blur widths of the height pass, offline px: thin films / pools / the
// size estimate (the offline smoothed its size field by 3 px too)
const SIG_S = 1.0;
const SIG_L = 4.5;
const SIG_3 = 3.0;

export type BloodHit = {
  wall: Wall;
  /** Contact on the wall, CSS px from the stage's top-left. */
  x: number;
  y: number;
  /** Head velocity at the knock, CSS px/s, y down. */
  vx: number;
  vy: number;
  /** Speed into the wall, world units/s (Head3D's `impact`). */
  impact: number;
};

type Gpu = {
  kGeo: THREE.InstancedBufferGeometry;
  kBuf: THREE.InstancedInterleavedBuffer;
  kMesh: THREE.Mesh;
  kMat: THREE.RawShaderMaterial;
  pGeo: THREE.InstancedBufferGeometry;
  pBuf: THREE.InstancedInterleavedBuffer;
  pMesh: THREE.Mesh;
  fGeo: THREE.InstancedBufferGeometry;
  fBuf: THREE.InstancedInterleavedBuffer;
  fMesh: THREE.Mesh;
};

type Live = { s: Splash; t0: number; gpu: Gpu };

const QUAD_POS = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
const QUAD_IDX = [0, 1, 2, 0, 2, 3];

function instGeo(buf: THREE.InstancedInterleavedBuffer, layout: [string, number, number][]) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(QUAD_POS, 3));
  g.setIndex(QUAD_IDX);
  for (const [name, size, offset] of layout) g.setAttribute(name, new THREE.InterleavedBufferAttribute(buf, size, offset));
  g.instanceCount = 0;
  return g;
}

const K_LAYOUT: [string, number, number][] = [
  ['iOff', 2, 0],
  ['iCenter', 2, 2],
  ['iShape', 3, 4],
  ['iP', 4, 7],
  ['iQ', 4, 11],
  ['iR', 4, 15],
];
const P_LAYOUT: [string, number, number][] = [
  ['iC', 2, 0],
  ['iShape', 3, 2],
  ['iA', 4, 5],
  ['iB', 4, 9],
];
const F_LAYOUT: [string, number, number][] = [
  ['iAB', 4, 0],
  ['iP', 4, 4],
  ['iR', 4, 8],
];

const additive = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneFactor,
};
const premultOver = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

function raw(vs: string, fs: string, uniforms: Record<string, THREE.IUniform>, extra: Partial<THREE.ShaderMaterialParameters> = {}) {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vs,
    fragmentShader: fs,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // the y-down stage mapping mirrors every quad's winding
    side: THREE.DoubleSide,
    ...extra,
  });
}

export class BloodLayer {
  readonly supported: boolean;
  private renderer: THREE.WebGLRenderer;
  private covers: HeadCovers;
  private live: Live[] = [];
  private t = 0;
  private quietSince = 0;
  private cooldownUntil = 0;
  private W = 1;
  private H = 1;
  private k = 1;
  private fs = 1;
  private bg = new THREE.Vector3(0.969, 0.969, 0.961);
  private cam = new THREE.OrthographicCamera();
  private rect: THREE.Mesh;
  private rts: { field: THREE.WebGLRenderTarget; blurA: THREE.WebGLRenderTarget; blurB: THREE.WebGLRenderTarget } | null = null;
  private noise: THREE.WebGLRenderTarget | null = null;
  private uStage = { value: new THREE.Vector2(1, 1) };
  private mClear: THREE.RawShaderMaterial;
  private mMask: THREE.RawShaderMaterial;
  private mBlur: THREE.RawShaderMaterial;
  private mComp: THREE.RawShaderMaterial;
  private mNoise: THREE.RawShaderMaterial;
  private mPlain: THREE.RawShaderMaterial;
  private mFlyer: THREE.RawShaderMaterial;
  private mKernel: THREE.RawShaderMaterial;
  private disposed = false;

  constructor(renderer: THREE.WebGLRenderer, covers: HeadCovers) {
    this.renderer = renderer;
    this.covers = covers;
    const ext = renderer.extensions;
    // Additive half-float targets are the whole technique; without them
    // (rare, old mobile GPUs) the head simply doesn't bleed.
    this.supported = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float');
    const rectUniforms = () => ({ uStage: this.uStage, uRect: { value: new THREE.Vector4() } });
    const shape = () => ({
      uF0: { value: null },
      uF1: { value: null },
      uNoise: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uFs: { value: 1 },
      uK: { value: 1 },
    });
    this.mClear = raw(S.RECT_VS, S.CLEAR_FS, rectUniforms(), { blending: THREE.NoBlending });
    this.mMask = raw(S.RECT_VS, S.MASK_FS, { ...rectUniforms(), ...shape() }, { blending: THREE.NoBlending });
    this.mBlur = raw(
      S.RECT_VS,
      S.BLUR_FS,
      { ...rectUniforms(), uSrc: { value: null }, uDir: { value: new THREE.Vector2() }, uSigS: { value: 1 }, uSigL: { value: 4 }, uSig3: { value: 3 }, uRad: { value: 12 } },
      { blending: THREE.NoBlending },
    );
    this.mComp = raw(
      S.RECT_VS,
      S.COMPOSITE_FS,
      { ...rectUniforms(), ...shape(), uBlur: { value: null }, uDpr: { value: 1 }, uBg: { value: this.bg }, uSigS: { value: 1 }, uSigL: { value: 4 } },
      premultOver,
    );
    this.mNoise = raw(S.RECT_VS, S.NOISE_FS, { uStage: { value: new THREE.Vector2(256, 256) }, uRect: { value: new THREE.Vector4(0, 0, 256, 256) } }, { blending: THREE.NoBlending });
    this.mPlain = raw(S.PLAIN_VS, S.KERNEL_FS, { uStage: this.uStage }, additive);
    this.mFlyer = raw(S.FLYER_VS, S.FLYER_FS, { uStage: this.uStage, uK: { value: 1 }, uBg: { value: this.bg }, uLayer: { value: 0 } }, premultOver);
    this.mKernel = raw(
      S.KERNEL_VS,
      S.KERNEL_FS,
      { uStage: this.uStage, uT: { value: 0 }, uTiming: { value: new THREE.Vector4() }, uKd: { value: 1 } },
      additive,
    );
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(QUAD_POS, 3));
    g.setIndex(QUAD_IDX);
    this.rect = new THREE.Mesh(g, this.mClear);
    this.rect.frustumCulled = false;
  }

  get active() {
    return this.live.length > 0;
  }

  /** Compile every program off the critical path, so the first splash doesn't hitch. */
  warmup() {
    if (!this.supported) return;
    const scene = new THREE.Scene();
    const add = (m: THREE.Material, geo: THREE.BufferGeometry = this.rect.geometry) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.frustumCulled = false;
      scene.add(mesh);
    };
    for (const m of [this.mClear, this.mMask, this.mBlur, this.mComp, this.mNoise]) add(m);
    add(this.mKernel, instGeo(new THREE.InstancedInterleavedBuffer(new Float32Array(K_STRIDE), K_STRIDE), K_LAYOUT));
    add(this.mPlain, instGeo(new THREE.InstancedInterleavedBuffer(new Float32Array(P_STRIDE), P_STRIDE), P_LAYOUT));
    add(this.mFlyer, instGeo(new THREE.InstancedInterleavedBuffer(new Float32Array(F_STRIDE), F_STRIDE), F_LAYOUT));
    const done = () => {
      scene.traverse((o) => (o as THREE.Mesh).geometry !== this.rect.geometry && (o as THREE.Mesh).geometry?.dispose());
      // the wall noise is a one-off render: do it now, not on the first splash
      if (this.disposed) return;
      const prev = this.renderer.getRenderTarget();
      this.ensureNoise();
      this.renderer.setRenderTarget(prev);
    };
    this.renderer.compileAsync(scene, this.cam).then(done, done);
    // Run a throwaway splash through the CPU side in idle slices: a cold JIT
    // made the very first knock cost ~20 ms, right when everyone is looking.
    const none = () => false;
    const ghost = new Splash({ wall: 'l', x: 0, y: this.H / 2, vx: -900, vy: 0, strength: 1 }, { k: this.k, W: this.W, H: this.H, seed: 1, density: 1, covers: none });
    let t = 0;
    const later = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));
    const slice = () => {
      if (this.disposed) return;
      for (let i = 0; i < 4 && t < 1.2; i++) {
        t += 1 / 60;
        ghost.update(t, 1 / 60, none);
      }
      if (t < 1.2) later(slice);
    };
    later(slice);
  }

  /** Stage size (CSS px) and the head's visible width, which sets the blood's scale. */
  resize(W: number, H: number, headWidth: number) {
    this.W = Math.max(1, W);
    this.H = Math.max(1, H);
    this.uStage.value.set(this.W, this.H);
    this.k = Math.max(0.3, headWidth / REF_HEAD_W);
    // field px per CSS px: about one per offline px, never above the CSS grid
    this.fs = Math.min(1, Math.max(0.5, 0.95 / this.k));
    if (this.rts) this.freeTargets();
  }

  /** The page colour behind the stage (sRGB 0..1); the film is composited for it. */
  setBackground(r: number, g: number, b: number) {
    this.bg.set(r, g, b);
  }

  /** A knock: bleeds if it was hard enough and the last splash was a while ago. */
  hit(h: BloodHit): boolean {
    if (!this.supported || h.impact < MIN_IMPACT || this.t < this.cooldownUntil) return false;
    const q = Math.min(Math.max((h.impact - MIN_IMPACT) / (FULL_IMPACT - MIN_IMPACT), 0), 1);
    // A floor knock sprays right under the chin (and over the tagline): it
    // reads as a bleeding chin rather than a splash, so it bleeds rarely.
    const chance = (0.55 + 0.45 * q) * (h.wall === 'b' ? 0.35 : 1);
    if (Math.random() > chance) return false;
    this.cooldownUntil = this.t + COOLDOWN[0] + Math.random() * (COOLDOWN[1] - COOLDOWN[0]);
    this.spray({ wall: h.wall, x: h.x, y: h.y, vx: h.vx, vy: h.vy, strength: q });
    return true;
  }

  /** Unconditional splash (the policy lives in `hit`). */
  spray(inp: SplashInput) {
    if (!this.supported) return;
    if (this.live.length >= MAX_SPLASHES) this.drop(this.live[0]);
    const seed = Math.floor(Math.random() * 1e9);
    const density = Math.min(1, Math.max(0.55, this.k / 0.9)); // fewer particles on small screens
    const s = new Splash(inp, { k: this.k, W: this.W, H: this.H, seed, density, covers: this.covers });
    this.live.push({ s, t0: this.t, gpu: this.makeGpu(s) });
  }

  private makeGpu(s: Splash): Gpu {
    const kBuf = new THREE.InstancedInterleavedBuffer(s.kData, K_STRIDE).setUsage(THREE.DynamicDrawUsage);
    const pBuf = new THREE.InstancedInterleavedBuffer(s.pData, P_STRIDE).setUsage(THREE.DynamicDrawUsage);
    const fBuf = new THREE.InstancedInterleavedBuffer(s.fData, F_STRIDE).setUsage(THREE.DynamicDrawUsage);
    const kGeo = instGeo(kBuf, K_LAYOUT);
    const pGeo = instGeo(pBuf, P_LAYOUT);
    const fGeo = instGeo(fBuf, F_LAYOUT);
    // each splash runs on its own clock; the program is shared
    const kMat = this.mKernel.clone();
    kMat.uniforms.uStage = this.uStage;
    const mk = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const m = new THREE.Mesh(geo, mat);
      m.frustumCulled = false;
      return m;
    };
    return { kGeo, kBuf, kMesh: mk(kGeo, kMat), kMat, pGeo, pBuf, pMesh: mk(pGeo, this.mPlain), fGeo, fBuf, fMesh: mk(fGeo, this.mFlyer) };
  }

  private drop(l: Live) {
    l.gpu.kGeo.dispose();
    l.gpu.pGeo.dispose();
    l.gpu.fGeo.dispose();
    l.gpu.kMat.dispose();
    this.live.splice(this.live.indexOf(l), 1);
    if (!this.live.length) this.quietSince = this.t;
  }

  /** Advance the blood by dt (seconds of visible time). */
  step(dt: number) {
    this.t += dt;
    if (!this.live.length) {
      if (this.rts && this.t - this.quietSince > IDLE_RELEASE) this.freeTargets();
      return;
    }
    for (const l of [...this.live]) {
      const clock = this.t - l.t0;
      const tm = l.s.timing;
      if (clock > tm.life) {
        this.drop(l);
        continue;
      }
      l.s.update(clock, dt, this.covers);
      this.sync(l, clock);
    }
  }

  private sync(l: Live, clock: number) {
    const { s, gpu } = l;
    // stains: append-only; a reallocated array needs a fresh buffer
    if (gpu.kBuf.array !== s.kData) {
      gpu.kGeo.dispose();
      gpu.kBuf = new THREE.InstancedInterleavedBuffer(s.kData, K_STRIDE).setUsage(THREE.DynamicDrawUsage);
      gpu.kGeo = instGeo(gpu.kBuf, K_LAYOUT);
      gpu.kMesh.geometry = gpu.kGeo;
      s.kUploaded = s.kCount;
      s.kPatches.length = 0;
    } else {
      if (s.kCount > s.kUploaded) {
        gpu.kBuf.addUpdateRange(s.kUploaded * K_STRIDE, (s.kCount - s.kUploaded) * K_STRIDE);
        gpu.kBuf.needsUpdate = true;
        s.kUploaded = s.kCount;
      }
      for (const [start, count] of s.kPatches) {
        gpu.kBuf.addUpdateRange(start * K_STRIDE, count * K_STRIDE);
        gpu.kBuf.needsUpdate = true;
      }
      s.kPatches.length = 0;
    }
    gpu.kGeo.instanceCount = s.kCount;
    const u = gpu.kMat.uniforms;
    u.uT.value = clock;
    u.uTiming.value.set(s.timing.dry[0], s.timing.dry[1], s.timing.shrink, s.timing.life);
    u.uKd.value = s.timing.kd;
    const refill = (buf: THREE.InstancedInterleavedBuffer, data: Float32Array, n: number, stride: number, layout: [string, number, number][], key: 'pGeo' | 'fGeo', mesh: THREE.Mesh) => {
      let b = buf;
      if (b.array !== data) {
        gpu[key].dispose();
        b = new THREE.InstancedInterleavedBuffer(data, stride).setUsage(THREE.DynamicDrawUsage);
        gpu[key] = instGeo(b, layout);
        mesh.geometry = gpu[key];
      } else if (n > 0) {
        b.addUpdateRange(0, n * stride);
        b.needsUpdate = true;
      }
      gpu[key].instanceCount = n;
      return b;
    };
    gpu.pBuf = refill(gpu.pBuf, s.pData, s.pCount, P_STRIDE, P_LAYOUT, 'pGeo', gpu.pMesh);
    gpu.fBuf = refill(gpu.fBuf, s.fData, s.fCount, F_STRIDE, F_LAYOUT, 'fGeo', gpu.fMesh);
  }

  private ensureTargets() {
    if (this.rts) return this.rts;
    const fw = Math.ceil(this.W * this.fs);
    const fh = Math.ceil(this.H * this.fs);
    const base = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false };
    this.rts = {
      field: new THREE.WebGLRenderTarget(fw, fh, { ...base, count: 2, type: THREE.HalfFloatType, format: THREE.RGBAFormat }),
      blurA: new THREE.WebGLRenderTarget(fw, fh, { ...base, type: THREE.HalfFloatType, format: THREE.RGBAFormat }),
      blurB: new THREE.WebGLRenderTarget(fw, fh, { ...base, type: THREE.HalfFloatType, format: THREE.RGBAFormat }),
    };
    return this.rts;
  }

  private freeTargets() {
    if (!this.rts) return;
    for (const rt of Object.values(this.rts)) rt.dispose();
    this.rts = null;
  }

  private ensureNoise() {
    if (this.noise) return this.noise;
    const rt = new THREE.WebGLRenderTarget(256, 256, {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      generateMipmaps: false,
    });
    this.renderer.setRenderTarget(rt);
    this.rect.material = this.mNoise;
    this.renderer.render(this.rect, this.cam);
    this.noise = rt;
    return rt;
  }

  /** Rectangles (CSS px) the live blood covers this frame, merged where they touch. */
  private rects(pad: number): [number, number, number, number][] {
    const out: [number, number, number, number][] = [];
    for (const { s } of this.live) {
      const b = s.box;
      if (!(b[2] > b[0] && b[3] > b[1])) continue;
      let r: [number, number, number, number] = [
        Math.max(0, Math.floor(b[0] - pad)),
        Math.max(0, Math.floor(b[1] - pad)),
        Math.min(this.W, Math.ceil(b[2] + pad)),
        Math.min(this.H, Math.ceil(b[3] + pad)),
      ];
      if (r[2] <= r[0] || r[3] <= r[1]) continue;
      for (let i = out.length - 1; i >= 0; i--) {
        const o = out[i];
        if (o[0] <= r[2] && r[0] <= o[2] && o[1] <= r[3] && r[1] <= o[3]) {
          r = [Math.min(o[0], r[0]), Math.min(o[1], r[1]), Math.max(o[2], r[2]), Math.max(o[3], r[3])];
          out.splice(i, 1);
        }
      }
      out.push(r);
    }
    return out;
  }

  private drawRect(mat: THREE.RawShaderMaterial, r: [number, number, number, number]) {
    mat.uniforms.uRect.value.set(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    this.rect.material = mat;
    this.renderer.render(this.rect, this.cam);
  }

  /** Landed blood (and drops still squeezing out of the contact): before the head. */
  renderUnder() {
    if (!this.live.length || !this.supported) return;
    const r = this.renderer;
    const autoClear = r.autoClear;
    r.autoClear = false;
    const prevTarget = r.getRenderTarget();
    const noise = this.ensureNoise();
    const rts = this.ensureTargets();
    const fw = rts.field.width;
    const fh = rts.field.height;
    const fs = this.fs;
    const sigS = SIG_S * this.k * fs;
    const sigL = SIG_L * this.k * fs;
    const rad = Math.min(48, Math.ceil(3 * sigL));
    const blurPad = (2 * rad + 4) / fs;
    const outer = this.rects(blurPad + 2);
    const inner = this.rects(2);

    // 1 · field: clear what the blood covers (not the whole stage-sized
    // target: that was most of the bandwidth), then every kernel, additively
    r.setRenderTarget(rts.field);
    for (const q of outer) this.drawRect(this.mClear, q);
    for (const { gpu } of this.live) {
      if (gpu.kGeo.instanceCount > 0) r.render(gpu.kMesh, this.cam);
      if (gpu.pGeo.instanceCount > 0) r.render(gpu.pMesh, this.cam);
    }

    // 2 · mask of the drawn region (into blurB, free until the last pass);
    // 3 · its blurs: the liquid's height and the smoothed size
    const setShape = (m: THREE.RawShaderMaterial) => {
      m.uniforms.uF0.value = rts.field.textures[0];
      m.uniforms.uF1.value = rts.field.textures[1];
      m.uniforms.uNoise.value = noise.texture;
      m.uniforms.uTexel.value.set(1 / fw, 1 / fh);
      m.uniforms.uFs.value = fs;
      m.uniforms.uK.value = this.k;
    };
    setShape(this.mMask);
    r.setRenderTarget(rts.blurB);
    for (const q of outer) this.drawRect(this.mMask, q);
    const bu = this.mBlur.uniforms;
    bu.uSigS.value = sigS;
    bu.uSigL.value = sigL;
    bu.uSig3.value = SIG_3 * this.k * fs;
    bu.uRad.value = rad;
    bu.uSrc.value = rts.blurB.texture;
    bu.uDir.value.set(1 / fw, 0);
    r.setRenderTarget(rts.blurA);
    for (const q of outer) this.drawRect(this.mBlur, q);
    bu.uSrc.value = rts.blurA.texture;
    bu.uDir.value.set(0, 1 / fh);
    r.setRenderTarget(rts.blurB);
    for (const q of outer) this.drawRect(this.mBlur, q);

    // 4 · shade into the canvas, then the drops still behind the head
    r.setRenderTarget(prevTarget);
    setShape(this.mComp);
    const cu = this.mComp.uniforms;
    cu.uBlur.value = rts.blurB.texture;
    cu.uDpr.value = r.getPixelRatio();
    cu.uSigS.value = sigS;
    cu.uSigL.value = sigL;
    for (const q of inner) this.drawRect(this.mComp, q);
    this.drawFlyers(0);
    r.autoClear = autoClear;
  }

  /** Drops in the air, in front of the head. */
  renderOver() {
    if (!this.live.length || !this.supported) return;
    const autoClear = this.renderer.autoClear;
    this.renderer.autoClear = false;
    this.drawFlyers(1);
    this.renderer.autoClear = autoClear;
  }

  private drawFlyers(layer: 0 | 1) {
    this.mFlyer.uniforms.uLayer.value = layer;
    this.mFlyer.uniforms.uK.value = this.k;
    for (const { gpu } of this.live) if (gpu.fGeo.instanceCount > 0) this.renderer.render(gpu.fMesh, this.cam);
  }

  dispose() {
    this.disposed = true;
    for (const l of [...this.live]) this.drop(l);
    this.freeTargets();
    this.noise?.dispose();
    for (const m of [this.mClear, this.mMask, this.mBlur, this.mComp, this.mNoise, this.mPlain, this.mFlyer, this.mKernel]) m.dispose();
    this.rect.geometry.dispose();
  }
}
