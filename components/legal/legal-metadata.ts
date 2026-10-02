import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { isLegalDocPublished, legalDocs, type LegalDocKey } from '@/content/legal';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { buildMetadata } from '@/lib/seo';

const ROUTE_KEY = { privacy: 'legal.privacy', terms: 'legal.terms', warranty: 'legal.warranty' } as const;

/**
 * Metadata cho 3 trang pháp lý. AC-LEGAL-1: production chưa có bản pháp chế duyệt → trang chỉ là thông báo
 * "đang cập nhật" nên gắn `noindex, follow`. Bản xem trước (DRAFT_PREVIEW=1, staging) không gắn ở thẻ meta vì staging
 * đã có X-Robots-Tag noindex ở header (next.config.ts, openresty) và test SEO trên dev server kiểm route indexable.
 */
export async function legalMetadata(docKey: LegalDocKey, locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'legal' });
  const base = buildMetadata({
    routeKey: ROUTE_KEY[docKey],
    locale,
    title: t(`${docKey}.meta.title`),
    description: t(`${docKey}.meta.description`),
  });
  if (!isLegalDocPublished(legalDocs[docKey]) && !isDraftPreview()) {
    return { ...base, robots: { index: false, follow: true } };
  }
  return base;
}
