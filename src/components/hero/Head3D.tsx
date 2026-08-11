'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { assets } from '@/data/assets';
import { clamp, lerp } from '@/lib/lerp';
import { stepSpring, type SpringState } from '@/lib/spring';
import { createBloodField } from './blood';
import fragmentShader from './head.frag';
import vertexShader from './head.vert';

// Parallax strength → felt turn angle. Raised from ±14° once the mirror-fill
// kept the silhouette clean; the seam on the low-poly facets is the ceiling.
// Locked here per TZ §7.2 (find the max experimentally, then pin it).
const TILT_STRENGTH = 0.2; // ≈ ±23° of felt rotation with mirror-fill — nudged up, was reading too subtle
const DEPTH_PIVOT = 0.62; // cheek level — most natural pivot
const LIGHT_STRENGTH = 0.3;

// --- flight physics (world units, where the stage height spans 2) ----------
const IDLE_SPEED = 0.055; // calm drift
const IDLE_STEER = 1.2; // how fast idle velocity converges on the wander dir
const THROW_SPEED = 1.8; // tap impulse — a firm fling, just not a bullet
const MAX_THROW_SPEED = 2.6; // cap on a drag flick (uncapped it launched like a shot)
// Heft lives here, not in peak speed: a low decay + lively bounces + a low
// settle threshold let a throw carry its momentum and ricochet for a while,
// which reads as weight. Raising THROW_SPEED instead just makes a bullet.
const THROW_DAMP = 0.26; // glides a long time after release
const RESTITUTION = 0.9; // keeps most of its energy on a wall bounce
const CALM_SPEED = 0.1; // stays "thrown" longer before handing back to drift
const BLOOD_MIN_SPEED = 0.5; // only hard hits bleed — drifting must not spray

// Instead of spinning the plane flat, throws and impacts push the shader's
// depth-parallax so the head appears to turn in 3D. The twist is a spring, not
// an instant offset that decays: an impulse feeds its velocity so the turn
// eases in AND out — a step change read as a hard snap on every bounce.
const TWIST_SPRING = { stiffness: 40, damping: 13 }; // near-critical, smooth
const TWIST_FROM_THROW = 1.0; // velocity impulse per unit throw speed
const TWIST_FROM_IMPACT = 1.5; // velocity impulse per unit impact speed
const TWIST_MAX = 1.0;

// Autonomous idle sway — a slow, cursor-independent turn so the head keeps its
// 3D life at rest. Replaces the dimensionality the cursor-follow used to give,
// without the head tracking anything.
const IDLE_SWAY = 0.2;

// Squeeze while held (TZ follow-up: "as if squeezed by a fist").
const HOLD_RAMP = 1.4; // how fast the squeeze builds, per second
// A little under critical (~24.5): one clean bounce-back on release, no wobble.
// Lower than this (e.g. 11) oscillated and read as dirty while dragging.
const SQUASH_SPRING = { stiffness: 150, damping: 16 };
const IMPACT_SQUASH = 0.3;

// The texture is 1996² with the head occupying x 164–1832, y 444–1576 (TZ §1.3),
// so the plane carries empty margins. Collisions and splashes use the *visible*
// silhouette, otherwise the head bounces off thin air well before the edge.
const HEAD_W_FRAC = 1668 / 1996;
const HEAD_H_FRAC = 1132 / 1996;

// Where a bruise can land, in texture UV (v runs bottom-up). Kept inside the
// facial skin — pushing marks out to the silhouette edge put them on hair and
// ears, where they barely read.
const FACE_LEFT = 0.28;
const FACE_RIGHT = 0.72;
const FACE_TOP = 0.6; // forehead
const FACE_BOTTOM = 0.29; // chin

