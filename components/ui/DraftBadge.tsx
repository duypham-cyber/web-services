import { getTranslations } from 'next-intl/server';
import { Badge } from './Badge';

/**
 * Nhãn "Nháp" / "Draft" (Server Component, đọc messages common.status.draft).
 * Đặt cạnh MỌI nội dung draft khi DRAFT_PREVIEW=1: claim, KPI ghi chú, Zalo... (docs/DECISIONS.md, CLAUDE.md).
 * Trong client component: dùng <Badge variant="draft">{label}</Badge> với label truyền từ server.
 */
export async function DraftBadge({ className }: { className?: string }) {
  const t = await getTranslations('common');
  return (
    <Badge variant="draft" className={className}>
      {t('status.draft')}
    </Badge>
  );
}
