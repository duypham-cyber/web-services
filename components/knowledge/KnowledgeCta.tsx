import { Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { QUOTE_HREF } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Section } from '@/components/ui/Section';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { keepCompounds } from '@/lib/vn-wrap';

/**
 * Khối CTA cuối duy nhất của trang Kiến thức (AC-SH-7): thẻ navy trên nền sáng (tách khỏi footer navy).
 * Mặc định nhánh A (docs/DECISIONS.md D-02): CTA chính cho doanh nghiệp → /lien-he#kinh-doanh (chưa có form, contract
 * lead chưa APPROVED); khách lẻ → /ho-tro-khach-hang. Hotline lấy từ content/site.ts, không animate.
 */
export async function KnowledgeCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const phone = site.hotline.display[locale];
  return (
    <Section tone="light" aria-labelledby="kien-thuc-cta-title">
      <Card tone="navy" padding="none" className="overflow-clip px-6 py-12 md:px-12 md:py-14 xl:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-pill bg-blue-600/50 blur-3xl"
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div className="max-w-text">
            <Eyebrow>{t('cta.eyebrow')}</Eyebrow>
            <h2 id="kien-thuc-cta-title" className="mt-3 text-h2 text-(--surface-heading)">
              {keepCompounds(t('cta.title'))}
            </h2>
            <p className="mt-4 text-lead text-(--surface-muted)">{t('cta.body')}</p>
          </div>
          <div className="flex flex-col items-start gap-4">
            <div className="flex flex-wrap gap-3">
              <Button href={QUOTE_HREF} variant="primary" size="lg">
                {t('cta.primary')}
              </Button>
              <Button href="/ho-tro-khach-hang" variant="on-dark" size="lg">
                {t('cta.secondary')}
              </Button>
            </div>
            <a
              href={`tel:${site.hotline.tel}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm font-semibold text-(--surface-link) no-underline hover:underline"
            >
              <Phone aria-hidden="true" size={18} strokeWidth={1.75} />
              {t('cta.call', { phone })}
            </a>
          </div>
        </div>
      </Card>
    </Section>
  );
}
