import { FileClock, Mail, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DraftNote } from '@/components/partners/DraftNote';
import { PageHero } from '@/components/partners/PageHero';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { isLegalDocPublished, legalDocs, type LegalDoc, type LegalDocKey } from '@/content/legal';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { LegalBlocks } from './LegalBlocks';

const LEGAL_ROUTE_KEY = { privacy: 'legal.privacy', terms: 'legal.terms', warranty: 'legal.warranty' } as const;

/**
 * TEMPLATE T-LEGAL (contracts/site-shell-p0.md mục 1.3, AC-LEGAL-1): H1 → phiên bản / ngày hiệu lực → mục lục
 * (dính bên trái từ 1024px) → thân văn bản. Ba trạng thái:
 *   1. Đã duyệt (content/legal.ts approved)       → toàn văn, mọi môi trường.
 *   2. Nháp + bản xem trước (DRAFT_PREVIEW=1)      → toàn văn/khung mục + banner nguồn gốc + ghi chú cho pháp chế.
 *   3. Nháp ở production                            → thông báo trung tính "đang cập nhật" + kênh liên hệ (+ noindex,
 *                                                     xem legal-metadata.ts).
 * Không animate nội dung pháp lý.
 */
export async function LegalDocument({ locale, docKey }: { locale: Locale; docKey: LegalDocKey }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  const doc = legalDocs[docKey];
  const published = isLegalDocPublished(doc);
  const showBody = published || isDraftPreview();
  const lead = docKey === 'warranty' ? t('warranty.lead') : t(`${docKey}.meta.description`);

  return (
    <>
      <PageHero
        breadcrumb={<Breadcrumbs routeKey={LEGAL_ROUTE_KEY[docKey]} locale={locale} />}
        eyebrow={t('eyebrow')}
        title={t(`${docKey}.title`)}
        lead={lead}
      >
        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-small">
          <div className="flex gap-2">
            <dt className="text-(--surface-muted)">{t('version')}:</dt>
            <dd className="font-semibold text-(--surface-fg)">{doc.version ?? t('notIssued')}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-(--surface-muted)">{t('effectiveFrom')}:</dt>
            <dd className="font-semibold text-(--surface-fg)">
              {doc.effectiveFrom ? formatDate(doc.effectiveFrom, locale) : t('notIssued')}
            </dd>
          </div>
        </dl>
      </PageHero>

      {showBody ? (
        <Section aria-label={t(`${docKey}.title`)} spacing="compact">
          {published ? null : <OriginBanner doc={doc} locale={locale} />}
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16">
            <LegalToc doc={doc} locale={locale} label={t('toc')} />
            <article className="flex min-w-0 flex-col gap-14">
              {doc.sections.map((section) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
                  <h2
                    id={`${section.id}-title`}
                    className={`${section.subsections?.length ? 'text-h2' : 'text-h3'} text-(--surface-heading)`}
                  >
                    {section.title[locale]}
                  </h2>
                  {section.blocks ? (
                    <Prose className="mt-4">
                      <LegalBlocks blocks={section.blocks} locale={locale} />
                    </Prose>
                  ) : null}
                  {section.subsections?.map((sub) => (
                    <div key={sub.id} id={sub.id} className="mt-8">
                      <h3 className="text-h3 text-(--surface-heading)">{sub.title[locale]}</h3>
                      <Prose className="mt-3">
                        <LegalBlocks blocks={sub.blocks} locale={locale} />
                      </Prose>
                      {sub.reviewNote ? (
                        <DraftNote className="mt-4 max-w-text">
                          <span className="font-semibold">{t('reviewNoteLabel')}: </span>
                          {sub.reviewNote[locale]}
                        </DraftNote>
                      ) : null}
                    </div>
                  ))}
                  {section.blocks === null && !section.subsections?.length ? (
                    <div className="mt-4 max-w-text rounded-md border-2 border-dashed border-slate-500 bg-white px-5 py-4">
                      <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-ink-900">
                        {t('sectionPending')} <DraftBadge />
                      </p>
                      {section.reviewNote ? (
                        <p className="mt-2 text-small text-slate-600">
                          <span className="font-semibold">{t('reviewNoteLabel')}: </span>
                          {section.reviewNote[locale]}
                        </p>
                      ) : null}
                    </div>
                  ) : section.reviewNote ? (
                    <DraftNote className="mt-4 max-w-text">
                      <span className="font-semibold">{t('reviewNoteLabel')}: </span>
                      {section.reviewNote[locale]}
                    </DraftNote>
                  ) : null}
                </section>
              ))}
            </article>
          </div>
        </Section>
      ) : (
        <Section spacing="compact" aria-labelledby="dang-cap-nhat-title">
          <UpdatingNotice docKey={docKey} locale={locale} />
        </Section>
      )}
    </>
  );
}

