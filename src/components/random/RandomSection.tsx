import { random } from '@/data/random';
import { RandomCard } from './RandomCard';

// Scroll drift per column, px at full travel across the viewport. Opposite
// signs, so the two columns slide past each other rather than in step — the
// left rides up a little, the right sinks — which is what reads as depth.
const DRIFT_LEFT = -44;
const DRIFT_RIGHT = 64;

/**
 * Random — two big columns inside the 1400 band, flowing independently: odd
 * cards on the left, even on the right, the right column starting lower so
 * the pairs step down the page instead of lining up. Each card drifts a
 * little with the scroll (its column's own amount) and opens in place to
 * half the screen — see RandomCard. Content is placeholder until the files
 * land.
 */
export function RandomSection() {
  const left = random.filter((_, i) => i % 2 === 0);
  const right = random.filter((_, i) => i % 2 === 1);
  return (
    <section id="random" aria-labelledby="random-heading" className="py-[clamp(48px,7vw,110px)]">
      <h2 id="random-heading" className="sr-only">
        Random
      </h2>
      <div className="container-cases">
        <div className="random-columns">
          <ul className="random-col">
            {left.map((item) => (
              <li key={item.id}>
                <RandomCard item={item} drift={DRIFT_LEFT} />
              </li>
            ))}
          </ul>
          <ul className="random-col random-col-b">
            {right.map((item) => (
              <li key={item.id}>
                <RandomCard item={item} drift={DRIFT_RIGHT} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
