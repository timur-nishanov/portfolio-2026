'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { assets } from '@/data/assets';
import { clamp } from '@/lib/lerp';
import { stepSpring, type SpringState } from '@/lib/spring';
import fragmentShader from './head.frag';
import vertexShader from './head.vert';

// Parallax strength → felt turn angle. Raised from ±14° once the mirror-fill
// kept the silhouette clean; the seam on the low-poly facets is the ceiling.
// Locked here per TZ §7.2 (find the max experimentally, then pin it).
const TILT_STRENGTH = 0.17; // ≈ ±20° of felt rotation with mirror-fill
const DEPTH_PIVOT = 0.62; // cheek level — most natural pivot
const LIGHT_STRENGTH = 0.3;
const FOLLOW_SPRING = { stiffness: 90, damping: 18 };
const THROW_DAMP = 0.94; // per-frame inertia decay
const RETURN_PULL = 0.025; // soft spring back to origin
const BOUND = 0.72; // keep the head inside its box (≈ hero zone)

export function Head3D() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    // Behind the hero text; all interaction is read from window + alpha test.
    canvas.style.pointerEvents = 'none';
    wrap.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const loader = new THREE.TextureLoader();
    const colorTex = loader.load(assets.headColor);
    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.minFilter = THREE.LinearFilter;
    colorTex.magFilter = THREE.LinearFilter;
    const depthTex = loader.load(assets.headDepth);
    depthTex.colorSpace = THREE.NoColorSpace; // raw depth values, do not gamma them
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

    // ---- alpha hit test (grab only opaque head pixels) --------------------
    const hitCanvas = document.createElement('canvas');
    hitCanvas.width = hitCanvas.height = 128;
    const hitCtx = hitCanvas.getContext('2d', { willReadFrequently: true });
    let alphaData: Uint8ClampedArray | null = null;
    const hitImg = new Image();
    hitImg.crossOrigin = 'anonymous';
    hitImg.onload = () => {
      if (!hitCtx) return;
      hitCtx.drawImage(hitImg, 0, 0, 128, 128);
      alphaData = hitCtx.getImageData(0, 0, 128, 128).data;
    };
    hitImg.src = assets.headColor;

    const isOnHead = (u: number, v: number) => {
      if (!alphaData) return false;
      const px = clamp(Math.floor(u * 128), 0, 127);
      const py = clamp(Math.floor(v * 128), 0, 127);
      return alphaData[(py * 128 + px) * 4 + 3] > 40;
    };

    // ---- state ------------------------------------------------------------
    let width = wrap.clientWidth || 1;
    let height = wrap.clientHeight || 1;
    const resize = () => {
      width = wrap.clientWidth || 1;
      height = wrap.clientHeight || 1;
      renderer.setSize(width, height, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // pointer target (viewport-normalised) + smoothed springs
    const target = new THREE.Vector2(0, 0);
    let sx: SpringState = { value: 0, velocity: 0 };
    let sy: SpringState = { value: 0, velocity: 0 };

    // throw physics
    let posX = 0;
    let posY = 0;
    let velX = 0;
    let velY = 0;
    let rot = 0;
    let angVel = 0;
    let dragging = false;
    let downTime = 0;
    let lastPX = 0;
    let lastPY = 0;
    let downLocalX = 0;
    let downLocalY = 0;

    const localFromEvent = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height, r };
    };

    const onPointerMove = (e: PointerEvent) => {
      // Global tilt follow.
      target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      uniforms.uLightDir.value.set(target.x, target.y);

      if (dragging) {
        const dxPx = e.clientX - lastPX;
        const dyPx = e.clientY - lastPY;
        const k = 2 / (canvas.getBoundingClientRect().width || width);
        posX = clamp(posX + dxPx * k, -BOUND, BOUND);
        posY = clamp(posY - dyPx * k, -BOUND, BOUND);
        velX = dxPx * k;
        velY = -dyPx * k;
        lastPX = e.clientX;
        lastPY = e.clientY;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const { u, v, r } = localFromEvent(e);
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      // account for current head offset when testing the (static) alpha map
      if (!isOnHead(u - posX / 2, v + posY / 2)) return;
      dragging = true;
      downTime = performance.now();
      lastPX = e.clientX;
      lastPY = e.clientY;
      downLocalX = u * 2 - 1;
      downLocalY = -(v * 2 - 1);
      velX = velY = 0;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      const quick = performance.now() - downTime < 200;
      const moved = Math.hypot(velX, velY) > 0.002;
      if (quick && !moved) {
        // A tap → impulse away from centre, plus a little spin (TZ §7.2).
        const len = Math.hypot(downLocalX, downLocalY) || 1;
        velX = (downLocalX / len) * 0.05;
        velY = (downLocalY / len) * 0.05 + 0.02;
        angVel = downLocalX * 0.06;
      } else {
        angVel = velX * 0.4;
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    // ---- loop -------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      sx = stepSpring(sx, target.x, FOLLOW_SPRING, dt);
      sy = stepSpring(sy, target.y, FOLLOW_SPRING, dt);
      uniforms.uPointer.value.set(sx.value, sy.value);

      if (!dragging) {
        // inertia + soft return
        velX = velX * THROW_DAMP - posX * RETURN_PULL;
        velY = velY * THROW_DAMP - posY * RETURN_PULL;
        posX = clamp(posX + velX, -BOUND, BOUND);
        posY = clamp(posY + velY, -BOUND, BOUND);
        if (Math.abs(posX) >= BOUND) velX = 0;
        if (Math.abs(posY) >= BOUND) velY = 0;
        angVel = angVel * THROW_DAMP - rot * RETURN_PULL;
        rot += angVel;
      }
      mesh.position.set(posX, posY, 0);
      mesh.rotation.z = rot;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      mesh.geometry.dispose();
      material.dispose();
      colorTex.dispose();
      depthTex.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={wrapRef} className="absolute inset-0" aria-hidden="true" />;
}
