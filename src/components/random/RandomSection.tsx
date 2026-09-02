import { random } from '@/data/random';
import { RandomCard } from './RandomCard';

/**
 * Random — nine cards on the site grid (12 columns inside the 1400 band),
 * each one a clip or a still that opens in place to half the screen; see
 * RandomCard for the move. Content is placeholder until the files land.
 */
export function RandomSection() {
  return (
    <section id="random" aria-labelledby="random-heading" className="py-[clamp(48px,7vw,110px)]">
      <h2 id="random-heading" className="sr-only">
        Random
      </h2>
      <div className="container-cases">
        <ul className="random-grid">
          {random.map((item) => (
            <li key={item.id} style={{ '--span': item.span } as React.CSSProperties}>
              <RandomCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
