import { zoomOf } from '@/lib/zoom';

/** The chip's box, CSS px: "Case study" in the notes' 15px with room either
    side, half as tall again as the words, as the header pill is to its
    title. Fixed, so its liquid glass (#lg-chip, CaseShowcase) is drawn for
    exactly this shape. */
export const CHIP = { width: 106, height: 30 };

// Where the chip sits relative to the pointer's tip, so it never hides what
// the cursor points at.
const OFFSET_X = 16;
const OFFSET_Y = 16;
// How near the card's edge it may come: past it, the label would hang off
// the card (on the right) or under the next one (below).
const EDGE = 8;

export type ChipPlace = {
  /** Its top left in the card's own px. */
  tx: number;
  ty: number;
  /** It would cover the notes, so it steps aside (showcase.css). */
  aside: boolean;
  /** Where that is on screen, the body's zoom divided out (caseMorph's units). */
  box: { top: number; right: number; bottom: number; left: number };
};

/**
 * Where the chip sits over this card for a pointer at (x, y): one sum for
 * the chip that follows the pointer (CursorChip) and for the case closing
 * back into it (caseMorph), so the two land on the same pixel.
 */
export function chipPlace(card: HTMLElement, x: number, y: number, notes?: HTMLElement | null): ChipPlace {
  const r = card.getBoundingClientRect();
  const z = zoomOf(card);
  // Kept on the card: near its right or bottom edge the label stops there
  // and the pointer runs on over it (it takes no pointer).
  const tx = Math.min((x - r.left) / z + OFFSET_X, r.width / z - CHIP.width - EDGE);
  const ty = Math.min((y - r.top) / z + OFFSET_Y, r.height / z - CHIP.height - EDGE);
  // The notes' box in the card's own px, as tx and ty are (the card is
  // their offset parent).
  const n = notes === undefined ? card.querySelector<HTMLElement>('.cs-card__notes') : notes;
  const aside =
    !!n &&
    tx < n.offsetLeft + n.offsetWidth &&
    tx + CHIP.width > n.offsetLeft &&
    ty < n.offsetTop + n.offsetHeight &&
    ty + CHIP.height > n.offsetTop;
  const left = r.left / z + tx;
  const top = r.top / z + ty;
  return { tx, ty, aside, box: { top, right: left + CHIP.width, bottom: top + CHIP.height, left } };
}

/** The case closing back into the chip asks it to take over where the drop
    lands (CursorChip): shown there at once, under the pointer at (x, y). */
export const CHIP_DOCK = 'cs-chip:dock';

/** True when a chip took it over (a mouse device; CursorChip listens). */
export function dockChip(card: HTMLElement, x: number, y: number): boolean {
  return !card.dispatchEvent(new CustomEvent(CHIP_DOCK, { cancelable: true, detail: { x, y } }));
}
