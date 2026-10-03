import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_CLAIMS } from '@/content/claims';
import type { Claim, SlaItem, Stat } from '@/content/schemas';
import { slaItems } from '@/content/sla';
import { stats } from '@/content/stats';
import { claim } from '@/lib/claims';

describe('lib/claims.ts — câu khẳng định chưa duyệt không lên production', () => {
  it('claim nháp → null khi không phải bản xem trước', () => {
    for (const c of ALL_CLAIMS) {
      if ((c.status as string) !== 'approved') expect(claim(c.id, 'vi', { draftPreview: false })).toBeNull();
    }
  });

  it('claim nháp → có chữ + cờ draft khi DRAFT_PREVIEW', () => {
    const c = claim('technician.ekyc', 'en', { draftPreview: true });
    expect(c).toEqual({ text: 'Technicians are identity-verified through e-KYC', draft: true });
  });

  it('claim đã duyệt → hiện ở mọi môi trường, không cờ draft', () => {
    for (const draftPreview of [false, true]) {
      expect(claim('coverage.provinces-34', 'vi', { draftPreview })).toEqual({ text: 'Mạng lưới lắp đặt tại 34 tỉnh/thành', draft: false });
      expect(claim('b2b.sla.confirm-60-minutes', 'en', { draftPreview })).toEqual({ text: '60 minutes', draft: false });
    }
  });
});

/**
 * Bảng duyệt D-27 (thực hiện D-26 mục 2). Danh sách chốt cứng để đổi trạng thái phải là quyết định có chủ đích:
 * sửa test này cùng lúc với docs/DECISIONS.md.
 */
describe('content/claims — bảng duyệt 03/10/2026 (docs/DECISIONS.md D-26, D-27)', () => {
  const approved = ALL_CLAIMS.filter((c) => (c.status as string) === 'approved');

  it('đúng 2 câu được duyệt, mỗi câu có bằng chứng, người duyệt, ngày và ghi chú duyệt', () => {
    // b2b.warranty.installation-faults: duyệt rồi đưa về nháp cùng ngày sau kiểm định độc lập (D-27) — câu về phạm vi bảo
    // hành, không thuộc danh sách số/mốc của D-26.
    expect(approved.map((c) => c.id)).toEqual(['coverage.provinces-34', 'b2b.sla.confirm-60-minutes']);
    for (const c of approved as readonly Claim[]) {
      expect(c, c.id).toMatchObject({ approvedBy: 'Anh Duy (D-26)', approvedAt: '2026-10-03' });
      expect(c.evidence, c.id).toBeTruthy();
      expect(c.note, c.id).toMatch(/^Duyệt 03\/10\/2026 \(D-26 mục 2, D-27\)/);
    }
  });

  it('nhóm D-26 giữ nháp (bảo hành, giờ hotline, "có thợ trong 24h", tiêu chuẩn thợ) không câu nào được duyệt', () => {
    const MUST_STAY_DRAFT = [
      'warranty.new-installation-term',
      'warranty.register-within-7-days',
      'knowledge.warranty-workmanship-12-months',
      'knowledge.washer-install-commitment',
      'support.24-7',
      'b2b.retail.onsite-within-24h',
      'technician.ekyc',
      'partner.experience-requirement',
      'partner.standard-tcvn-5687',
      'partner.standard-qcvn-25',
      'home.standards-citation',
      'b2b.warranty.installation-faults',
    ];
    for (const id of MUST_STAY_DRAFT) {
      const c = ALL_CLAIMS.find((x) => x.id === id);
      expect(c, id).toBeDefined();
      expect(c?.status, id).toBe('draft');
    }
  });

  it('SLA: chỉ "confirm-time" (60 phút) và "fix-response-time" (24–48 giờ) được duyệt', () => {
    expect(slaItems.filter((s) => s.status === 'approved').map((s) => [s.id, s.value?.vi])).toEqual([
      ['confirm-time', 'Trong vòng 60 phút sau khi nhận đơn'],
      ['fix-response-time', 'Trong 24–48 giờ'],
    ]);
  });
});

