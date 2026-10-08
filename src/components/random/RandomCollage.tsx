'use client';

import { collage, type CollageItem } from '@/data/randomCollage';
import { useLazyVideo } from '@/hooks/useLazyVideo';
import './random-collage.css';

/** A project's clip; its source is attached on approach (useLazyVideo). */
function Clip({ video }: { video: CollageItem['video'] }) {
  const ref = useLazyVideo(video.src);
  return (
    <video
      ref={ref}
      className="rc__video"
      width={video.width}
      height={video.height}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      poster={video.poster}
      aria-label={video.alt}
    />
  );
}

/**
 * Random (#random, the menu's "Random"), after the work list on rsquare.work:
 * one big clip per project, leaning left or right of centre, with the title
 * under it in the case cards' style.
 */
export function RandomCollage() {
  return (
    <section id="random" aria-labelledby="random-heading" className="rc">
      <h2 id="random-heading" className="sr-only">
        Random
      </h2>
      <ul className="rc__list">
        {collage.map((item) => (
          <li
            key={item.id}
            className="rc__item"
            data-side={item.side}
            data-shape={item.video.height > item.video.width ? 'upright' : 'wide'}
          >
            <div className="rc__media" style={{ aspectRatio: `${item.video.width} / ${item.video.height}` }}>
              <Clip video={item.video} />
            </div>
            <h3 className="rc__title">{item.title}</h3>
          </li>
        ))}
      </ul>
    </section>
  );
}
