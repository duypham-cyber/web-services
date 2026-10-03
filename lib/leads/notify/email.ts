/**
 * Nội dung email thông báo lead cho bộ phận (kênh (a), D-01 → D-26) — contracts/lead-b2b.md mục 3.6, lead-technician.md mục 3.
 * Dựng từ dòng `leads` lúc gửi (không lưu nội dung vào lead_notifications). Email nội bộ nên chỉ có tiếng Việt.
 *
 * - Tiêu đề KHÔNG chứa tên/SĐT/email: chỉ mã tham chiếu + giá trị enum (+ tỉnh, kỹ năng với form thợ).
 * - Mọi giá trị người dùng nhập đều escape HTML trong phần HTML; ghi chú hiện nguyên văn dạng chữ (không bao giờ là HTML).
 * - Reply-To = workEmail (đã qua Zod, không thể chứa CR/LF) với B2B; form thợ không có Reply-To. Header khác cố định.
 */
import { consentVersions } from '../../../content/consent';
import { provinces } from '../../../content/provinces';
import { ALL_PROVINCES_COUNT, e164ToLocal, formatPhoneVN, leadReference, type LeadType } from '../rules';

export type StoredLead = {
  id: string;
  type: LeadType;
  payload: Record<string, unknown>;
  payload_version: number;
  consent_version: string;
  consent_purposes: string[];
  consent_at: Date;
  utm: Record<string, string>;
  locale: string;
  page_path: string;
  film_tier: string | null;
  meta: { captcha?: string; emailFreeDomain?: boolean; sanitized?: string[] };
  created_at: Date;
};

export type LeadEmail = { subject: string; text: string; html: string; replyTo?: string };

const INTENT: Record<string, string> = { quote: 'Báo giá', demo: 'Demo 30 phút', integration: 'Tích hợp' };
const CUSTOMER_TYPE: Record<string, string> = { brand: 'Hãng', marketplace: 'Sàn TMĐT', retail_chain: 'Chuỗi bán lẻ' };
const VOLUME: Record<string, string> = {
  lt_100: 'Dưới 100 đơn/tháng',
  '100_499': '100–499 đơn/tháng',
  '500_1999': '500–1.999 đơn/tháng',
  gte_2000: 'Từ 2.000 đơn/tháng',
  unknown: 'Chưa rõ sản lượng',
};
const SKILL_SHORT: Record<string, string> = {
  air_conditioner: 'Điều hòa',
  washer_dryer: 'Máy giặt, máy sấy',
  tv_mounting: 'Treo TV',
  water_appliances: 'Thiết bị nước',
  kitchen_appliances: 'Thiết bị bếp',
  electrical_plumbing: 'Điện nước dân dụng',
  robot_vacuum: 'Robot hút bụi',
  other: 'Khác',
};
const SKILL_FULL: Record<string, string> = {
  air_conditioner: 'Điều hòa / máy lạnh (lắp, tháo, bảo dưỡng)',
  washer_dryer: 'Máy giặt, máy sấy',
  tv_mounting: 'Treo TV',
  water_appliances: 'Máy lọc nước, máy nước nóng, bồn cầu thông minh',
  kitchen_appliances: 'Bếp, máy hút mùi, máy rửa bát',
  electrical_plumbing: 'Điện, nước dân dụng',
  robot_vacuum: 'Robot hút bụi',
  other: 'Khác',
};
/** Tóm tắt mục đích cho người nhận (câu chữ đầy đủ người dùng đã đọc nằm ở content/consent.ts theo consent_version). */
const PURPOSE_SUMMARY: Record<string, string> = {
  b2b_sales_contact: 'Liên hệ tư vấn, báo giá, chốt lịch demo',
  b2b_marketing: 'Nhận tin tức, tài liệu, lời mời sự kiện',
  tech_partner_contact: 'Gọi/nhắn Zalo tư vấn gia nhập mạng lưới thợ',
  tech_job_alerts: 'Nhận tin việc mới ở tỉnh đã chọn',
};
const DECLINED_NOTE: Record<string, string> = {
  b2b_marketing: 'Không đồng ý nhận tin tiếp thị — chỉ liên hệ cho yêu cầu này',
  tech_job_alerts: 'Không đồng ý nhận tin việc mới — chỉ gọi lại cho đăng ký này',
};
const CAPTCHA_NOTE: Record<string, string> = {
  unverified: 'Chưa xác minh captcha (Cloudflare không phản hồi lúc nhận lead) — kiểm tra kỹ trước khi gọi',
  test: 'Captcha kiểm bằng khóa thử của Cloudflare (chỉ dev/bản xem trước)',
};
const FOOTER =
  'Email chứa dữ liệu cá nhân. Không chuyển tiếp ra ngoài. Yêu cầu xóa/truy cập dữ liệu: chuyển cho ' +
  '[đầu mối tiếp nhận yêu cầu về dữ liệu cá nhân — chờ pháp chế, PC-04].';

