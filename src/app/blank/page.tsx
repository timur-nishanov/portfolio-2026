import type { Metadata } from 'next';
import { FloatingHead } from '@/components/hero/FloatingHead';

export const metadata: Metadata = {
  title: 'blank',
  // A recording stage, not a page of the site — keep crawlers off it.
  robots: { index: false, follow: false },
};

/**
 * /blank — a 4:5 white stage with the head alone, for screen recordings
 * bound for Instagram. The stage is as tall as the window and 4:5 wide,
 * centred on black: crop the black bars off and the clip is the format.
 * The head plays inside the stage, not the window, so it never leaves
 * the crop. Linked from nowhere on the site; delete this folder to turn
 * it off.
 */
export default function Blank() {
  return (
    <main className="grid h-dvh place-items-center overflow-hidden bg-black">
      <div
        className="relative h-full overflow-hidden bg-white"
        style={{
          aspectRatio: '4 / 5',
          // The site's head is sized off the viewport width; here it is sized
          // off the stage, which is 80vh wide, so it fits the 4:5 with room
          // to fly.
          '--head-size': 'calc(80vh * 0.78)',
        } as React.CSSProperties}
      >
        <FloatingHead />
      </div>
    </main>
  );
}
