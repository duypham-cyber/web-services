import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/Badge';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { isDraftPreview } from '@/lib/env';
import { getRoute, OWNERS, type RouteKey } from '@/lib/routes';

type PagePlaceholderProps = {
  routeKey: RouteKey;
  eyebrow: string;
  /** H1 DUY NHẤT của trang. */
  title: string;
  lead: string;
  /** Khối dự kiến theo docs/03 mục 13.5 (ghi chú cho agent, chỉ hiện ở dev/xem trước). */
  plan: string[];
  /** Nội dung thật đã có (đặt giữa hero và ghi chú). */
  children?: ReactNode;
};

/** Ghi chú dựng trang chỉ hiện khi chạy dev hoặc bản xem trước (DRAFT_PREVIEW=1). */
export function showDevNotes(): boolean {
  return process.env.NODE_ENV !== 'production' || isDraftPreview();
}

/**
 * KHUNG TRANG TẠM. Agent phụ trách thay toàn bộ nội dung page.tsx bằng trang thật; giữ generateMetadata
 * (buildMetadata) và đúng MỘT H1. Ghi chú dựng trang chỉ hiện khi dev hoặc DRAFT_PREVIEW=1.
 */
export async function PagePlaceholder({ routeKey, eyebrow, title, lead, plan, children }: PagePlaceholderProps) {
  const showNotes = showDevNotes();
  return (
    <>
      <Section tone="blue-50" aria-labelledby="page-title">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading level={1} id="page-title" className="mt-3 max-w-[24ch]">
          {title}
        </Heading>
        <p className="mt-5 max-w-text text-lead text-(--surface-muted)">{lead}</p>
      </Section>
      {children}
      {showNotes ? <DevNotes routeKey={routeKey} plan={plan} /> : null}
    </>
  );
}

/** Ghi chú cho agent (chỉ dev/xem trước): ai dựng, ưu tiên, khối dự kiến. Dùng được ở trang tự dựng (vd trang chủ). */
export async function DevNotes({ routeKey, plan }: { routeKey: RouteKey; plan: string[] }) {
  const t = await getTranslations('common');
  const route = getRoute(routeKey);
  const owner = OWNERS[route.owner];
  return (
    <Section tone="light" spacing="compact" aria-labelledby="dev-notes-title">
      <div className="rounded-lg border-2 border-dashed border-slate-500 bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="dev-notes-title" className="text-h3 text-navy-900">
            {t('dev.panelTitle')}
          </h2>
          <Badge variant="draft">{t('status.draft')}</Badge>
          <Badge variant="info">
            {t('dev.priority')} {route.priority}
          </Badge>
        </div>
        <p className="mt-3 text-body font-semibold text-ink-900">{t('dev.owner', { agent: owner.label })}</p>
        <p className="mt-1 text-small text-slate-600">{owner.scope}</p>
        <h3 className="eyebrow mt-6 text-slate-600">{t('dev.plan')}</h3>
        <ol lang="vi" className="mt-3 list-decimal space-y-1.5 pl-5 text-small text-ink-900 marker:text-blue-600">
          {plan.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <p className="mt-6 text-small text-slate-600">
          {t('dev.docs')}: docs/03-DINH-HUONG-THIET-KE-3D.md mục 13 · docs/04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md · CLAUDE.md
        </p>
        <p className="mt-1 text-small text-slate-600">{t('dev.previewOnly')}</p>
      </div>
    </Section>
  );
}
