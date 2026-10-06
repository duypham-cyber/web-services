import { Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';

type EndCtaProps = {
  locale: Locale;
  eyebrow?: string;
  title: string;
  body: string;
  /** Nút trên nền navy: Button variant="primary" (cam, chữ navy) + "on-dark". */
  actions: ReactNode;
  /** Nhãn trước số hotline, vd "Hoặc gọi". */
  callLabel: string;
  /** Câu dưới cùng (vd ghi chú "Form gửi yêu cầu sẽ có sau khi contract lead được duyệt" — chỉ ở bản xem trước). */
  note?: ReactNode;
  id?: string;
};

/**
 * MỘT khối CTA cuối mỗi trang (AC-SH-7, UX-32). CHƯA có form: form B2B chờ contracts/lead-b2b.md APPROVED,
 * nút dẫn tới /lien-he#kinh-doanh (QUOTE_HREF). Thẻ navy bo xl đặt trong section trắng để tách khỏi footer navy.
 * Hotline không animate (docs/03 mục 12.2 luật 3).
 */
export function EndCta({ locale, eyebrow, title, body, actions, callLabel, note, id = 'cta-cuoi' }: EndCtaProps) {
  const titleId = `${id}-title`;
  return (
    <Section id={id} aria-labelledby={titleId} spacing="compact" className="pb-16 md:pb-24">
      <div
        data-tone="navy"
        className="relative overflow-clip rounded-xl bg-blue-600 px-6 py-12 md:px-12 md:py-14 lg:px-16 lg:py-16"
      >
        {/* Trang trí: vệt sáng xanh + tia chớp nét mảnh, nằm trong khung overflow-clip */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-pill bg-[radial-gradient(circle,var(--color-blue-300)_0%,transparent_70%)] opacity-35"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 120 200"
          className="pointer-events-none absolute right-10 top-8 hidden h-32 w-auto text-blue-300 opacity-30 md:block lg:right-14"
        >
          <path d="M72 4 L20 112 H58 L44 196 L104 76 H64 Z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
        </svg>
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end">
          <div className="min-w-0">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            <Heading level={2} id={titleId} className={eyebrow ? 'mt-3 max-w-[24ch]' : 'max-w-[24ch]'}>
              {title}
            </Heading>
            <p className="mt-5 max-w-[56ch] text-lead text-(--surface-muted)">{body}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-col lg:items-stretch xl:flex-row">{actions}</div>
            <p className="text-small text-(--surface-muted)">
              {callLabel}{' '}
              <a
                href={`tel:${site.hotline.tel}`}
                className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-white no-underline tabular underline-offset-4 hover:underline"
              >
                <Phone aria-hidden="true" size={16} strokeWidth={1.75} className="text-orange-200" />
                {site.hotline.display[locale]}
              </a>
            </p>
          </div>
        </div>
        {note ? <div className="relative mt-8">{note}</div> : null}
      </div>
    </Section>
  );
}
