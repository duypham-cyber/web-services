import { ALL_CLAIMS, type ClaimId } from '@/content/claims';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from './env';

export type ClaimText = {
  text: string;
  /** true = câu đang là nháp, chỉ hiện ở bản xem trước → PHẢI kèm <Badge variant="draft" />. */
  draft: boolean;
};

/**
 * Lấy câu khẳng định để render. Trả về null khi KHÔNG được hiển thị:
 *   - status "approved"            → { text, draft: false }
 *   - status "draft" + DRAFT_PREVIEW=1 → { text, draft: true }  (hiện kèm nhãn "Nháp")
 *   - status "draft" ở production  → null (ẩn hẳn, kể cả trong texture/poster)
 *
 *   const c = claim('coverage.provinces-34', locale);
 *   {c && <p>{c.text}{c.draft && <Badge variant="draft" />}</p>}
 *
 * id có kiểu chặt (ClaimId): gõ sai id là typecheck báo lỗi.
 */
export function claim(id: ClaimId, locale: Locale, options?: { draftPreview?: boolean }): ClaimText | null {
  const found = ALL_CLAIMS.find((c) => c.id === id);
  if (!found) throw new Error(`content/claims: không có câu khẳng định "${id}"`);
  const statusApproved = (found.status as string) === 'approved';
  if (statusApproved) return { text: found.text[locale], draft: false };
  const preview = options?.draftPreview ?? isDraftPreview();
  return preview ? { text: found.text[locale], draft: true } : null;
}
