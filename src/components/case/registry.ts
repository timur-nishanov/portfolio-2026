import type { ComponentType } from 'react';

/** How the case's own "back" leaves it: closing the layer over the page, or a
    link home from the case's standalone page. */
export type ArticleProps = { onBack?: () => void; backHref?: string };

export type Article = ComponentType<ArticleProps>;

type CaseEntry = {
  /** The bar's title and the tab's, spelled as on the case's card. */
  title: string;
  /** The case's article, fetched when first wanted: the six of them were in
      the home page's script, read by most visitors not at all. The layer
      asks for them as the cards come near, and for a card's own under the
      pointer, so one opens at once all the same (CaseLayer, CaseCard). */
  load: () => Promise<Article>;
};

/** The cases with a study, by showcase id. The card itself, and the case's
    address, come from the showcase data. */
export const CASES: Record<string, CaseEntry> = {
  kritika: { title: 'Kritika', load: () => import('./KritikaArticle').then((m) => m.KritikaArticle) },
  chums: { title: 'Chums', load: () => import('./ChumsArticle').then((m) => m.ChumsArticle) },
  urbantiger: { title: 'Urbantiger', load: () => import('./UrbantigerArticle').then((m) => m.UrbantigerArticle) },
  lendly: { title: 'Lendly Invest', load: () => import('./LendlyArticle').then((m) => m.LendlyArticle) },
  alice: { title: 'Yandex Alice', load: () => import('./AliceArticle').then((m) => m.AliceArticle) },
  'yandex-cloud': { title: 'Yandex Cloud', load: () => import('./YandexCloudArticle').then((m) => m.YandexCloudArticle) },
};

const loaded = new Map<string, Article>();
const loading = new Map<string, Promise<Article>>();

/** The case's article, fetched once; the same promise to everyone who asks. */
export function loadCase(id: string): Promise<Article> {
  const have = loaded.get(id);
  if (have) return Promise.resolve(have);
  let p = loading.get(id);
  if (!p) {
    const entry = CASES[id];
    if (!entry) return Promise.reject(new Error(`no case ${id}`));
    p = entry.load().then(
      (Article) => {
        loaded.set(id, Article);
        return Article;
      },
      // A fetch that failed (a phone's connection dropping) is asked for
      // again next time, not remembered as failed for the whole visit.
      (e) => {
        loading.delete(id);
        throw e;
      },
    );
    loading.set(id, p);
  }
  return p;
}

/** Every case's article, for the moment the cards come into view. */
export function loadAllCases() {
  for (const id of Object.keys(CASES)) loadCase(id).catch(() => {});
}