// Impact bruises on the face.
const MAX_MARKS = 6;
const MARK_FADE = 7; // seconds a bruise takes to disappear
// Matched to BLOOD_MIN_SPEED: if a hit drew blood it should leave a mark too.
const MARK_MIN_IMPACT = 0.5;

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
      // xy = UV position on the face, z = strength. Fixed length to match the
      // shader's compile-time array bound.
      uMarks: {
        value: Array.from({ length: MAX_MARKS }, () => new THREE.Vector3(0, 0, 0)),
      },
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
    hitImg.src = assets.headAlpha;

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

    // Twist as springs — impulses feed velocity so turns ease in and out.
    let twistX: SpringState = { value: 0, velocity: 0 };
    let twistY: SpringState = { value: 0, velocity: 0 };
    let squash: SpringState = { value: 0, velocity: 0 };
    let holding = 0; // seconds the pointer has been held down on the head

    // Onboarding: a couple of gentle self-squeezes shortly after load, to hint
    // the head is grabbable. Cancelled the moment the user interacts.
    const introStart = performance.now();
    const INTRO_TL = [
      { t: 1500, v: 0.42 },
      { t: 1950, v: 0.0 },
      { t: 2550, v: 0.42 },
      { t: 3000, v: 0.0 },
    ];
    let introIdx = 0;
    let introDone = false;
    let introSquash = 0;

    let dragging = false;
    let downTime = 0;
    let lastPX = 0;
    let lastPY = 0;
    let lastMoveT = 0;
    let dragVX = 0; // smoothed drag velocity (world units/sec)
    let dragVY = 0;
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
        const now = performance.now();
        // Real elapsed time, clamped, so a burst of high-frequency mouse events
        // doesn't inflate the velocity into a bullet on release.
        const mdt = Math.min(Math.max((now - lastMoveT) / 1000, 1 / 240), 1 / 30);
        lastMoveT = now;
        const k = 2 / H; // px → world units
        const dx = (e.clientX - lastPX) * k;
        const dy = -(e.clientY - lastPY) * k;
        posX += dx;
        posY += dy;
        // Smooth the reported velocity, but stay responsive to a flick so the
        // release has real momentum (too much smoothing killed the throw).
        dragVX = lerp(dragVX, dx / mdt, 0.55);
        dragVY = lerp(dragVY, dy / mdt, 0.55);
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
      lastMoveT = downTime;
      lastPX = e.clientX;
      lastPY = e.clientY;
      grabU = u * 2 - 1;
      grabV = -(v * 2 - 1);
      dragVX = dragVY = 0;
      velX = velY = 0;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      holding = 0;
      document.body.style.userSelect = '';
      thrown = true;
      const quick = performance.now() - downTime < 220;
      let speed = Math.hypot(dragVX, dragVY);
      if (quick && speed < 0.25) {
        // A tap → gentle lob away from where it was poked.
        const len = Math.hypot(grabU, grabV) || 1;
        velX = (grabU / len) * THROW_SPEED;
        velY = (grabV / len) * THROW_SPEED + 0.2;
      } else {
        // Drag flick, capped so it can't be launched off like a bullet.
        const capped = Math.min(speed, MAX_THROW_SPEED);
        velX = speed > 1e-4 ? (dragVX / speed) * capped : 0;
        velY = speed > 1e-4 ? (dragVY / speed) * capped : 0;
      }
      speed = Math.hypot(velX, velY);
      // Twist impulse along the throw — fed into the spring's velocity so the
      // turn eases rather than snapping.
      twistX.velocity -= velX * TWIST_FROM_THROW;
      twistY.velocity -= velY * TWIST_FROM_THROW;
      // Let the squeeze spring back on its own (no hard kick — that wobbled).
    };

    window.addEventListener('pointermove', onPointerMove);
    // Not passive: grabbing the head calls preventDefault to stop text selection.
    window.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointerup', onPointerUp);

    // Bruise slots, reused round-robin once all six are taken.
    const marks = uniforms.uMarks.value;
    let markSlot = 0;

    /**
     * Stamp a bruise where the head struck. The contact sits on the silhouette
     * edge facing the wall, jittered along that edge so repeat hits don't stack
     * in the same spot.
     */
    const addMark = (nx: number, ny: number, impact: number) => {
      if (impact < MARK_MIN_IMPACT) return;
      const jitter = () => 0.5 + (Math.random() - 0.5) * 0.55;
      let u: number;
      let v: number;
      if (nx > 0) {
        u = FACE_LEFT; // hit the left wall → mark on the left cheek
        v = FACE_BOTTOM + (FACE_TOP - FACE_BOTTOM) * jitter();
      } else if (nx < 0) {
        u = FACE_RIGHT;
        v = FACE_BOTTOM + (FACE_TOP - FACE_BOTTOM) * jitter();
      } else if (ny > 0) {
        u = FACE_LEFT + (FACE_RIGHT - FACE_LEFT) * jitter();
        v = FACE_BOTTOM; // hit the bottom → mark on the chin
      } else {
        u = FACE_LEFT + (FACE_RIGHT - FACE_LEFT) * jitter();
        v = FACE_TOP;
      }
      // Harder knocks bruise darker, but cap it so it never goes cartoonish.
      const strength = Math.min(0.6 + (impact - MARK_MIN_IMPACT) * 0.4, 1);
      marks[markSlot].set(u, v, strength);
      markSlot = (markSlot + 1) % MAX_MARKS;
    };

    /** Bounce against a wall, bleed if the hit was hard. n points inward. */
    const hitWall = (nx: number, ny: number, impact: number) => {
      // Impulse into the twist spring's velocity, so the turn swings in and out
      // smoothly instead of jumping — a step here read as a hard snap.
      twistX.velocity += nx * impact * TWIST_FROM_IMPACT;
      twistY.velocity -= ny * impact * TWIST_FROM_IMPACT;
      squash.velocity += Math.min(impact, 2) * IMPACT_SQUASH * 6;
      addMark(nx, ny, impact);

      if (impact < BLOOD_MIN_SPEED) return;
      // Contact point: pulled in ~15% from the silhouette edge, so the splash
      // originates visibly ON the head's surface rather than glued to the wall
      // line — sitting exactly at the wall read as "blood from the wall".
      const cx = toStageX(posX) - nx * (sizePx / 2) * HEAD_W_FRAC * 0.85;
      const cy = toStageY(posY) + ny * (sizePx / 2) * HEAD_H_FRAC * 0.85;
      blood.splash(cx, cy, nx, -ny, impact);
    };

    // ---- loop --------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const t = now / 1000;

      // Orientation is purely physical: twist springs back to face-on, so
      // throws and bounces ease in and out. No cursor tracking.
      twistX = stepSpring(twistX, 0, TWIST_SPRING, dt);
      twistY = stepSpring(twistY, 0, TWIST_SPRING, dt);
      // Add the slow autonomous sway so the head has 3D life even at rest.
      const swayX = Math.sin(t * 0.42) * IDLE_SWAY + Math.sin(t * 0.19 + 1.3) * IDLE_SWAY * 0.5;
      const swayY = Math.sin(t * 0.33 + 2.1) * IDLE_SWAY * 0.7;
      const tx = clamp(twistX.value + swayX, -TWIST_MAX, TWIST_MAX);
      const ty = clamp(twistY.value + swayY, -TWIST_MAX, TWIST_MAX);
      uniforms.uPointer.value.set(tx, ty);
      // Light rides the turn, so it shades; at rest it's a gentle constant.
      uniforms.uLightDir.value.set(tx * 0.8, ty * 0.8 + 0.15);

      // Squeeze builds while held and springs back once let go. A pause in the
      // drag bleeds the tracked velocity, so releasing after holding still
      // doesn't fling a stale direction.
      if (dragging) {
        holding += dt;
        const bleed = Math.exp(-2.5 * dt);
        dragVX *= bleed;
        dragVY *= bleed;
        introDone = true; // any grab ends the onboarding hint
        introSquash = 0;
      }
      // Advance the onboarding squeeze timeline.
      if (!introDone) {
        const el = now - introStart;
        while (introIdx < INTRO_TL.length && el >= INTRO_TL[introIdx].t) {
          introSquash = INTRO_TL[introIdx].v;
          introIdx += 1;
        }
        if (introIdx >= INTRO_TL.length) introDone = true;
      }
      // Bruises heal over time.
      for (let i = 0; i < MAX_MARKS; i++) {
        if (marks[i].z > 0) marks[i].z = Math.max(0, marks[i].z - dt / MARK_FADE);
      }

      const squashTarget = dragging ? Math.min(1, holding * HOLD_RAMP) : introSquash;
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
      raf = onScreen ? requestAnimationFrame(loop) : 0;
    };

    // The hero scrolls away and stays away, but this loop used to keep
    // rendering the head at full rate underneath the rest of the page — a
    // permanent GPU tax on every scroll. Pause while the stage is off screen;
    // dt is already clamped, so picking back up is seamless.
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === onScreen) return;
      onScreen = entry.isIntersecting;
      if (onScreen && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      } else if (!onScreen && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(wrap);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
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
