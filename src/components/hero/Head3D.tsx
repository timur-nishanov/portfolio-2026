'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { assets } from '@/data/assets';
import { clamp } from '@/lib/lerp';
import { stepSpring, type SpringState } from '@/lib/spring';
import { createBloodField } from './blood';
import fragmentShader from './head.frag';
import vertexShader from './head.vert';

// Parallax strength → felt turn angle. Raised from ±14° once the mirror-fill
// kept the silhouette clean; the seam on the low-poly facets is the ceiling.
// Locked here per TZ §7.2 (find the max experimentally, then pin it).
const TILT_STRENGTH = 0.17; // ≈ ±20° of felt rotation with mirror-fill
const DEPTH_PIVOT = 0.62; // cheek level — most natural pivot
const LIGHT_STRENGTH = 0.3;

// --- flight physics (world units, where the stage height spans 2) ----------
const IDLE_SPEED = 0.055; // calm drift
const IDLE_STEER = 1.2; // how fast idle velocity converges on the wander dir
const THROW_SPEED = 2.1; // impulse magnitude on a tap
const THROW_DAMP = 0.5; // exponential decay per second while thrown
const RESTITUTION = 0.88; // energy kept on a wall bounce
const CALM_SPEED = 0.17; // below this the throw hands back to the idle drift
const BLOOD_MIN_SPEED = 0.5; // only hard hits bleed — drifting must not spray

// Instead of spinning the plane flat, throws and impacts push the shader's
// depth-parallax so the head appears to turn in 3D. Flat z-rotation reads as a
// sticker being twirled; this reads as volume.
const TWIST_FROM_THROW = 0.5;
const TWIST_FROM_IMPACT = 0.7;
const TWIST_DECAY = 2.6; // per second

// Squeeze while held (TZ follow-up: "as if squeezed by a fist").
const HOLD_RAMP = 1.7; // how fast the squeeze builds, per second
const SQUASH_SPRING = { stiffness: 190, damping: 11 }; // springy release
const IMPACT_SQUASH = 0.35;

// The texture is 1996² with the head occupying x 164–1832, y 444–1576 (TZ §1.3),
// so the plane carries empty margins. Collisions and splashes use the *visible*
// silhouette, otherwise the head bounces off thin air well before the edge.
const HEAD_W_FRAC = 1668 / 1996;
const HEAD_H_FRAC = 1132 / 1996;

