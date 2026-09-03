import { random } from '@/data/random';
import { RandomCard } from './RandomCard';

/**
 * Random — a plain 3×3 grid of 4:3 tiles inside the 1400 band, the
 * madewithjitter.com way: tile, then a caption row with the title and the
 * years inline and a sphere pill at the right. A tile lifts a touch on
 * hover and opens in place to most of the screen — see RandomCard. Content
 * is placeholder until the files land.
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
            <li key={item.id}>
              <RandomCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
