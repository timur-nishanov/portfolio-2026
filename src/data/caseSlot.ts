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
  /** A short line under it saying what happens in it (the two sides of a
      comparison are named Before and After instead). */
  caption?: string;
  /** The file's own size, so its room is kept before it arrives. */
  w?: number;
  h?: number;
};

/** The same thing before and after, and what the two sides are called under
    them if not Before and After. */
export type CasePair = { before: CaseSlot; after: CaseSlot; labels?: [before: string, after: string] };
