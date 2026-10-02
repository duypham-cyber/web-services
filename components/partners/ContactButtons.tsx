import { Mail, MessageCircle, Phone } from 'lucide-react';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { site } from '@/content/site';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';

type ContactButtonsProps = {
  /** Nền đặt nút: light (trắng/blue-50) hay navy. */
  tone?: 'light' | 'navy';
  /**
   * Kiểu nút gọi. Mặc định: blue (nền sáng) / on-dark (navy). "primary" (nền cam) chỉ khi gọi là CTA chính của màn
   * hình — mỗi màn hình tối đa 1 nút cam (docs/03 mục 11.1).
   */
  callVariant?: ButtonVariant;
  callLabel: string;
  /** Có nhãn → hiện nút Zalo (chỉ khi link Zalo đã duyệt, hoặc ở bản xem trước kèm nhãn Nháp). */
  zaloLabel?: string;
  /** Có nhãn → hiện email (mailto, có tiêu đề thư nếu truyền subject). style "link" = link chữ, nhẹ hơn nút. */
  email?: { label: string; subject?: string; style?: 'button' | 'link' };
  /** Chữ đọc cho trình đọc màn hình khi link mở thẻ mới. */
  newTabLabel: string;
  size?: ButtonSize;
  className?: string;
};

/**
 * Bộ nút liên hệ dùng chung: Gọi hotline · Zalo · Email. Số, email, link Zalo đọc từ content/site.ts (một nguồn).
 * Zalo đang "draft" → production ẩn nút (giống thanh dính đáy và footer).
 */
export async function ContactButtons({
  tone = 'light',
  callVariant,
  callLabel,
  zaloLabel,
  email,
  newTabLabel,
  size = 'md',
  className,
}: ContactButtonsProps) {
  const zaloApproved = (site.zalo.status as string) === 'approved';
  const showZalo = Boolean(zaloLabel) && (zaloApproved || isDraftPreview());
  const secondary = tone === 'navy' ? 'on-dark' : 'ghost';
  const iconProps = { 'aria-hidden': true, size: 20, strokeWidth: 1.75 } as const;
  const mailto = email
    ? `mailto:${site.email}${email.subject ? `?subject=${encodeURIComponent(email.subject)}` : ''}`
    : null;

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <Button
        externalHref={`tel:${site.hotline.tel}`}
        variant={callVariant ?? (tone === 'navy' ? 'on-dark' : 'blue')}
        size={size}
        iconStart={<Phone {...iconProps} />}
      >
        <span className="tabular">{callLabel}</span>
      </Button>
      {showZalo ? (
        <span className="inline-flex flex-wrap items-center gap-2">
          <Button
            externalHref={site.zalo.url}
            target="_blank"
            rel="noopener noreferrer"
            variant={secondary}
            size={size}
            iconStart={<MessageCircle {...iconProps} />}
          >
            {zaloLabel}
            <span className="sr-only"> {newTabLabel}</span>
          </Button>
          {zaloApproved ? null : <DraftBadge />}
        </span>
      ) : null}
      {email && mailto ? (
        email.style === 'link' ? (
          <a
            href={mailto}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm px-1 text-body font-semibold text-(--surface-link) no-underline hover:text-(--surface-link-hover) hover:underline"
          >
            <Mail {...iconProps} />
            {email.label}
          </a>
        ) : (
          <Button externalHref={mailto} variant={secondary} size={size} iconStart={<Mail {...iconProps} />}>
            {email.label}
          </Button>
        )
      ) : null}
    </div>
  );
}
