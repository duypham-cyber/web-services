import type { Claim } from '../schemas';

/**
 * Câu khẳng định của khu vực "partner" (/doi-tac-tho, /ho-tro-khach-hang, /lien-he, /chinh-sach-bao-hanh).
 * Chủ sở hữu: agent trang thợ & công ty. TẤT CẢ đang là "draft": lấy từ site cũ / chính sách cũ, chưa được
 * anh Duy + pháp chế duyệt → KHÔNG hiển thị ở production; bản xem trước (DRAFT_PREVIEW=1) hiện kèm nhãn "Nháp".
 *
 * Nguồn chính:
 *   - Chính sách 4 phần của site cũ: research/agent-notes/content-cro/policy-vi.json (Phần 1),
 *     policy-vi-parts.json (Phần 2–4), bản EN: policy-en.json, policy-en-parts.json
 *   - Trang tuyển thợ cũ: research/raw/worker-map.txt, requirement.txt, system-map.txt
 *   - Bảng giá vật tư cũ: research/raw/prices.txt
 *
 * Xét duyệt 03/10/2026 (docs/DECISIONS.md D-26 mục 2, bảng D-27): cả 16 câu giữ nháp (thu nhập/phí/ví, tiêu chuẩn thợ,
 * quy định làm việc và bảo hành lấy từ chính sách cũ = trang pháp lý chưa có bản chốt; mốc giờ chưa duyệt).
 *
 * Đọc CHỈ qua `claim(id, locale)` (lib/claims.ts). Duyệt: điền evidence, approvedBy, approvedAt, đổi status.
 */
