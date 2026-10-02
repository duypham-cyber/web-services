import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { KnowledgeCta } from '@/components/knowledge/KnowledgeCta';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { ARTICLE_CATEGORIES, listArticles, slugifyHeading } from '@/content/articles/all';
import { assertArticlesValid } from '@/content/articles/schema';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { isDraftPreview } from '@/lib/env';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/kien-thuc'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return buildMetadata({ routeKey: 'knowledge', locale });
}

/**
 * /kien-thuc — hub bài viết (docs/03 mục 13.5 T-KB-HUB): H1 → 3 nhóm (neo, không JS) → thẻ bài → CTA cuối.
 * Đích 301 của /news và /en/news (content/redirects.ts).
 */
export default async function KnowledgeHubPage({ params }: PageProps<'/[locale]/kien-thuc'>) {
  assertArticlesValid();
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const previewNote = isDraftPreview() ? t('article.imageNote') : null;
  const all = listArticles();
  const groups = ARTICLE_CATEGORIES.map((category) => {
    const label = t(`article.categories.${category}`);
    return {
      category,
      label,
      anchor: slugifyHeading(label),
      description: t(`hub.groups.${category}`),
      items: all.filter((a) => a.category === category),
    };
  }).filter((g) => g.items.length > 0);

  return (
    <>
      <Section tone="blue-50" spacing="none" aria-labelledby="page-title" className="pt-6 pb-16 md:pt-8 md:pb-20">
        <Breadcrumbs routeKey="knowledge" locale={locale} />
        <Eyebrow className="mt-8">{t('hub.eyebrow')}</Eyebrow>
        <Heading level={1} id="page-title" className="mt-3 max-w-[22ch]">
          {t('hub.title')}
        </Heading>
        <p className="mt-5 max-w-text text-lead text-(--surface-muted)">{t('hub.lead')}</p>
        <nav aria-label={t('hub.groupsLabel')} className="mt-10">
          <ul className="flex flex-wrap gap-3">
            {groups.map((g) => (
              <li key={g.category}>
                <a
                  href={`#${g.anchor}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-blue-100 bg-white px-5 text-small font-semibold text-blue-600 no-underline shadow-1 hover:border-blue-600"
                >
                  {g.label}
                  <span className="rounded-pill bg-blue-100 px-2 py-0.5 text-eyebrow tabular">{g.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      {groups.map((g, i) => (
        <Section
          key={g.category}
          id={g.anchor}
          tone={i % 2 === 0 ? 'light' : 'blue-50'}
          aria-labelledby={`${g.anchor}-title`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <Heading level={2} id={`${g.anchor}-title`}>
              {g.label}
            </Heading>
            <p className="text-small font-medium text-(--surface-muted)">
              {t('hub.articleCount', { count: g.items.length })}
            </p>
          </div>
          <p className="mt-3 max-w-text text-body text-(--surface-muted)">{g.description}</p>
          <ul className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {g.items.map((article) => (
              <li key={article.key}>
                <ArticleCard article={article} locale={locale} previewNote={previewNote} />
              </li>
            ))}
          </ul>
        </Section>
      ))}

      <KnowledgeCta locale={locale} />
    </>
  );
}
