import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { readingMinutes, type ArticleEntry } from '@/content/articles/all';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import { ARTICLE_ICONS } from './icons';
import { MediaFrame } from './MediaFrame';

type ArticleCardProps = {
  article: ArticleEntry;
  locale: Locale;
  /** Cấp tiêu đề của thẻ (trang hub: 3 dưới H2 nhóm; bài liên quan: 3 dưới H2). */
  headingLevel?: 3 | 4;
  /** Ghi chú "ảnh thật sẽ chụp" khi chưa có ảnh — chỉ truyền ở bản xem trước. */
  previewNote?: string | null;
};

/**
 * Thẻ bài viết: ảnh 16:9 (hoặc khung giữ chỗ) · nhóm · tiêu đề (cả thẻ bấm được) · trích 2 dòng · ngày · phút đọc.
 * Link tiêu đề phủ cả thẻ bằng ::after (Card relative). Không motion trên chữ.
 */
export async function ArticleCard({ article, locale, headingLevel = 3, previewNote }: ArticleCardProps) {
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const { content } = article;
  const Heading = `h${headingLevel}` as const;
  const minutes = readingMinutes(content, locale);
  return (
    <Card as="article" padding="none" interactive className="flex h-full flex-col overflow-clip">
      <MediaFrame
        image={content.hero}
        locale={locale}
        ratio="16 / 9"
        sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
        placeholderIcon={ARTICLE_ICONS[article.key]}
        previewNote={previewNote}
        rounded={false}
      />
      <div className="flex flex-1 flex-col p-6">
        <div>
          <Chip variant="blue">{t(`article.categories.${article.category}`)}</Chip>
        </div>
        <Heading className="mt-4 text-h3 text-(--surface-heading)">
          <Link
            href={{ pathname: '/kien-thuc/[slug]', params: { slug: article.slug[locale] } }}
            className="no-underline after:absolute after:inset-0 after:content-[''] hover:text-blue-600 hover:underline"
          >
            {article.title[locale]}
          </Link>
        </Heading>
        <p className="mt-3 line-clamp-2 text-small text-slate-600">{content.description[locale]}</p>
        <p className="mt-auto flex flex-wrap gap-x-2 pt-5 text-small text-slate-600">
          <time dateTime={content.publishedAt}>{formatDate(content.publishedAt, locale)}</time>
          <span aria-hidden="true">·</span>
          <span>{t('article.readingTime', { minutes })}</span>
        </p>
      </div>
    </Card>
  );
}
