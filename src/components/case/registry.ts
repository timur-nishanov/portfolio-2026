import type { ComponentType } from 'react';
import { AliceArticle } from './AliceArticle';
import { ChumsArticle } from './ChumsArticle';
import { KritikaArticle } from './KritikaArticle';
import { LendlyArticle } from './LendlyArticle';
import { UrbantigerArticle } from './UrbantigerArticle';
import { YandexCloudArticle } from './YandexCloudArticle';

/** How the case's own "back" leaves it: closing the layer over the page, or a
    link home from the case's standalone page. */
export type ArticleProps = { onBack?: () => void; backHref?: string };

type CaseEntry = {
  /** The bar's title and the tab's, spelled as on the case's card. */
  title: string;
  Article: ComponentType<ArticleProps>;
};

/** The cases with a study, by showcase id. The card itself, and the case's
    address, come from the showcase data. */
export const CASES: Record<string, CaseEntry> = {
  kritika: { title: 'Kritika', Article: KritikaArticle },
  chums: { title: 'Chums', Article: ChumsArticle },
  urbantiger: { title: 'Urbantiger', Article: UrbantigerArticle },
  lendly: { title: 'Lendly Invest', Article: LendlyArticle },
  alice: { title: 'Yandex Alice', Article: AliceArticle },
  'yandex-cloud': { title: 'Yandex Cloud', Article: YandexCloudArticle },
};