export function Head3D() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // getComputedStyle on a custom property hands back the authored token
    // ("clamp(...)"), not a resolved length — so measure it with a probe whose
    // width *is* the variable and read the laid-out box instead.
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;top:0;left:0;height:0;visibility:hidden;pointer-events:none;width:var(--head-size)';
    wrap.appendChild(probe);

    const canvas = document.createElement('canvas');
    const bloodCanvas = document.createElement('canvas');
    for (const c of [canvas, bloodCanvas]) {
      c.style.position = 'absolute';
      c.style.inset = '0';
      c.style.width = '100%';
      c.style.height = '100%';
      c.style.display = 'block';
      c.style.pointerEvents = 'none'; // clicks always fall through to the page
      wrap.appendChild(c);
    }

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    // Orthographic in "world" units: y spans -1..1 over the stage height,
    // x spans -aspect..aspect, so a square stays square at any window size.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const loader = new THREE.TextureLoader();
    const colorTex = loader.load(assets.headColor);
    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.minFilter = THREE.LinearFilter;
    colorTex.magFilter = THREE.LinearFilter;
    const depthTex = loader.load(assets.headDepth);
    depthTex.colorSpace = THREE.NoColorSpace; // raw depth values, never gamma them
    depthTex.minFilter = THREE.LinearFilter;
    depthTex.magFilter = THREE.LinearFilter;

    const uniforms = {
      uColor: { value: colorTex },
      uDepth: { value: depthTex },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uDepthPivot: { value: DEPTH_PIVOT },
      uStrength: { value: TILT_STRENGTH },
      uLightDir: { value: new THREE.Vector2(0, 0) },
      uLightStrength: { value: LIGHT_STRENGTH },
      uTexel: { value: new THREE.Vector2(1 / 1996, 1 / 1996) },
      uSquash: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const blood = createBloodField(bloodCanvas);

    // ---- alpha hit test (grab only opaque head pixels) --------------------
    const hitCanvas = document.createElement('canvas');
    hitCanvas.width = hitCanvas.height = 128;
    const hitCtx = hitCanvas.getContext('2d', { willReadFrequently: true });
    let alphaData: Uint8ClampedArray | null = null;
    const hitImg = new Image();
    hitImg.onload = () => {
      if (!hitCtx) return;
      hitCtx.drawImage(hitImg, 0, 0, 128, 128);
      alphaData = hitCtx.getImageData(0, 0, 128, 128).data;
    };
    hitImg.src = assets.headColor;

    const isOnHead = (u: number, v: number) => {
      if (u < 0 || u > 1 || v < 0 || v > 1) return false;
      if (!alphaData) return false;
      const px = clamp(Math.floor(u * 128), 0, 127);
      const py = clamp(Math.floor(v * 128), 0, 127);
      return alphaData[(py * 128 + px) * 4 + 3] > 40;
    };

    // ---- stage geometry ----------------------------------------------------
    // The stage is the hero box, not the window: the head plays inside the hero
    // and scrolls away with it rather than trailing the reader down the page.
    let W = wrap.clientWidth || window.innerWidth;
    let H = wrap.clientHeight || window.innerHeight;
    let aspect = W / H;
    let half = 0.25;
    let sizePx = 320;

    const resize = () => {
      W = wrap.clientWidth || window.innerWidth;
      H = wrap.clientHeight || window.innerHeight;
      aspect = W / H;
      renderer.setSize(W, H, false);
      camera.left = -aspect;
      camera.right = aspect;
      camera.updateProjectionMatrix();

      sizePx = probe.getBoundingClientRect().width || Math.min(W, H) * 0.5;
      mesh.scale.setScalar(sizePx / H);
      half = sizePx / H;

      blood.resize(W, H, renderer.getPixelRatio());
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // ---- state -------------------------------------------------------------
    // The head deliberately does NOT track the cursor (per request). Its only
    // orientation comes from throws and wall impacts via `twist` below.

    // Start already in motion — a head sitting dead still on load looks broken.
    let wander = Math.random() * Math.PI * 2;
    let posX = 0;
    let posY = 0;
    let velX = Math.cos(wander) * IDLE_SPEED;
    let velY = Math.sin(wander) * IDLE_SPEED;
    let thrown = false;

    let twistX = 0;
    let twistY = 0;
    let squash: SpringState = { value: 0, velocity: 0 };
    let holding = 0; // seconds the pointer has been held down on the head

    let dragging = false;
    let downTime = 0;
    let lastPX = 0;
    let lastPY = 0;
    let grabU = 0;
    let grabV = 0;

    // Stage coords are relative to the wrapper, which scrolls with the hero.
    const rect = () => wrap.getBoundingClientRect();
    const toStageX = (wx: number) => W / 2 + wx * (H / 2);
    const toStageY = (wy: number) => H / 2 - wy * (H / 2);

    const headUV = (clientX: number, clientY: number) => {
      const r = rect();
      const cx = r.left + toStageX(posX);
      const cy = r.top + toStageY(posY);
      return {
        u: (clientX - (cx - sizePx / 2)) / sizePx,
        v: (clientY - (cy - sizePx / 2)) / sizePx,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragging) {
        const k = 2 / H; // px → world units
        posX += (e.clientX - lastPX) * k;
        posY -= (e.clientY - lastPY) * k;
        velX = (e.clientX - lastPX) * k * 60; // per-second velocity for the throw
        velY = -(e.clientY - lastPY) * k * 60;
        lastPX = e.clientX;
        lastPY = e.clientY;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const { u, v } = headUV(e.clientX, e.clientY);
      // Miss → the event is left alone, so links and text under the transparent
      // part of the plane keep working (TZ §7.1).
      if (!isOnHead(u, v)) return;
      // Hit → claim the gesture, otherwise dragging the head paints a text
      // selection across the copy underneath.
      e.preventDefault();
      document.getSelection()?.removeAllRanges();
      document.body.style.userSelect = 'none';
      dragging = true;
      holding = 0;
      downTime = performance.now();
      lastPX = e.clientX;
      lastPY = e.clientY;
      grabU = u * 2 - 1;
      grabV = -(v * 2 - 1);
      velX = velY = 0;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      holding = 0;
      document.body.style.userSelect = '';
      thrown = true;
      const quick = performance.now() - downTime < 220;
      const speed = Math.hypot(velX, velY);
      if (quick && speed < 0.25) {
        // A tap → impulse away from where it was poked.
        const len = Math.hypot(grabU, grabV) || 1;
        velX = (grabU / len) * THROW_SPEED;
        velY = (grabV / len) * THROW_SPEED + 0.3;
      }
      // Twist in 3D along the throw, so you see the volume turn.
      twistX -= velX * TWIST_FROM_THROW;
      twistY -= velY * TWIST_FROM_THROW;
      // Release the squeeze with a bit of overshoot.
      squash.velocity -= 2.2;
    };

    window.addEventListener('pointermove', onPointerMove);
    // Not passive: grabbing the head calls preventDefault to stop text selection.
    window.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointerup', onPointerUp);

    /** Bounce against a wall, bleed if the hit was hard. n points inward. */
    const hitWall = (nx: number, ny: number, impact: number) => {
      // Impacts twist the head and dent it briefly, whatever their strength.
      twistX += nx * impact * TWIST_FROM_IMPACT;
      twistY -= ny * impact * TWIST_FROM_IMPACT;
      squash.velocity += Math.min(impact, 2) * IMPACT_SQUASH * 6;

      if (impact < BLOOD_MIN_SPEED) return;
      // Contact point: head centre pushed out to the silhouette edge it touched.
      const cx = toStageX(posX) - nx * (sizePx / 2) * HEAD_W_FRAC;
      const cy = toStageY(posY) + ny * (sizePx / 2) * HEAD_H_FRAC;
      blood.splash(cx, cy, nx, -ny, impact);
    };

    // ---- loop --------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const t = now / 1000;

      // Orientation is purely physical: twist from throws/impacts, decaying
      // back to face-on. No cursor tracking.
      const decayTwist = Math.exp(-TWIST_DECAY * dt);
      twistX *= decayTwist;
      twistY *= decayTwist;
      uniforms.uPointer.value.set(clamp(twistX, -1.6, 1.6), clamp(twistY, -1.6, 1.6));
      // Light rides the twist too, so a throw shades the turn; at rest it's
      // a gentle constant from slightly above.
      uniforms.uLightDir.value.set(twistX * 0.8, twistY * 0.8 + 0.15);

      // Squeeze builds while held and springs back once let go.
      if (dragging) holding += dt;
      const squashTarget = dragging ? Math.min(1, holding * HOLD_RAMP) : 0;
      squash = stepSpring(squash, squashTarget, SQUASH_SPRING, dt);
      uniforms.uSquash.value = clamp(squash.value, -0.35, 1);

      if (!dragging) {
        if (thrown) {
          const decay = Math.exp(-THROW_DAMP * dt);
          velX *= decay;
          velY *= decay;
          if (Math.hypot(velX, velY) < CALM_SPEED) {
            thrown = false;
            wander = Math.atan2(velY, velX);
          }
        } else {
          // Calm float: steer toward a slowly wandering direction. Edges still
          // bounce, so it keeps exploring the stage on its own.
          wander += (Math.sin(t * 0.31) * 0.6 + Math.sin(t * 0.17 + 2) * 0.4) * dt;
          const k = 1 - Math.exp(-IDLE_STEER * dt);
          velX += (Math.cos(wander) * IDLE_SPEED - velX) * k;
          velY += (Math.sin(wander) * IDLE_SPEED - velY) * k;
        }

        posX += velX * dt;
        posY += velY * dt;

        // Bounce off the stage edges, using the visible silhouette.
        const maxX = aspect - half * HEAD_W_FRAC;
        const maxY = 1 - half * HEAD_H_FRAC;
        if (posX < -maxX) {
          posX = -maxX;
          const impact = Math.abs(velX);
          velX = Math.abs(velX) * RESTITUTION;
          hitWall(1, 0, impact);
        } else if (posX > maxX) {
          posX = maxX;
          const impact = Math.abs(velX);
          velX = -Math.abs(velX) * RESTITUTION;
          hitWall(-1, 0, impact);
        }
        if (posY < -maxY) {
          posY = -maxY;
          const impact = Math.abs(velY);
          velY = Math.abs(velY) * RESTITUTION;
          hitWall(0, 1, impact);
        } else if (posY > maxY) {
          posY = maxY;
          const impact = Math.abs(velY);
          velY = -Math.abs(velY) * RESTITUTION;
          hitWall(0, -1, impact);
        }
      }

      // No flat z-rotation on purpose — the turn is sold by the depth shader.
      mesh.position.set(posX, posY, 0);

      blood.step(dt);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      mesh.geometry.dispose();
      material.dispose();
      colorTex.dispose();
      depthTex.dispose();
      renderer.dispose();
      canvas.remove();
      bloodCanvas.remove();
      probe.remove();
    };
  }, []);

  // Fills the hero box. Above the page content, below the header (z-50).
  return <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-40" aria-hidden="true" />;
}
