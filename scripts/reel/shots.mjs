// The reel's shots. Each: where it starts, how long it runs, and per frame
// (t in seconds) where the page is scrolled and where the pointer is.
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// A gentler in-out for scrolls: a sine, no hard start.
const glide = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 0.5 - Math.cos(Math.PI * x) / 2);
const span = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a, b, k) => a + (b - a) * k;
// A path of [t, x, y] stops, eased between each pair.
const path = (t, stops, fn = ease) => {
  if (t <= stops[0][0]) return [stops[0][1], stops[0][2]];
  for (let i = 1; i < stops.length; i++) {
    const [t1, x1, y1] = stops[i];
    const [t0, x0, y0] = stops[i - 1];
    if (t <= t1) { const k = fn(span(t, t0, t1)); return [lerp(x0, x1, k), lerp(y0, y1, k)]; }
  }
  const l = stops[stops.length - 1];
  return [l[1], l[2]];
};
// Scroll stops: [t, y], glided between.
const scrollAt = (t, stops) => path(t, stops.map(([tt, y]) => [tt, y, 0]), glide)[0];

const PARK = [928, 1715, 2502]; // Kritika, Urbantiger, Chums parked

export const GRAB = { x: 714, y: 455 }; // the head at 1.7s, from a test run (mid-face)

export const shots = {
  // Hero, the cases one over another, and Chums opening.
  main: {
    duration: 16.5,
    warm: 90,
    async frame(t, api) {
      const g = globalThis.__grab ?? GRAB;
      const [x, y] = path(t, [
        [0.3, 1500, 900],
        [1.55, g.x, g.y],
        [1.75, g.x, g.y],
        [2.35, g.x - 34, g.y - 20],
        [2.5, g.x - 34, g.y - 20],
        [3.6, 1080, 560],
        [7.2, 1060, 540],
        [10.8, 1070, 560],
        [12.9, 420, 470],
        [16.5, 430, 480],
      ]);
      await api.pointer(x, y, t >= 0.3);
      if (t >= 1.75 && t < 2.5) await api.down();
      else await api.up();
      if (t >= 13.3 && t < 13.38) await api.down();
      else if (t >= 13.38 && t < 13.4) await api.up();
      if (t < 13.3) {
        await api.scroll(scrollAt(t, [[3.0, 0], [5.0, PARK[0]], [7.2, PARK[0]], [8.8, PARK[1]], [10.8, PARK[1]], [12.4, PARK[2]]]));
      } else if (t >= 14.6) {
        const y = scrollAt(t, [[14.6, 0], [16.5, 560]]);
        await api.page.evaluate((y) => { const s = document.querySelector('.cp__scroll'); if (s) s.scrollTop = y; }, y);
      }
    },
  },
};
