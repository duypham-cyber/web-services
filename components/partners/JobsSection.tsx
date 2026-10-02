import { BriefcaseBusiness, MapPin, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { visibleJobs } from '@/content/jobs';
import { provinces } from '@/content/provinces';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { ContactButtons } from './ContactButtons';
import { DraftNote } from './DraftNote';
import { SectionHeader } from './SectionHeader';

/**
 * /doi-tac-tho#viec-dang-tuyen — CHỈ tin thật, còn hạn (contracts/site-shell-p0.md T-PARTNER, EDGE CASES).
 * Production hiện chưa có tin nào được duyệt → khối trống có hướng dẫn gọi tuyển thợ. Bản xem trước hiện tin nháp
 * lấy từ site cũ (content/jobs.ts). Nút "Ứng tuyển" của mọi tin trỏ về cùng một kênh #dang-ky (contract lead-technician).
 */
export async function JobsSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'partners' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const tContact = await getTranslations({ locale, namespace: 'contact' });
  const preview = isDraftPreview();
  const today = new Date().toISOString().slice(0, 10);
  const jobs = visibleJobs(today, preview);
  const provinceName = (code: string) => provinces.find((p) => p.code === code)?.name[locale] ?? code;

  return (
    <Section tone="blue-50" id="viec-dang-tuyen" aria-labelledby="viec-dang-tuyen-title">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeader id="viec-dang-tuyen-title" eyebrow={t('jobs.eyebrow')} title={t('jobs.title')} lead={t('jobs.lead')} />
        <TextLink href="/mang-luoi" variant="arrow" className="py-2">
          {t('jobs.networkLink')}
        </TextLink>
      </div>

      {jobs.length > 0 ? (
        <StaggerGrid as="ul" className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const province = provinceName(job.provinceCode);
            const title = job.title[locale];
            return (
              <Card key={job.id} padding="lg" className="flex h-full flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip icon={<MapPin aria-hidden="true" size={16} strokeWidth={1.75} />}>{province}</Chip>
                  {job.status === 'draft' ? <DraftBadge /> : null}
                </div>
                <h3 className="mt-4 text-h3 text-(--surface-heading)">{title}</h3>
                <ul className="mt-3 flex flex-col gap-1.5 text-small text-(--surface-muted)">
                  <li className="flex items-center gap-2">
                    <BriefcaseBusiness aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0 text-blue-600" />
                    {t('jobs.employment')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Users aria-hidden="true" size={16} strokeWidth={1.75} className="shrink-0 text-blue-600" />
                    {job.openings === null ? t('jobs.openingsPending') : t('jobs.openings', { count: job.openings })}
                  </li>
                </ul>
                <TextLink
                  externalHref="#dang-ky"
                  variant="arrow"
                  className="mt-auto pt-6"
                  aria-label={t('jobs.applyLabel', { title, province })}
                >
                  {t('jobs.apply')}
                </TextLink>
              </Card>
            );
          })}
        </StaggerGrid>
      ) : (
        <Card padding="lg" className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[56ch]">
            <p className="text-lead font-semibold text-(--surface-heading)">{t('jobs.empty')}</p>
            <p className="mt-2 text-body text-(--surface-muted)">{t('jobs.emptyHint')}</p>
          </div>
          <ContactButtons
            callLabel={tc('cta.callNumber', { phone: site.hotline.display[locale] })}
            newTabLabel={tContact('office.newTab')}
            className="shrink-0"
          />
        </Card>
      )}

      {jobs.some((job) => job.status === 'draft') ? <DraftNote className="mt-8">{t('jobs.draftNote')}</DraftNote> : null}
    </Section>
  );
}