// ---------------------------------------------------------------------------------------------
// scripts/check-no-draft.mjs — cổng production (D-05). Import động qua biến để tsc không đòi khai báo kiểu cho file .mjs.
// ---------------------------------------------------------------------------------------------
type Needle = { kind: string; label: string; text?: string; re?: RegExp };
type GateModule = {
  buildNeedles: (input: {
    loadMessages: (locale: string, namespace: string) => unknown;
    claims: readonly Claim[];
    slaItems: readonly SlaItem[];
    stats: readonly Stat[];
  }) => { needles: Needle[]; skipped: Needle[] };
  findViolations: (raw: string, needles: Needle[]) => { needle: Needle; at: number }[];
  approvedTexts: (input: { claims: readonly Claim[]; slaItems: readonly SlaItem[]; stats: readonly Stat[] }) => string[];
};
const GATE_MODULE: string = '@/scripts/check-no-draft.mjs';
const loadGate = async () => (await import(/* @vite-ignore */ GATE_MODULE)) as GateModule;
const loadMessages = (locale: string, ns: string) => JSON.parse(readFileSync(`messages/${locale}/${ns}.json`, 'utf8')) as unknown;
const realInput = { loadMessages, claims: ALL_CLAIMS as readonly Claim[], slaItems, stats };