export const partnerClaims = [
  // ---------------------------------------------------------------- Tiền công, phí, ví (/doi-tac-tho#thu-nhap)
  {
    id: 'partner.payout-per-job',
    text: {
      vi: 'Tiền công tính theo từng đơn, đối soát trên app thợ và chuyển khoản hằng tuần vào tài khoản bạn đã đăng ký.',
      en: 'Pay is calculated per job, reconciled in the technician app and transferred weekly to the bank account you registered.',
    },
    status: 'draft',
    evidence:
      'Site cũ /worker-map, mục "Đối soát & Thanh toán": "Hoa hồng được tính minh bạch theo từng đơn và chuyển khoản hàng tuần ' +
      'vào tài khoản đã đăng ký"; /requirement mục 3 (research/raw/worker-map.txt, requirement.txt)',
    approvedBy: null,
    approvedAt: null,
    note: 'Chờ vận hành xác nhận: tính theo "hoa hồng" hay "tiền công", chu kỳ chuyển khoản (hằng tuần?), ngày chốt đối soát.',
  },
  {
    id: 'partner.materials-paid-on-site',
    text: {
      vi:
        'Vật tư phát sinh (ống đồng, dây điện, giá đỡ…) do khách và thợ thỏa thuận theo khung giá tham khảo của Bluebolt, ' +
        'khách trả trực tiếp cho thợ tại nơi lắp đặt. Bluebolt không thu tiền và không xuất hóa đơn cho phần vật tư này.',
      en:
        "Extra materials (copper pipe, wiring, brackets and so on) are agreed between the customer and the technician using Bluebolt's " +
        'reference price list, and the customer pays the technician directly on site. Bluebolt does not collect or invoice this amount.',
    },
    status: 'draft',
    evidence:
      'Chính sách hiện hành Phần 2, Điều khoản 2 (policy-vi-parts.json); /prices: "Bluebolt Services không bán vật tư – bảng giá ' +
      'chỉ tham khảo" (research/raw/prices.txt)',
    approvedBy: null,
    approvedAt: null,
    note: 'Pháp chế rà soát cùng chuyện hóa đơn vật tư với hãng (docs/03 mục 13.5, /giai-phap/hang-dien-may "đối soát & VAT").',
  },
  {
    id: 'partner.urgent-surcharge',
    text: {
      vi:
        'Đơn gấp có phụ phí hỗ trợ cho thợ. Mức phụ phí thay đổi theo khu vực: nội thành TP. Hồ Chí Minh và Hà Nội thấp hơn ' +
        'ngoại thành và các tỉnh khác.',
      en:
        'Urgent jobs carry an extra support fee for the technician. The amount depends on the area: lower in central Ho Chi Minh ' +
        'City and Hanoi than in the suburbs and other provinces.',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 3, Điều khoản 2 (policy-vi-parts.json)',
    approvedBy: null,
    approvedAt: null,
    note: 'Chưa có mức phụ phí cụ thể theo khu vực.',
  },
  {
    id: 'partner.topup-wallet',
    text: {
      vi: 'Phụ phí đơn gấp được hệ thống xử lý trực tiếp qua ví Top-up trên app thợ.',
      en: 'Urgent-job fees are settled automatically through the Top-up wallet in the technician app.',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 3, Điều khoản 2: "(được hệ thống trừ trực tiếp vào ví Top-up)"',
    approvedBy: null,
    approvedAt: null,
    note:
      'Câu gốc tự mâu thuẫn: "thợ ... nhận được một khoản phụ phí (được hệ thống trừ trực tiếp vào ví Top-up)". Chờ vận hành giải ' +
      'thích ví Top-up dùng để làm gì (thợ nạp trước để trừ phí nền tảng, hay ví nhận tiền) trước khi viết lại câu này.',
  },
  // ---------------------------------------------------------------- Lộ trình gia nhập, tiêu chuẩn (/doi-tac-tho)
  {
    id: 'partner.training-brand-standard',
    text: {
      vi: 'Thợ được đào tạo theo quy chuẩn lắp đặt của hãng và có kỹ sư hỗ trợ qua app khi gặp ca khó.',
      en: 'Technicians are trained to brand installation standards, with engineers available in the app for difficult jobs.',
    },
    status: 'draft',
    evidence: 'Site cũ /worker-map, mục "Đào tạo & Hỗ trợ kỹ thuật" (research/raw/worker-map.txt)',
    approvedBy: null,
    approvedAt: null,
    note: 'Chờ xác nhận chương trình đào tạo thật (thời lượng, theo hãng nào) và đội kỹ sư hỗ trợ.',
  },
  {
    id: 'partner.experience-requirement',
    text: {
      vi: 'Thợ chính cần 1–2 năm kinh nghiệm lắp đặt thực tế.',
      en: 'Lead technicians need 1–2 years of hands-on installation experience.',
    },
    status: 'draft',
    evidence: 'Site cũ /worker-map: "Thợ chính: thường yêu cầu từ 1–2 năm kinh nghiệm lắp đặt thực tế"',
    approvedBy: null,
    approvedAt: null,
    note: 'Mâu thuẫn: /system-map cũ ghi "Tối thiểu 2 năm kinh nghiệm" (điều hòa). Chờ bộ phận tuyển thợ chốt một con số.',
  },
  {
    id: 'partner.standard-tcvn-5687',
    text: {
      vi: 'Lắp dàn nóng, dàn lạnh đúng vị trí kỹ thuật theo TCVN 5687:2024.',
      en: 'Indoor and outdoor units are positioned in line with TCVN 5687:2024.',
    },
    status: 'draft',
    evidence: 'Site cũ /worker-map, mục "Kỹ năng Kỹ thuật thực tế"',
    approvedBy: null,
    approvedAt: null,
    note: 'Trích dẫn CHƯA kiểm chứng (số hiệu, năm ban hành, phạm vi áp dụng cho lắp đặt) — docs/03 mục 13.4 P6.',
  },
  {
    id: 'partner.standard-qcvn-25',
    text: {
      vi: 'Tuân thủ quy định an toàn điện gia đình theo QCVN 25:2025/BKHCN.',
      en: 'Household electrical safety follows QCVN 25:2025/BKHCN.',
    },
    status: 'draft',
    evidence: 'Site cũ /worker-map, mục "Quy chuẩn kỹ thuật & An toàn"',
    approvedBy: null,
    approvedAt: null,
    note: 'Trích dẫn CHƯA kiểm chứng — docs/03 mục 13.4 P6.',
  },
  // ---------------------------------------------------------------- Quy định làm việc của thợ (FAQ /doi-tac-tho)
  {
    id: 'partner.onsite-hours',
    text: {
      vi:
        'Khung giờ thi công tại nhà khách là 08:00–12:00 và 13:00–17:00, từ thứ Hai đến thứ Bảy. Không thi công vào Chủ nhật, ' +
        'ngày lễ, Tết.',
      en: 'On-site work hours are 08:00–12:00 and 13:00–17:00, Monday to Saturday. There is no on-site work on Sundays or public holidays.',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 3, Điều khoản 1',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'partner.job-duration',
    text: {
      vi: 'Mỗi thiết bị thường lắp trong 60–120 phút và xong trong ngày, chậm nhất 48 giờ kể từ khi khách đặt lịch.',
      en: 'Each appliance usually takes 60–120 minutes and is finished the same day, at most 48 hours after the customer books.',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 3, Điều khoản 1',
    approvedBy: null,
    approvedAt: null,
    note: 'Liên quan SLA "completion-time" (content/sla.ts) đang mâu thuẫn với "trong 24h" ở trang chủ cũ.',
  },
  {
    id: 'partner.urgent-orders',
    text: {
      vi:
        'Đơn gấp đặt 09:00–13:00 (thứ Hai đến thứ Sáu) phải xong trước 18:00 cùng ngày; đặt 13:00–17:00 (thứ Hai đến thứ Năm) ' +
        'phải xong trước 12:00 hôm sau. Không áp dụng vào thứ Bảy, Chủ nhật, ngày lễ, Tết và ở khu vực đặc thù.',
      en:
        'Urgent jobs booked 09:00–13:00 (Monday to Friday) must be finished by 18:00 the same day; jobs booked 13:00–17:00 ' +
        '(Monday to Thursday) by 12:00 the next day. Urgent jobs are not available on Saturdays, Sundays, public holidays or in special locations.',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 3, Điều khoản 2',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'partner.violations',
    text: {
      vi:
        'Thợ bị xử lý theo khung chế tài hiện hành khi chậm liên hệ khách trong ngày nhận đơn, đến trễ hẹn 30–60 phút hoặc ' +
        'không đến, cố ý báo giá sai bảng giá niêm yết, hoặc thi công lỗi. Làm hư hại tài sản của khách thì phải đền bù theo ' +
        'giá trị thực tế.',
      en:
        'Technicians face penalties under the current framework for contacting the customer late on the day the job arrives, ' +
        'arriving 30–60 minutes late or not showing up, deliberately quoting outside the published price list, or faulty work. ' +
        "Damage to a customer's property must be compensated at its actual value.",
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 3, Điều khoản 3',
    approvedBy: null,
    approvedAt: null,
    note: 'Chưa có mức phạt cụ thể. Pháp chế rà soát cùng chính sách bảo hành.',
  },
  // ---------------------------------------------------------------- Khách lẻ (/ho-tro-khach-hang)
  {
    id: 'support.no-personal-transfer',
    text: {
      vi:
        'Bluebolt không yêu cầu bạn chuyển khoản trước vào tài khoản cá nhân của thợ hay nhân viên để giữ lịch, đặt cọc hoặc ' +
        'xử lý bảo hành.',
      en:
        "Bluebolt never asks you to transfer money in advance to a technician's or staff member's personal account to hold " +
        'a booking, pay a deposit or process a warranty claim.',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note:
      'docs/03 mục 13.5 (T-SUPPORT). Trước khi duyệt: đối chiếu Chính sách Phần 2 Điều 2 (vật tư khách trả trực tiếp cho thợ ' +
      'tại chỗ) để câu chữ không mâu thuẫn.',
  },
  {
    id: 'support.warranty-response-time',
    text: {
      vi:
        'Bộ phận chăm sóc khách hàng phản hồi yêu cầu bảo hành trong 24 giờ làm việc. Lỗi do lắp đặt được ưu tiên khắc phục ' +
        'trong 24–48 giờ kể từ khi xác định được nguyên nhân.',
      en:
        'Customer care responds to warranty requests within 24 business hours. Faults caused by the installation are prioritized ' +
        'and usually fixed within 24–48 hours of identifying the cause.',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 2, Điều khoản 3',
    approvedBy: null,
    approvedAt: null,
    note: 'Trùng nội dung SLA "fix-response-time" (content/sla.ts, draft). Chốt cùng lúc.',
  },
  {
    id: 'support.warranty-exclusions',
    text: {
      vi:
        'Bảo hành dịch vụ không áp dụng cho vật tư khách tự mua, hư hỏng do hao mòn tự nhiên, dùng sai hướng dẫn, nguồn điện ' +
        'không ổn định, thiên tai hoặc bên thứ ba can thiệp. Nếu lỗi do phía khách, việc khắc phục được tính phí như dịch vụ ' +
        'thông thường.',
      en:
        'The service warranty does not cover materials the customer bought, or damage from normal wear, misuse, unstable power, ' +
        'natural disasters or third-party tampering. If the fault is on the customer side, the fix is charged as a normal service.',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 1 Điều khoản 3, Phần 2 Điều khoản 3',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'support.responsibility-split',
    text: {
      vi:
        'Lỗi của sản phẩm và linh kiện do hãng bảo hành theo chính sách của hãng. Bluebolt chịu trách nhiệm khắc phục lỗi phát ' +
        'sinh từ việc lắp đặt, sửa chữa của thợ Bluebolt.',
      en:
        'Product and component faults are covered by the brand under its own warranty. Bluebolt is responsible for fixing faults ' +
        'caused by the installation or repair work of Bluebolt technicians.',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 4, Điều khoản 1',
    approvedBy: null,
    approvedAt: null,
  },
] as const satisfies readonly Claim[];
