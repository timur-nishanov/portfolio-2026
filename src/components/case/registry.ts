import type { ComponentType } from 'react';
import { ChumsArticle } from './ChumsArticle';

/** How the case's own "back" leaves it: closing the layer over the page, or a
    link home from the case's standalone page. */
export type ArticleProps = { onBack?: () => void; backHref?: string };

type CaseEntry = {
  /** The bar's title and the tab's. */
  title: string;
  Article: ComponentType<ArticleProps>;
};

/** The cases with a study, by showcase id. The card itself, and the case's
    address, come from the showcase data. */
export const CASES: Record<string, CaseEntry> = {
  chums: { title: 'Chums Messenger', Article: ChumsArticle },
};
