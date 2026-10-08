import Image from 'next/image';
import { aboutText, awardPosters } from '@/data/about';
import './about.css';

/**
 * About me, with the award diplomas stacking over it (#awards, the menu's
 * "Awards"). Pure CSS, no script: the text and every diploma sit in one grid
 * cell, each in its own track, and stick at their lines as the page scrolls.
 * The tracks are sized so the diplomas arrive one at a time and the whole
 * stack, text included, lets go at the same moment after the last — see
 * about.css for the arithmetic.
 */
export function AboutAwards() {
  return (
    <section
      id="awards"
      aria-labelledby="about-heading"
      className="aw"
      style={{ '--n': awardPosters.length } as React.CSSProperties}
    >
      <div className="aw__track aw__track--text">
        <div className="aw__text">
          <h2 id="about-heading" className="sr-only">
            About me and awards
          </h2>
          {aboutText.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
      <ol className="aw__stack" aria-label="Awards">
        {awardPosters.map((poster, i) => (
          <li
            key={poster.id}
            className="aw__track"
            style={{ '--i': i, '--ar': poster.height / poster.width } as React.CSSProperties}
          >
            <figure
              className="aw__poster"
              style={{ '--tilt': `${poster.tilt}deg`, '--nudge': poster.nudge } as React.CSSProperties}
            >
              <Image
                src={poster.src}
                width={poster.width}
                height={poster.height}
                sizes="(max-width: 899px) 72vw, 380px"
                alt={poster.alt}
              />
            </figure>
          </li>
        ))}
      </ol>
    </section>
  );
}
