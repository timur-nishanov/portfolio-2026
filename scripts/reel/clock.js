// The reel's clock (rec.mjs), injected before the page's own scripts: the
// page runs on a clock the recorder steps a frame at a time, so every frame
// of the reel is exact however long the browser takes to draw it. Timers,
// animation frames, CSS animations and transitions, and the clips all keep
// to it; the WebGL check is told it has a GPU (the head and the glass then
// draw in SwiftShader, slowly, which the clock makes no matter); and the
// pointer is drawn as a cursor, which a screenshot doesn't show.
(() => {
  // --- the clock -------------------------------------------------------------
  let now = 0;
  const dateBase = Date.now();
  performance.now = () => now;
  Date.now = () => dateBase + now;

  // A fixed seed: the same run every time.
  let seed = 0x2f6e2b1;
  Math.random = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  let rafSeq = 0;
  let rafQ = new Map();
  window.requestAnimationFrame = (cb) => { const id = ++rafSeq; rafQ.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { rafQ.delete(id); };

  const realSetTimeout = window.setTimeout.bind(window);
  let tSeq = 0;
  const timers = new Map();
  const add = (cb, ms, args, every) => { const id = ++tSeq; timers.set(id, { at: now + Math.max(0, +ms || 0), cb, args, every }); return id; };
  window.setTimeout = (cb, ms, ...args) => add(cb, ms, args, 0);
  window.setInterval = (cb, ms, ...args) => add(cb, ms, args, Math.max(1, +ms || 0));
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  window.requestIdleCallback = (cb) => add(() => cb({ didTimeout: false, timeRemaining: () => 8 }), 0, [], 0);
  window.cancelIdleCallback = (id) => timers.delete(id);

  window.__now = () => now;
  window.__advance = (dt) => {
    const target = now + dt;
    for (let guard = 0; guard < 10000; guard++) {
      let next = null;
      for (const [id, t] of timers) if (t.at <= target && (!next || t.at < next[1].at)) next = [id, t];
      if (!next) break;
      const [id, t] = next;
      now = Math.max(now, t.at);
      if (t.every) t.at += t.every; else timers.delete(id);
      try { typeof t.cb === 'function' ? t.cb(...t.args) : (0, eval)(t.cb); } catch (e) { console.error('timer', e); }
    }
    now = target;
    const q = rafQ; rafQ = new Map();
    for (const cb of q.values()) { try { cb(now); } catch (e) { console.error('raf', e); } }
  };

  // --- CSS animations and transitions on the clock --------------------------
  window.__syncAnimations = () => {
    for (const a of document.getAnimations()) {
      if (a.timeline && a.timeline !== document.timeline) continue; // tied to the scroll
      if (!a.__v) { a.__v = { start: now }; a.pause(); }
      const ct = now - a.__v.start;
      const end = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
      if (Number.isFinite(end) && ct >= end) { try { a.finish(); } catch {} continue; }
      a.currentTime = ct;
    }
  };

  // --- video on the clock ----------------------------------------------------
  const MP = HTMLMediaElement.prototype;
  const realPause = MP.pause;
  const vids = new Set();
  const start = (v) => { if (!v.__vp) { v.__vp = { start: now, base: v.currentTime || 0 }; vids.add(v); } };
  MP.play = function () {
    const was = !!this.__vp;
    start(this);
    realPause.call(this);
    if (!was) { this.dispatchEvent(new Event('play')); this.dispatchEvent(new Event('playing')); }
    return Promise.resolve();
  };
  MP.pause = function () {
    const was = !!this.__vp;
    this.__vp = null; vids.delete(this);
    realPause.call(this);
    if (was) this.dispatchEvent(new Event('pause'));
  };
  Object.defineProperty(MP, 'paused', { configurable: true, get() { return !this.__vp; } });
  // The browser's own autoplay: taken over by the clock.
  document.addEventListener('play', (e) => { if (e.isTrusted && e.target instanceof HTMLMediaElement) { start(e.target); realPause.call(e.target); } }, true);
  window.__syncVideos = () => {
    const waits = [];
    for (const v of vids) {
      if (!v.isConnected) { vids.delete(v); continue; }
      if (!v.__vp || v.readyState < 1 || !Number.isFinite(v.duration)) continue;
      let t = v.__vp.base + (now - v.__vp.start) / 1000;
      if (v.loop) t = t % v.duration;
      else if (t >= v.duration) { t = v.duration; }
      t = Math.min(t, v.duration - 0.001);
      if (Math.abs(v.currentTime - t) < 0.0005 && v.readyState >= 2) continue;
      waits.push(new Promise((res) => {
        const done = () => { v.removeEventListener('seeked', done); res(); };
        v.addEventListener('seeked', done);
        v.currentTime = t;
        realSetTimeout(done, 4000);
      }));
    }
    return Promise.all(waits);
  };

  // --- WebGL as if on a GPU (the page keeps software drawing for stills) ----
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    if (attrs && attrs.failIfMajorPerformanceCaveat) attrs = { ...attrs, failIfMajorPerformanceCaveat: false };
    return getContext.call(this, type, attrs);
  };
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue;
    const gp = C.prototype.getParameter;
    C.prototype.getParameter = function (p) { return p === 0x9246 ? 'Apple M2' : gp.call(this, p); };
  }

  // --- the cursor ------------------------------------------------------------
  window.__cursor = (x, y, visible) => {
    let c = document.getElementById('__reel_cursor');
    if (!c) {
      c = document.createElement('div');
      c.id = '__reel_cursor';
      c.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;will-change:transform';
      c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><path d="M6.2 3.6v17.6l4.3-4.1 2.8 6.6 3-1.3-2.8-6.5h5.9z" fill="#000" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      document.documentElement.appendChild(c);
    }
    c.style.transform = `translate3d(${x - 6.2}px, ${y - 3.6}px, 0)`;
    c.style.opacity = visible ? '1' : '0';
  };
})();
