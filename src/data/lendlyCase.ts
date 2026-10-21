import type { CaseSlot } from './caseSlot';

/** The media in the Lendly case study (LendlyArticle): see CaseSlot. The
    recordings are each the whole of their white stage, a browser window at
    1280×800, as the Urbantiger case's are; the mobile one is two phones on a
    stage of its own, 1080×1350. */
type LendlyMedia = {
  /** 01: a card on the market, its badges and the yield's tooltip. */
  marketCard: CaseSlot;
  /** 01: the filters folding away and back. */
  filters: CaseSlot;
  /** 02: a stake bought from another investor, in one window. */
  secondary: CaseSlot;
  /** 02: a new loan bought step by step, a signature at each. */
  primary: CaseSlot;
  /** 03: over the limit, the application for qualified investor status. */
  qualified: CaseSlot;
  /** 04: the dashboard and the payout calendar. */
  dashboard: CaseSlot;
  /** 04: analytics, the investor's portfolio, then the platform's. */
  analytics: CaseSlot;
  /** Where it landed: the mobile screens drawn in December. */
  mobile: CaseSlot;
};

/** A recording in /cases/lendly, its poster its first frame. */
const clip = (name: string, alt: string, caption: string, w = 1280, h = 800): CaseSlot => ({
  kind: 'video',
  src: `/cases/lendly/${name}.mp4`,
  poster: `/cases/lendly/${name}.webp`,
  w,
  h,
  alt,
  caption,
});

export const lendlyMedia: LendlyMedia = {
  marketCard: clip(
    '01-market-card',
    'Loan cards on the market: the pointer on their badges and on the info icon by the yield',
    'A market card and its badges',
  ),
  filters: clip('02-filters', 'The market’s filters folding away and opening again', 'Filters that fold away'),
  secondary: clip(
    '03-secondary-purchase',
    'A stake bought from another investor: the loan’s page, an amount entered, Invest, and the code from the SMS',
    'Buying from another investor in one window',
  ),
  primary: clip(
    '04-primary-steps',
    'A new loan bought step by step: a document signed at each step, the stepper counting the signatures left',
    'Buying into a new loan, one signature at a time',
  ),
  qualified: clip(
    '05-qualified-investor',
    'An amount over the limit, the application for qualified investor status, and a crown on the profile',
    'Applying for qualified investor status',
  ),
  dashboard: clip(
    '06-dashboard-calendar',
    'The dashboard: the portfolio and the balance, then the payout calendar',
    'The dashboard and the payout calendar',
  ),
  analytics: clip(
    '07-analytics',
    'Analytics on the investor’s own portfolio, then the platform’s numbers in the next tab',
    'Analytics: your portfolio, then the platform',
  ),
  mobile: clip(
    '08-mobile-screens',
    'Two phones: the account, with the application for qualified investor status, and a property’s page',
    'The mobile screens from December',
    1080,
    1350,
  ),
};