describe('scripts/check-no-draft.mjs — chặn nội dung nháp, không báo nhầm nội dung đã duyệt', () => {
  it('nội dung thật: không mẫu dò nào là đoạn của chữ đã duyệt (claim/SLA approved, nhãn và định nghĩa KPI có số)', async () => {
    const gate = await loadGate();
    const { needles } = gate.buildNeedles(realInput);
    const approvedText = gate.approvedTexts(realInput);
    for (const n of needles) {
      if (n.text) expect(approvedText.some((a) => a.includes(n.text as string)), `${n.label}: "${n.text}"`).toBe(false);
    }
  });

  it('HTML có số và câu đã duyệt (500+, 34/34, 60 phút, 24–48 giờ, số theo miền) → không vi phạm', async () => {
    const gate = await loadGate();
    const { needles } = gate.buildNeedles(realInput);
    const html = [
      ...gate.approvedTexts(realInput).map((t) => `<p>${t}</p>`),
      '<p class="text-kpi">500<!-- -->+</p><p>34/34</p><p>60 phút</p><p>Miền Nam: 200+ thợ · Mekong: 60+ thợ</p>',
    ].join('\n');
    expect(gate.findViolations(html, needles)).toEqual([]);
  });

  it('vẫn chặn: nhãn "Nháp · số site cũ", claim nháp, SLA "đang ghi" chưa duyệt, nguồn số site cũ, data-draft-preview', async () => {
    const gate = await loadGate();
    const { needles } = gate.buildNeedles(realInput);
    const kinds = (html: string) => gate.findViolations(html, needles).map((h) => h.needle.kind);
    expect(kinds('<span class="badge">Nháp · số site cũ</span>')).toContain('nhãn nháp');
    expect(kinds('<span>Draft · old-site figure</span>')).toContain('nhãn nháp');
    expect(kinds('<li>Hỗ trợ vận hành 24/7</li>')).toContain('claim nháp');
    expect(kinds('<li>Bảo hành lắp đặt mới 02 tháng kể từ ngày nghiệm thu</li>')).toContain('claim nháp');
    expect(kinds('<dd>T2–T6 09:00–16:30; T7 09:00–12:00; CN và Lễ/Tết không tiếp nhận đơn</dd>')).toContain('SLA đang ghi (chưa duyệt)');
    expect(kinds('<p>hơn 500+ thợ kỹ thuật tay nghề cao</p>')).toContain('nguồn số site cũ');
    expect(kinds('<html lang="vi" data-draft-preview>')).toContain('dấu bản xem trước');
  });

  it('câu nháp quá ngắn (ô bảng SLA) vẫn có mẫu dò — không lọt cổng vì dưới 14 ký tự', async () => {
    const gate = await loadGate();
    const { needles } = gate.buildNeedles(realInput);
    const kinds = (html: string) => gate.findViolations(html, needles).map((h) => `${h.needle.kind}|${h.needle.label}`);
    expect(kinds('<td>Tối đa 48 giờ</td>')).toContain('claim nháp|b2b.sla.completion-48-hours (vi)');
    expect(kinds('<td>Case by case</td>')).toContain('claim nháp|b2b.sla.special-areas-case-by-case (en)');
    // Mọi claim nháp và mọi cột "đang ghi" của SLA đều sinh ít nhất một mẫu dò ở cả hai ngôn ngữ
    for (const c of ALL_CLAIMS.filter((x) => (x.status as string) !== 'approved')) {
      for (const l of ['vi', 'en']) expect(needles.some((n) => n.label === `${c.id} (${l})`), `${c.id} (${l})`).toBe(true);
    }
    for (const s of slaItems) {
      for (const l of ['vi', 'en']) expect(needles.some((n) => n.label === `${s.id} (${l})`), `${s.id} (${l})`).toBe(true);
    }
  });

  it('cột "đang ghi" của SLA ĐÃ duyệt vẫn bị dò (trang chỉ được hiện value)', async () => {
    const gate = await loadGate();
    const { needles } = gate.buildNeedles(realInput);
    const fix = slaItems.find((s) => s.id === 'fix-response-time');
    const confirm = slaItems.find((s) => s.id === 'confirm-time');
    expect(fix?.status).toBe('approved');
    expect(confirm?.status).toBe('approved');
    const kinds = (html: string) => gate.findViolations(html, needles).map((h) => h.needle.kind);
    for (const s of [fix, confirm]) {
      expect(kinds(`<td>${s?.current.vi}</td>`)).toContain('SLA đang ghi (mục đã duyệt chỉ hiện value)');
      expect(kinds(`<td>${s?.current.en}</td>`)).toContain('SLA đang ghi (mục đã duyệt chỉ hiện value)');
      // value đã duyệt thì không
      expect(gate.findViolations(`<td>${s?.label.vi}</td><td>${s?.value?.vi}</td>`, needles)).toEqual([]);
    }
  });

  it('đoạn của câu nháp trùng y nguyên chữ đã duyệt thì bỏ qua (có ghi lại), đoạn khác vẫn bị dò', async () => {
    const gate = await loadGate();
    const base = { evidence: 'e', approvedBy: null, approvedAt: null };
    const claims = [
      { ...base, id: 'x.approved', status: 'approved', approvedBy: 'Anh Duy (D-26)', approvedAt: '2026-10-03', text: { vi: 'Mạng lưới lắp đặt tại 34 tỉnh/thành', en: 'Installation network across all 34 provinces' } },
      { ...base, id: 'x.draft', status: 'draft', text: { vi: 'Mạng lưới lắp đặt tại 34 tỉnh/thành. Có thợ trong 24 giờ ở mọi tỉnh', en: 'Same-day technicians everywhere' } },
    ] as readonly Claim[];
    const { needles, skipped } = gate.buildNeedles({ ...realInput, claims });
    // Đoạn chỉ CHỨA chữ đã duyệt (dài hơn) vẫn bị dò — chỉ đoạn nằm TRỌN trong chữ đã duyệt mới được bỏ qua
    expect(skipped).toEqual([]);
    const draftNeedles = needles.filter((n) => n.label.startsWith('x.draft'));
    expect(draftNeedles.map((n) => n.text)).toEqual(['Mạng lưới lắp đặt tại 34 tỉnh/thành. Có thợ trong 24 giờ ở mọi tỉnh', 'Same-day technicians everywhere']);
    expect(needles.some((n) => n.label.startsWith('x.approved'))).toBe(false);

    // Câu nháp có một đoạn (tách bởi dấu ") trùng hẳn câu đã duyệt → đoạn đó bỏ qua, đoạn còn lại vẫn dò
    const quoted = [
      claims[0] as Claim,
      { ...(claims[1] as Claim), text: { vi: 'Site cũ: "Mạng lưới lắp đặt tại 34 tỉnh/thành" và "có thợ trong 24 giờ ở mọi tỉnh"', en: 'Same-day technicians everywhere' } },
    ];
    const second = gate.buildNeedles({ ...realInput, claims: quoted });
    expect(second.skipped.map((s) => s.text)).toEqual(['Mạng lưới lắp đặt tại 34 tỉnh/thành']);
    expect(second.needles.filter((n) => n.label.startsWith('x.draft')).map((n) => n.text)).toEqual([
      'có thợ trong 24 giờ ở mọi tỉnh',
      'Same-day technicians everywhere',
    ]);
  });
});
