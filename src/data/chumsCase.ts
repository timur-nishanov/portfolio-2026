/**
 * The media in the Chums case study (ChumsArticle). Every slot is a card with
 * a placeholder until it gets a `src`: put the file in /public and its path
 * here, and the card draws it in its device — a phone in the iPhone frame, a
 * desktop recording on the iMac, a desktop screenshot as is. Videos play
 * muted, looped and inline, and load only as they come near.
 */
export type CaseSlot = {
  kind: 'video' | 'image';
  src?: string;
  poster?: string;
  alt: string;
  /** What goes here — shown on the placeholder until the file is in. */
  hint: string;
};

type ChumsMedia = {
  concept: { before: CaseSlot; after: CaseSlot };
  desktop: { before: CaseSlot[]; after: CaseSlot };
  rewards: CaseSlot[];
};

export const chumsMedia: ChumsMedia = {
  concept: {
    before: {
      kind: 'video',
      alt: 'The old Chums app: signing in to a server takes a while',
      hint: 'Video · the old app, signing in to a server',
    },
    after: {
      kind: 'video',
      alt: 'The concept: the same sign-in, in a sheet over the chat list',
      hint: 'Video · the concept, same action',
    },
  },
  desktop: {
    before: [
      { kind: 'image', alt: 'The old desktop client', hint: 'Screenshot · old desktop client' },
      { kind: 'image', alt: 'The old desktop client', hint: 'Screenshot · old desktop client' },
      { kind: 'image', alt: 'The old desktop client', hint: 'Screenshot · old desktop client' },
    ],
    after: {
      kind: 'video',
      alt: 'The rebuilt desktop client',
      hint: 'Video · the rebuilt desktop client',
    },
  },
  rewards: [
    { kind: 'image', alt: 'A Chums rewards screen', hint: 'Image · rewards screen' },
    { kind: 'image', alt: 'A Chums rewards screen', hint: 'Image · rewards screen' },
    { kind: 'image', alt: 'A Chums rewards screen', hint: 'Image · rewards screen' },
    { kind: 'image', alt: 'A Chums rewards screen', hint: 'Image · rewards screen' },
  ],
};
