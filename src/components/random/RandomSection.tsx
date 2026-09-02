import { random } from '@/data/random';
import { RandomCard } from './RandomCard';

// Scroll drift, px at full travel across the viewport. Alternating signs, so
// consecutive cards slide past each other rather than in step — the left
// ones ride up a little, the right ones sink — which is what reads as depth.
const DRIFT_LEFT = -44;
const DRIFT_RIGHT = 64;

/**
 * Random — one flow of wide cards inside the 1400 band, each eight of the
 * twelve columns, taking turns at the left and the right edge so the eye
 * zig-zags down the page (the rsquare.work rhythm). Each card drifts a
 * little with the scroll and opens in place to half the screen — see
 * RandomCard. Content is placeholder until the files land.
 */
export function RandomSection() {
  return (
    <section id="random" aria-labelledby="random-heading" className="py-[clamp(48px,7vw,110px)]">
      <h2 id="random-heading" className="sr-only">
        Random
      </h2>
      <div className="container-cases">
        <ul className="random-flow">
          {random.map((item, i) => (
            <li key={item.id}>
              <RandomCard item={item} drift={i % 2 === 0 ? DRIFT_LEFT : DRIFT_RIGHT} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