/** Mục lục: danh sách mục (+ mục con). Dính bên trái từ 1024px; mobile là khung gọn phía trên thân văn bản. */
function LegalToc({ doc, locale, label }: { doc: LegalDoc; locale: Locale; label: string }) {
  return (
    <nav
      aria-label={label}
      className="self-start rounded-lg border border-slate-300 bg-blue-50 p-5 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:max-h-[calc(100svh-var(--header-h)-4rem)] lg:-mx-2 lg:-my-2 lg:overflow-y-auto lg:border-0 lg:bg-transparent lg:p-2"
      data-tone="blue-50"
    >
      <p className="eyebrow text-(--surface-accent)">{label}</p>
      <ol className="mt-3 flex flex-col gap-0.5">
        {doc.sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block rounded-sm py-1.5 text-small font-medium text-(--surface-link) no-underline hover:text-(--surface-link-hover) hover:underline"
            >
              {section.title[locale]}
            </a>
            {section.subsections?.length ? (
              <ol className="mb-1 ml-3 flex flex-col border-l border-slate-300 pl-3">
                {section.subsections.map((sub) => (
                  <li key={sub.id}>
                    <a
                      href={`#${sub.id}`}
                      className="block rounded-sm py-1 text-small text-(--surface-muted) no-underline hover:text-(--surface-link-hover) hover:underline"
                    >
                      {sub.title[locale]}
                    </a>
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Banner nguồn gốc (chỉ khi văn bản chưa duyệt — tức là chỉ hiện ở bản xem trước). */
async function OriginBanner({ doc, locale }: { doc: LegalDoc; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  const legacy = doc.origin === 'legacy-site';
  return (
    <div className="flex max-w-[62rem] gap-4 rounded-lg border border-warning-text bg-orange-50 p-5 text-ink-900 md:p-6">
      <FileClock aria-hidden="true" size={24} strokeWidth={1.5} className="mt-0.5 shrink-0 text-warning-text" />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-body font-semibold">
          {legacy ? t('legacyBanner') : t(`${doc.key === 'terms' ? 'terms' : 'privacy'}.outlineBanner`)}
          <DraftBadge />
        </p>
        {legacy ? <p className="mt-1 text-small">{t('legacyIntro')}</p> : null}
      </div>
    </div>
  );
}

/** Production, văn bản chưa duyệt: thông báo trung tính + kênh liên hệ (AC-LEGAL-1). */
async function UpdatingNotice({ docKey, locale }: { docKey: LegalDocKey; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  return (
    <div className="max-w-[46rem] rounded-lg border border-slate-300 bg-blue-50 p-6 md:p-8" data-tone="blue-50">
      <h2 id="dang-cap-nhat-title" className="text-h3 text-(--surface-heading)">
        {t('updating.title')}
      </h2>
      <p className="mt-3 text-body text-(--surface-fg)">{t('updating.body', { doc: t(`${docKey}.docName`) })}</p>
      <ul className="mt-5 flex flex-col gap-3">
        <li>
          <a
            href={`tel:${site.hotline.tel}`}
            className="inline-flex min-h-11 items-center gap-2 text-body font-semibold text-(--surface-link) no-underline tabular hover:underline"
          >
            <Phone aria-hidden="true" size={20} strokeWidth={1.75} />
            <span className="sr-only">{t('updating.hotline')}: </span>
            {site.hotline.display[locale]}
          </a>
        </li>
        <li>
          <a
            href={`mailto:${site.email}`}
            className="inline-flex min-h-11 items-center gap-2 text-body text-(--surface-link) no-underline hover:underline"
          >
            <Mail aria-hidden="true" size={20} strokeWidth={1.75} />
            <span className="sr-only">{t('updating.email')}: </span>
            {site.email}
          </a>
        </li>
      </ul>
    </div>
  );
}
