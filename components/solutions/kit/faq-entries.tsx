import type { AppHref } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import type { ClaimId } from '@/content/claims';
import type { Locale } from '@/i18n/routing';
import { ClaimText, visibleClaims } from './draft';
import type { FaqEntry } from './FaqList';

/** Một câu hỏi: chữ ở messages (q, a, more?), cấu trúc ở đây (link, claim bổ sung). */
export type FaqSpec = {
  id: string;
  /** Đích của link "more" (nếu messages có khóa more). */
  href?: AppHref;
  /** Câu khẳng định bổ sung sau câu trả lời — production chỉ hiện khi đã duyệt. */
  claims?: readonly ClaimId[];
  /** true = câu hỏi chỉ hiện khi có ít nhất một claim được hiện (câu trả lời dựa hoàn toàn vào claim). */
  claimOnly?: boolean;
};

type FaqMessages = Record<string, { q: string; a: string; more?: string }>;

/**
 * Ghép câu hỏi thường gặp từ messages (đọc bằng getMessages, nên biến ICU cần thay tay qua `values`) + cấu hình.
 * Câu hỏi claimOnly bị bỏ hẳn ở production khi claim chưa duyệt → không có câu hỏi trả lời rỗng.
 */
export function buildFaqEntries(
  specs: readonly FaqSpec[],
  items: FaqMessages,
  locale: Locale,
  values: Record<string, string> = {},
): FaqEntry[] {
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
  return specs.flatMap((spec) => {
    const item = items[spec.id];
    if (!item) return [];
    const claims = spec.claims ?? [];
    const shown = visibleClaims(claims, locale);
    if (spec.claimOnly && shown.length === 0) return [];
    return [
      {
        id: spec.id,
        question: fill(item.q),
        answer: (
          <>
            <p>{fill(item.a)}</p>
            {shown.map((c) => (
              <p key={c.id} className="mt-3">
                <ClaimText id={c.id} locale={locale} />
              </p>
            ))}
            {item.more && spec.href ? (
              <TextLink href={spec.href} variant="arrow" className="mt-4">
                {item.more}
              </TextLink>
            ) : null}
          </>
        ),
      },
    ];
  });
}
