import { random } from '@/data/random';
import { RandomCard } from './RandomCard';

/**
 * Random — one flow of wide cards inside the 1400 band, each eight of the
 * twelve columns, taking turns at the left and the right edge so the eye
 * zig-zags down the page (the rsquare.work rhythm). Each card opens in
 * place to most of the screen — see RandomCard. Content is placeholder
 * until the files land.
 */
export function RandomSection() {
  return (
    <section id="random" aria-labelledby="random-heading" className="py-[clamp(48px,7vw,110px)]">
      <h2 id="random-heading" className="sr-only">
        Random
      </h2>
      <div className="container-cases">
        <ul className="random-flow">
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
