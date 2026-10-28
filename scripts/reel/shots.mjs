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
    if (t <= t1) {
      const k = fn(span(t, t0, t1));
      return [lerp(x0, x1, k), lerp(y0, y1, k)];
    }
  }
  const l = stops[stops.length - 1];
  return [l[1], l[2]];
};
// Scroll stops: [t, y], glided between.
const scrollAt = (t, stops) => path(t, stops.map(([tt, y]) => [tt, y, 0]), glide)[0];

// The layout at 1440×810: where each card parks (its top at the sticky
// line), and where the later sections start.
const PARK = [928, 1715, 2502]; // Kritika, Urbantiger, Chums
const AWARDS = 5653;
const RANDOM = 8150;
const OUTRO = 13418; // also the page's last scroll position

// The head at 1.7s into `main`, read off a test frame (mid-face).
export const GRAB = { x: 714, y: 455 };
// Over a card's device, where its "Case study" chip shows (not over the
// notes, where it steps aside).
const OVER = { x: 870, y: 600 };

export const shots = {
  // The hero, where the cursor squeezes the head, then the cases sliding
  // one over another: Kritika, Urbantiger, Chums.
  main: {
    duration: 13,
    async frame(t, api) {
      const g = GRAB;
      const [x, y] = path(t, [
        [0.3, 1500, 900],
        [1.55, g.x, g.y],
        [1.75, g.x, g.y],
        [2.35, g.x - 34, g.y - 20],
        [2.5, g.x - 34, g.y - 20],
        [3.8, OVER.x, OVER.y],
        [7.2, OVER.x + 20, OVER.y - 14],
        [10.8, OVER.x - 6, OVER.y + 16],
        [13, OVER.x, OVER.y],
      ]);
      await api.pointer(x, y, t >= 0.3);
      if (t >= 1.75 && t < 2.5) await api.down();
      else await api.up();
      await api.scroll(
        scrollAt(t, [
          [3.0, 0],
          [5.0, PARK[0]],
          [7.2, PARK[0]],
          [8.8, PARK[1]],
          [10.8, PARK[1]],
          [12.4, PARK[2]],
        ]),
      );
    },
  },

  // Kritika parked, a click, and its case grows out of the chip; its page
  // scrolls down to the app in hand.
  case: {
    duration: 5,
    async setup(api) {
      await api.scroll(PARK[0]);
      await api.pointer(OVER.x, OVER.y);
    },
    async frame(t, api) {
      const [x, y] = path(t, [
        [0, OVER.x, OVER.y],
        [0.55, OVER.x - 4, OVER.y + 3],
        [1.4, OVER.x - 4, OVER.y + 3],
        [2.6, 1290, 690],
      ]);
      await api.pointer(x, y, t < 2.6);
      if (t >= 0.6 && t < 0.68) await api.down();
      else await api.up();
      if (t >= 2.0) {
        await api.page.evaluate(
          ([k]) => {
            const s = document.querySelector('.cp__scroll');
            if (!s) return;
            if (window.__caseTo === undefined) {
              const f = s.querySelector('.cp-figure--stage');
              const top = f ? f.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop : 600;
              window.__caseTo = Math.max(0, top - 96);
            }
            s.scrollTop = window.__caseTo * k;
          },
          [glide(span(t, 2.0, 4.6))],
        );
      }
    },
  },

  // About, the diplomas coming up over it one by one.
  awards: {
    duration: 3.8,
    async setup(api) {
      await api.scroll(AWARDS);
    },
    async frame(t, api) {
      await api.pointer(-50, -50, false);
      await api.scroll(scrollAt(t, [[0.2, AWARDS], [3.6, AWARDS + 1300]]));
    },
  },

  // Random: the Kritika film, then Artem's site.
  random: {
    duration: 3.6,
    async setup(api) {
      await api.scroll(RANDOM);
    },
    async frame(t, api) {
      await api.pointer(-50, -50, false);
      await api.scroll(scrollAt(t, [[0.2, RANDOM], [3.4, RANDOM + 1450]]));
    },
  },

  // The end of the page: the balls drop in as it comes up, and settle.
  outro: {
    duration: 4.6,
    async setup(api) {
      await api.scroll(OUTRO - 920);
    },
    async frame(t, api) {
      await api.pointer(-50, -50, false);
      await api.scroll(scrollAt(t, [[0.1, OUTRO - 920], [2.0, OUTRO]]));
    },
  },

  // The last card: the page's off-white, and the address fading in.
  end: {
    duration: 3,
    async setup(api) {
      await api.page.evaluate(() => {
        const d = document.createElement('div');
        d.id = '__reel_end';
        d.style.cssText =
          'position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:#f7f7f5;' +
          'font-family:var(--font-sf);font-size:56px;line-height:1.32;font-weight:400;color:#08080a;letter-spacing:0';
        d.innerHTML = '<span id="__reel_end_t" style="opacity:0">timur.design</span>';
        document.body.appendChild(d);
      });
    },
    async frame(t, api) {
      await api.pointer(-50, -50, false);
      const k = ease(span(t, 0.35, 1.35));
      await api.page.evaluate(
        ([o, y]) => {
          const s = document.getElementById('__reel_end_t');
          s.style.opacity = String(o);
          s.style.transform = `translateY(${y}px)`;
        },
        [k, (1 - k) * 8],
      );
    },
  },
};
