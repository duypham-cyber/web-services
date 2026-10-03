/**
 * Trạng thái form lead cho trang (Server Component) — contracts/lead-b2b.md AC-C10, Rule 2, Rule 9. CHỈ SERVER.
 *
 * Trang có form gọi `getLeadFormState(type, locale)` rồi truyền kết quả xuống client component qua props:
 * - `enabled: true`  → render form với `consent` (câu chữ theo ngôn ngữ, version gửi kèm request) + `turnstileSiteKey`.
 *                      `consent.draft = true` (chỉ có ở dev/bản xem trước) → hiện nhãn "Nháp" cạnh câu đồng ý.
 * - `enabled: false` → KHÔNG render form; thay bằng khối Gọi · Zalo · email bộ phận.
 *
 * LƯU Ý: trang tĩnh được prerender lúc build → kết quả này đóng băng lúc build (như DRAFT_PREVIEW). API kiểm lại ở mỗi
 * request (lib/leads/handler.ts): đổi env lúc chạy (vd LEADS_FORM_ENABLED=false khi bị spam) mà chưa build lại thì trang
 * vẫn hiện form nhưng API trả 503 LEADS_DISABLED → FE phải thay form bằng khối liên hệ khi nhận 503.
 * Ở đây chỉ kiểm những gì có ý nghĩa lúc build (công tắc, câu đồng ý, site key); DB/secret chỉ kiểm ở API.
 */
import { currentConsentVersion, toPublicConsent, type PublicConsent } from './consent';
import { type LeadLocale, type LeadType } from './rules';
import { TURNSTILE_TEST_SITEKEYS } from './turnstile';

export const LEADS_ENDPOINT = '/api/v1/leads';

export type LeadFormDisabledReason = 'switch_off' | 'consent_unapproved' | 'misconfigured';

export type LeadFormState =
  | {
      enabled: true;
      type: LeadType;
      endpoint: typeof LEADS_ENDPOINT;
      consent: PublicConsent;
      turnstileSiteKey: string;
      /** Câu đồng ý chưa duyệt (chỉ dev/bản xem trước) → nhãn "Nháp". */
      draft: boolean;
    }
  | { enabled: false; type: LeadType; reason: LeadFormDisabledReason };

type Env = Record<string, string | undefined>;

const TEST_SITEKEYS: ReadonlySet<string> = new Set(Object.values(TURNSTILE_TEST_SITEKEYS));

export function getLeadFormState(
  type: LeadType,
  locale: LeadLocale,
  env: Env = process.env,
  now: Date = new Date(),
): LeadFormState {
  const draftPreview = env.DRAFT_PREVIEW === '1';
  const liveProduction = env.NODE_ENV === 'production' && !draftPreview;
  if (env.LEADS_FORM_ENABLED !== 'true') return { enabled: false, type, reason: 'switch_off' };

  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
  // Khóa test của Cloudflare trên site thật = không chống bot được (server cũng từ chối secret test ở production)
  if (!siteKey || (liveProduction && TEST_SITEKEYS.has(siteKey))) return { enabled: false, type, reason: 'misconfigured' };

  const version = currentConsentVersion(type, { now, draftPreview: !liveProduction });
  if (!version) return { enabled: false, type, reason: 'consent_unapproved' };

  const consent = toPublicConsent(version, locale);
  return { enabled: true, type, endpoint: LEADS_ENDPOINT, consent, turnstileSiteKey: siteKey, draft: consent.draft };
}