const provinceName = new Map(provinces.map((p) => [p.code, p.name.vi]));

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Giờ Việt Nam, vd "21:15:03 03/10/2026 (giờ Việt Nam)". */
export function formatVnTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('hour')}:${get('minute')}:${get('second')} ${get('day')}/${get('month')}/${get('year')} (giờ Việt Nam)`;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

type Row =
  | { label: string; text: string; href?: string; extraHref?: { label: string; href: string }; multiline?: boolean }
  | null;

function render(title: string, warnings: string[], rows: Row[]): { text: string; html: string } {
  const list = rows.filter((r): r is NonNullable<Row> => r !== null);
  const text = [
    title,
    '',
    ...warnings.map((w) => `! ${w}`),
    ...(warnings.length ? [''] : []),
    ...list.map((r) => {
      const value = r.multiline ? `\n${r.text}` : r.text;
      const extra = r.extraHref ? ` (${r.extraHref.label}: ${r.extraHref.href})` : '';
      return `${r.label}: ${value}${extra}`;
    }),
    '',
    '--',
    FOOTER,
  ].join('\n');

  const cell = (r: NonNullable<Row>) => {
    const body = r.href ? `<a href="${escapeHtml(r.href)}">${escapeHtml(r.text)}</a>` : escapeHtml(r.text);
    const extra = r.extraHref ? ` · <a href="${escapeHtml(r.extraHref.href)}">${escapeHtml(r.extraHref.label)}</a>` : '';
    const style = r.multiline ? ' style="white-space:pre-wrap"' : '';
    return `<td${style}>${body}${extra}</td>`;
  };
  const html = [
    '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title></head>',
    '<body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0F172A;line-height:1.5">',
    `<h1 style="font-size:18px">${escapeHtml(title)}</h1>`,
    ...warnings.map((w) => `<p style="background:#FFF4E5;border-left:4px solid #F97316;padding:8px 12px;margin:8px 0"><strong>${escapeHtml(w)}</strong></p>`),
    '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">',
    ...list.map(
      (r) =>
        `<tr style="border-top:1px solid #E2E8F0"><th align="left" valign="top" style="white-space:nowrap;padding-right:16px">${escapeHtml(r.label)}</th>${cell(r)}</tr>`,
    ),
    '</table>',
    `<p style="margin-top:24px;font-size:12px;color:#475569">${escapeHtml(FOOTER)}</p>`,
    '</body></html>',
  ].join('\n');
  return { text, html };
}

export function buildLeadEmail(lead: StoredLead): LeadEmail {
  const ref = leadReference(lead.id);
  const p = lead.payload;
  const version = consentVersions.find((v) => v.version === lead.consent_version);
  const accepted = new Set(lead.consent_purposes);
  const declined = (version?.purposes ?? []).filter((x) => !accepted.has(x.code)).map((x) => x.code);

  const warnings: string[] = [];
  const captcha = lead.meta.captcha;
  if (captcha && CAPTCHA_NOTE[captcha]) warnings.push(CAPTCHA_NOTE[captcha]);
  if (lead.meta.emailFreeDomain) warnings.push('Email cá nhân (tên miền miễn phí, không phải email công ty)');
  for (const code of declined) if (DECLINED_NOTE[code]) warnings.push(DECLINED_NOTE[code]);

  const phone = str(p.phone);
  const consentRows: Row[] = [
    { label: 'Đồng ý', text: lead.consent_purposes.map((c) => `${PURPOSE_SUMMARY[c] ?? c} (${c})`).join('; ') },
    declined.length ? { label: 'Không đồng ý', text: declined.map((c) => `${PURPOSE_SUMMARY[c] ?? c} (${c})`).join('; ') } : null,
    { label: 'Phiên bản điều khoản', text: `${lead.consent_version} · lúc ${formatVnTime(lead.consent_at)}` },
  ];
  const sourceRows: Row[] = [
    lead.utm.source || lead.utm.campaign
      ? { label: 'Nguồn (UTM)', text: [lead.utm.source, lead.utm.medium, lead.utm.campaign].filter(Boolean).join(' / ') }
      : null,
    { label: 'Trang gửi', text: lead.page_path },
    { label: 'Ngôn ngữ', text: lead.locale === 'en' ? 'Tiếng Anh' : 'Tiếng Việt' },
    lead.film_tier ? { label: 'Tầng hero', text: lead.film_tier } : null,
    { label: 'ID', text: lead.id },
  ];

  if (lead.type === 'lead_b2b') {
    const intent = INTENT[str(p.intent)] ?? str(p.intent);
    const codes = Array.isArray(p.provinces) ? p.provinces.map(String) : [];
    const all = codes.length === ALL_PROVINCES_COUNT;
    const provincesSubject = all ? `Toàn quốc (${codes.length}/${ALL_PROVINCES_COUNT})` : `${codes.length} tỉnh`;
    const provincesBody = all
      ? `Toàn quốc (${codes.length}/${ALL_PROVINCES_COUNT})`
      : codes.map((c) => provinceName.get(c) ?? c).join(', ');
    const subject =
      `[Lead B2B][${intent}] ${ref} · ${CUSTOMER_TYPE[str(p.customerType)] ?? str(p.customerType)} · ` +
      `${VOLUME[str(p.monthlyVolume)] ?? str(p.monthlyVolume)} · ${provincesSubject}`;
    const email = str(p.workEmail);
    const { text, html } = render(`Lead B2B mới — ${intent} — mã ${ref}`, warnings, [
      { label: 'Mã yêu cầu', text: ref },
      { label: 'Nhu cầu', text: intent },
      { label: 'Họ và tên', text: str(p.fullName) },
      { label: 'Công ty', text: str(p.company) },
      { label: 'Chức danh', text: str(p.jobTitle) || '—' },
      { label: 'Số di động', text: formatPhoneVN(phone), href: `tel:${phone}` },
      { label: 'Email', text: email, href: `mailto:${email}` },
      { label: 'Loại doanh nghiệp', text: CUSTOMER_TYPE[str(p.customerType)] ?? str(p.customerType) },
      { label: 'Sản lượng', text: VOLUME[str(p.monthlyVolume)] ?? str(p.monthlyVolume) },
      { label: 'Tỉnh/thành triển khai', text: provincesBody },
      { label: 'Ghi chú', text: str(p.note) || '—', multiline: true },
      ...consentRows,
      ...sourceRows,
    ]);
    return { subject, text, html, replyTo: email || undefined };
  }

  const skill = str(p.primarySkill);
  const province = provinceName.get(str(p.province)) ?? str(p.province);
  const subject = `[Đối tác thợ] ${ref} · ${SKILL_SHORT[skill] ?? skill} · ${province}`;
  const { text, html } = render(`Đăng ký đối tác thợ mới — mã ${ref}`, warnings, [
    { label: 'Mã đăng ký', text: ref },
    { label: 'Họ và tên', text: str(p.fullName) },
    {
      label: 'Số di động (Zalo)',
      text: formatPhoneVN(phone),
      href: `tel:${phone}`,
      // D-19 (duyệt mặc định ở D-26): link Zalo để tuyển thợ nhắn nhanh
      extraHref: { label: 'Nhắn Zalo', href: `https://zalo.me/${e164ToLocal(phone)}` },
    },
    { label: 'Tỉnh/thành nhận việc', text: province },
    { label: 'Kỹ năng chính', text: SKILL_FULL[skill] ?? skill },
    ...consentRows,
    ...sourceRows,
  ]);
  return { subject, text, html };
}
