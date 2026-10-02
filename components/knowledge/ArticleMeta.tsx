import { CalendarDays, Clock, RefreshCw } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

type ArticleMetaProps = {
  locale: Locale;
  publishedAt: string;
  updatedAt: string;
  minutes: number;
  className?: string;
};

/** Ngày đăng · ngày cập nhật · thời gian đọc (Server Component). Ngày trong <time datetime>. */
export async function ArticleMeta({ locale, publishedAt, updatedAt, minutes, className }: ArticleMetaProps) {
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const time = (iso: string) =>
    function TimeTag(chunks: ReactNode) {
      return <time dateTime={iso}>{chunks}</time>;
    };
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-small text-(--surface-muted)', className)}>
      <li className="inline-flex items-center gap-1.5">
        <CalendarDays aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0" />
        <span>{t.rich('article.published', { date: formatDate(publishedAt, locale), time: time(publishedAt) })}</span>
      </li>
      {updatedAt !== publishedAt ? (
        <li className="inline-flex items-center gap-1.5">
          <RefreshCw aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0" />
          <span>{t.rich('article.updated', { date: formatDate(updatedAt, locale), time: time(updatedAt) })}</span>
        </li>
      ) : null}
      <li className="inline-flex items-center gap-1.5">
        <Clock aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0" />
        <span>{t('article.readingTime', { minutes })}</span>
      </li>
    </ul>
  );
}
