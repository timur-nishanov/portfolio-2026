/**
 * One picture or clip in a case study (ChumsArticle, UrbantigerArticle). A
 * slot with a `src` draws its file; one without is a quiet stand-in of the
 * same shape until the file is in — put it in /public and its path in the
 * case's data. Videos play muted, looped and inline, and load only as they
 * come near.
 */
export type CaseSlot = {
  kind: 'video' | 'image';
  src?: string;
  poster?: string;
  alt: string;
  /** The file's own size, so its room is kept before it arrives. */
  w?: number;
  h?: number;
};

/** The same thing before and after. */
export type CasePair = { before: CaseSlot; after: CaseSlot };
