import { ArrowDown } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/Badge';
import { Button, type AppHref } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { PosterPlaceholder } from './PosterPlaceholder';

/**
 * CHỮ KÝ PROPS CỐ ĐỊNH — agent phim thay RUỘT component (FilmStage, 4 tầng, poster thật, screen-hold, handoff)
 * nhưng GIỮ NGUYÊN props này để app/[locale]/page.tsx (agent B2B) không phải sửa.
 */
export type FilmHeroProps = {
  locale: Locale;
  /** Dòng nhỏ trên H1. null = ẩn (vd claim phạm vi "34 tỉnh" chưa duyệt). draft = hiện kèm nhãn Nháp. */
  eyebrow: { text: string; draft: boolean } | null;
  /** H1 DUY NHẤT của trang chủ (tagline T1), server render, KHÔNG BAO GIỜ bắt đầu ở opacity 0 (LCP). */
  title: string;
  lead: string;
  /** CTA chính (nút cam): "Nhận báo giá cho doanh nghiệp". */
  primaryCta: { label: string; href: AppHref };
  /** CTA phụ: "Đăng ký làm đối tác thợ". */
  secondaryCta: { label: string; href: AppHref };
  /** "Bỏ qua phần giới thiệu ↓" — <a href="#…"> thật, phần tử focus đầu tiên sau header (NFR-A11Y-03). */
  skipLabel: string;
  /** id section đích sau phim. Mặc định "ba-cua-vao" (section "Ba cửa vào", dùng H2). */
  skipTargetId?: string;
};

/**
 * STUB (nền móng). Bố cục theo docs/03 mục 13.2 (shot 0) và 13.3 (mobile):
 *   ≥ 1024px: poster phủ kín, lớp chữ bên trái có scrim navy, header trong suốt chữ trắng phía trên.
 *   < 1024px: chữ trên nền navy đặc ở trên, poster bên dưới (chữ không đè lên ảnh).
 * `data-film-zone` báo cho header biết vùng phim (HeaderObserver). Phim thật: đặt thuộc tính này lên cả track cuộn.
 */
export async function FilmHero({
  eyebrow,
  title,
  lead,
  primaryCta,
  secondaryCta,
  skipLabel,
  skipTargetId = 'ba-cua-vao',
}: FilmHeroProps) {
  const t = await getTranslations('common');
  const tFilm = await getTranslations('film');
  const showPosterLabel = process.env.NODE_ENV !== 'production' || isDraftPreview();

  return (
    <section
      data-film-zone=""
      data-tone="navy"
      aria-labelledby="hero-title"
      className="relative isolate -mt-(--header-h) flex flex-col overflow-clip bg-navy-900 lg:min-h-[max(100svh,40rem)] lg:justify-center"
    >
      {/* Poster: ≥1024 phủ kín phía sau chữ; <1024 nằm dưới khối chữ */}
      <div className="relative order-2 aspect-[4/3] w-full sm:aspect-video lg:absolute lg:inset-0 lg:-z-10 lg:aspect-auto">
        <PosterPlaceholder className="absolute inset-0 size-full" />
        {/* Scrim: navy đặc bên trái → trong suốt (chữ luôn đủ tương phản), thêm dải trên cho header */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden lg:block"
          style={{
            background:
              'linear-gradient(90deg, rgb(10 31 68 / 0.95) 0%, rgb(10 31 68 / 0.88) 38%, rgb(10 31 68 / 0.4) 58%, rgb(10 31 68 / 0) 74%), linear-gradient(180deg, rgb(10 31 68 / 0.7) 0%, rgb(10 31 68 / 0) 22%)',
          }}
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-navy-900 to-transparent lg:hidden" />
        {showPosterLabel ? (
          <Badge variant="illustration" className="absolute bottom-4 right-4">
            {tFilm('posterLabel')}
          </Badge>
        ) : null}
      </div>

      <div className="relative order-1 w-full">
        <Container className="pb-12 pt-[calc(var(--header-h)+2.5rem)] lg:py-[calc(var(--header-h)+3rem)]">
          <div className="flex max-w-[38rem] flex-col xl:max-w-[42rem]">
            {/* DOM: link bỏ qua đứng ĐẦU để là phần tử focus đầu tiên sau header; hiển thị ở cuối khối chữ */}
            <a
              href={`#${skipTargetId}`}
              className="order-last mt-8 inline-flex w-fit items-center gap-2 rounded-sm text-small font-semibold text-blue-300 underline-offset-4 hover:text-white hover:underline"
            >
              {skipLabel.replace(/\s*↓\s*$/, '')}
              <ArrowDown aria-hidden="true" size={16} strokeWidth={1.75} />
            </a>
            {eyebrow ? (
              <p className="eyebrow flex flex-wrap items-center gap-2 text-orange-200">
                {eyebrow.text}
                {eyebrow.draft ? <Badge variant="draft">{t('status.draft')}</Badge> : null}
              </p>
            ) : null}
            <h1 id="hero-title" className="mt-4 font-display text-display text-white">
              {title}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lead text-slate-300">{lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={primaryCta.href} variant="primary" size="lg">
                {primaryCta.label}
              </Button>
              <Button href={secondaryCta.href} variant="on-dark" size="lg">
                {secondaryCta.label}
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
