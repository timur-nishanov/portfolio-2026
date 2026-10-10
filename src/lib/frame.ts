/**
 * One pass a frame for everything that follows the scroll: every job's reads
 * (rects, sizes), then every job's writes (styles). Each scroll effect used
 * to read the page in its own animation frame right after another had written
 * its styles, so the browser worked out styles (and layout) again for every
 * reader — several times a frame, hundreds of times a scroll.
 *
 * The page's smooth scroller runs the pass right after it has moved the page
 * (SmoothScrollProvider), so what is read is where the page is in this very
 * frame; without it (reduced motion), the pass gets an animation frame of its
 * own.
 */
export type FrameJob = { read?: () => void; write: () => void };

const queue = new Set<FrameJob>();
let raf = 0;

export function flushFrame() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (!queue.size) return;
  const jobs = [...queue];
  queue.clear();
  for (const job of jobs) job.read?.();
  for (const job of jobs) job.write();
}

/** Queue a job for the coming frame (once, however often it is asked for). */
export function scheduleFrame(job: FrameJob) {
  queue.add(job);
  if (!raf) raf = requestAnimationFrame(flushFrame);
}

export function cancelFrame(job: FrameJob) {
  queue.delete(job);
}
