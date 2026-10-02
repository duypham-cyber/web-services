import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { articles } from '@/content/articles';
import { resolveLocale } from '@/i18n/params';
import { isLocale, type Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';

/** Chỉ các bài trong content/articles.ts; slug lạ → 404. URL cũ /news/* → 301 (content/redirects.ts). */
export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'vi';
  return articles.map((a) => ({ slug: a.slug[locale] }));
}

function findArticle(locale: Locale, slug: string) {
  return articles.find((a) => a.slug[locale] === slug);
}

export async function generateMetadata({ params }: PageProps<'/[locale]/kien-thuc/[slug]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = findArticle(locale, slug);
  if (!article) notFound();
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  return buildMetadata({
    routeKey: `knowledge.${article.key}`,
    locale,
    title: article.title[locale],
    description: `${t(`article.categories.${article.category}`)}. ${t('article.migrating')}`,
  });
}

/** KHUNG — Agent nội dung & SEO chuyển bài từ site cũ (docs/03 mục 10.3, 13.5). */
export default async function ArticlePage({ params }: PageProps<'/[locale]/kien-thuc/[slug]'>) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = findArticle(locale, slug);
  if (!article) notFound();
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  return (
    <PagePlaceholder
      routeKey={`knowledge.${article.key}`}
      eyebrow={t(`article.categories.${article.category}`)}
      title={article.title[locale]}
      lead={t('article.migrating')}
      plan={[
        'Template bài 7 bước (UX-27): marker xanh, mục lục sticky, scroll-progress, schema Article (+ FAQ nếu có FAQ hiển thị).',
        `Nội dung gốc: ${article.legacyPaths.join(', ')} (301 về đây, content/redirects.ts).`,
        'Bản EN cần người biên tập bản ngữ; không để chuỗi tiếng Việt trên trang /en.',
      ]}
    />
  );
}
