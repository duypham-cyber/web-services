import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/knowledge/ArticleBody';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { ArticleMeta } from '@/components/knowledge/ArticleMeta';
import { ARTICLE_ICONS } from '@/components/knowledge/icons';
import { KnowledgeCta } from '@/components/knowledge/KnowledgeCta';
import { MediaFrame } from '@/components/knowledge/MediaFrame';
import { ReadingProgress } from '@/components/knowledge/ReadingProgress';
import { TocInline, TocSidebar } from '@/components/knowledge/TableOfContents';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { articles } from '@/content/articles';
import {
  articleOutline,
  findArticleBySlug,
  imageVisible,
  readingMinutes,
  relatedArticles,
} from '@/content/articles/all';
import { assertArticlesValid } from '@/content/articles/schema';
import type { ClaimId } from '@/content/claims';
import { resolveLocale } from '@/i18n/params';
import { isLocale, type Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { isDraftPreview } from '@/lib/env';
import { articleJsonLd } from '@/lib/jsonld';
import type { RouteKey } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo';

/** Chỉ các bài trong content/articles.ts; slug lạ → 404. URL cũ /news/* → 301 (content/redirects.ts), bài AI → 410. */
export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'vi';
  return articles.map((a) => ({ slug: a.slug[locale] }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/kien-thuc/[slug]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = findArticleBySlug(locale, slug);
  if (!article) notFound();
  return buildMetadata({ routeKey: `knowledge.${article.key}`, locale });
}

function claimState(id: ClaimId, locale: Locale): 'approved' | 'draft' | 'hidden' {
  const c = claim(id, locale);
  if (!c) return 'hidden';
  return c.draft ? 'draft' : 'approved';
}

/** Khung chung cho đầu bài, ảnh và thân bài: cột mục lục 15rem + cột chữ ≤ 45rem (720px). */
const WRAP = 'mx-auto w-full max-w-[66rem]';

/**
 * /kien-thuc/[slug] — bài viết (docs/03 mục 13.5 T-ARTICLE): breadcrumb · H1 · ngày đăng/cập nhật · thời gian đọc ·
 * mục lục dính (≥ 1024px) / gập (< 1024px) · thanh tiến độ CSS · thân bài · bài liên quan · CTA cuối.
 * JSON-LD: Article (+ BreadcrumbList trong <Breadcrumbs/>).
 */
export default async function ArticlePage({ params }: PageProps<'/[locale]/kien-thuc/[slug]'>) {
  assertArticlesValid();
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = findArticleBySlug(locale, slug);
  if (!article) notFound();

  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const { content } = article;
  const routeKey = `knowledge.${article.key}` as RouteKey;
  const outline = articleOutline(content, locale, (id) => claimState(id, locale));
  const minutes = readingMinutes(content, locale);
  const related = relatedArticles(article.key);
  const previewNote = isDraftPreview() ? t('article.imageNote') : null;
  const hero = content.hero && imageVisible(content.hero, locale) ? content.hero : null;
  const tocLabels = { label: t('article.toc.label') };

  return (
    <>
      <ReadingProgress />
      <JsonLd data={articleJsonLd(article.key, locale)} />

      <Section tone="blue-50" spacing="none" className="pt-6 pb-16 md:pt-8 md:pb-24">
        <div className={WRAP}>
          <Breadcrumbs routeKey={routeKey} locale={locale} />
          <div className="mt-8 max-w-[52rem]">
            <Eyebrow>{t(`article.categories.${article.category}`)}</Eyebrow>
            <Heading level={1} className="mt-3">
              {article.title[locale]}
            </Heading>
            <p className="mt-5 text-lead text-(--surface-muted)">{content.lead[locale]}</p>
            <ArticleMeta
              locale={locale}
              publishedAt={content.publishedAt}
              updatedAt={content.updatedAt}
              minutes={minutes}
              className="mt-6"
            />
          </div>
        </div>
      </Section>

      <Section tone="light" spacing="none" className="pb-section">
        <div className={WRAP}>
          <div className="relative -mt-8 md:-mt-14" style={hero ? { maxWidth: Math.max(720, hero.width) } : undefined}>
            <MediaFrame
              image={hero}
              locale={locale}
              ratio="16 / 9"
              sizes="(min-width: 1120px) 1056px, 100vw"
              priority
              placeholderIcon={ARTICLE_ICONS[article.key]}
              previewNote={previewNote}
              className="shadow-2"
            />
          </div>

          <div className="mt-10 grid gap-10 lg:mt-16 lg:grid-cols-[15rem_minmax(0,45rem)] lg:gap-14 xl:gap-20">
            <aside className="max-lg:hidden">
              <TocSidebar outline={outline} title={t('article.toc.title')} {...tocLabels} />
            </aside>
            <div className="min-w-0">
              <TocInline outline={outline} title={t('article.toc.toggle')} className="mb-10 lg:hidden" {...tocLabels} />
              <ArticleBody
                content={content}
                locale={locale}
                outline={outline}
                labels={{ tip: t('article.callout.tip'), warning: t('article.callout.warning') }}
              />
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="blue-50" aria-labelledby="bai-lien-quan-title">
          <Heading level={2} id="bai-lien-quan-title">
            {t('article.related.title')}
          </Heading>
          <ul className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <li key={item.key}>
                <ArticleCard article={item} locale={locale} previewNote={previewNote} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <KnowledgeCta locale={locale} />
    </>
  );
}
