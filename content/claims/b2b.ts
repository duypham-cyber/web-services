import type { Claim } from '../schemas';

/**
 * Câu khẳng định của khu vực B2B (/giai-phap/*, /dich-vu/*, /bang-gia). Chủ sở hữu: agent trang B2B.
 * Lấy từ site cũ / chính sách hiện hành. "draft" = CHƯA được anh Duy + pháp chế duyệt cho site mới → production KHÔNG
 * hiển thị (phần chứa nó tự thu gọn); bản xem trước (DRAFT_PREVIEW=1) hiện kèm nhãn "Nháp".
 * Duyệt 03/10/2026 (docs/DECISIONS.md D-26 mục 2, bảng D-27): chỉ "b2b.sla.confirm-60-minutes" (mốc 60 phút đã duyệt).
 * "b2b.warranty.installation-faults" từng được duyệt rồi đưa về nháp cùng ngày sau kiểm định độc lập (D-27): đó là câu về
 * phạm vi bảo hành, không phải số/mốc trong danh sách duyệt của D-26. Câu lấy từ chính sách cũ (CS) giữ nháp vì chính
 * sách đó là trang pháp lý chưa có bản chốt (D-26).
 *
 * id có tiền tố "b2b." để không trùng claim của khu vực khác (validate.ts báo lỗi khi trùng id).
 * Duyệt một câu: điền evidence, approvedBy, approvedAt, đổi status → "approved" (docs/04 R17, Q19).
 *
 * Nguồn chung:
 *   CS = Chính sách hiện hành 4 phần (research/agent-notes/content-cro/policy-vi-parts.json; Phần 1 trong
 *        prices-interactive.json → "policy").
 *   /services cũ = research/raw/services.txt, website-services-3d/noi-dung/crawl.json (slug "services").
 *
 * Ô của bảng SLA theo vùng (components/solutions/kit/SlaRegionTable.tsx) dùng câu ngắn (vd "60 phút"): mỗi ô là
 * một cam kết riêng nên đi qua claim() để production tự ẩn khi chưa duyệt.
 */
export const b2bClaims = [
  // ------------------------------------------------------------------------------------------
  // SLA theo vùng
  // ------------------------------------------------------------------------------------------
  {
    id: 'b2b.sla.confirm-60-minutes',
    text: { vi: '60 phút', en: '60 minutes' },
    status: 'approved',
    evidence:
      '/services cũ, mục 3: "CSKH liên hệ khách hàng để xác nhận đơn hàng trong vòng 60 phút"; NOI-DUNG.md mục 13 ghi "60 phút xác nhận lịch". Anh Duy duyệt mốc 60 phút 03/10/2026 (docs/DECISIONS.md D-26 mục 2).',
    approvedBy: 'Anh Duy (D-26)',
    approvedAt: '2026-10-03',
    note:
      'Duyệt 03/10/2026 (D-26 mục 2, D-27): ô chỉ khẳng định mốc tối đa 60 phút đã duyệt (cùng K6, content/sla.ts "confirm-time"), không đổi câu chữ. Ô "Xác nhận lịch với khách" ở 3 vùng tiêu chuẩn; khu vực đặc thù vẫn theo claim b2b.sla.special-areas-case-by-case (nháp). CÒN MỞ: người xác nhận (site cũ: CSKH; CS Phần 3 Điều khoản 3 và content/process.ts bước 03: thợ) — chờ anh Duy. ' +
      'Nguồn đặt 60 phút TRƯỚC bước điều phối (services.txt: Bước 2 CSKH 60 phút → Bước 3 điều phối thợ); trên /giai-phap/* ô này ' +
      'đứng cạnh quy trình "điều phối → thợ gọi khách" (thứ tự 02→03 của content/process.ts còn là giả định) nên dễ đọc thành ' +
      '"trong 60 phút đã điều phối và thợ đã gọi" — mạnh hơn nguồn. Đã báo tech lead (D-27).',
  },
  {
    id: 'b2b.sla.completion-48-hours',
    text: { vi: 'Tối đa 48 giờ', en: 'Within 48 hours' },
    status: 'draft',
    evidence: 'CS Phần 3, Điều khoản 1: "Thời hạn tối đa là 48 giờ kể từ thời điểm Khách hàng đặt lịch."',
    approvedBy: null,
    approvedAt: null,
    note: 'Ô "Hoàn thành lắp đặt" ở 3 vùng tiêu chuẩn. Trang chủ cũ ghi "trong 24h" (xem b2b.retail.onsite-within-24h).',
  },
  {
    id: 'b2b.sla.fix-24-business-hours',
    text: { vi: '24 giờ làm việc', en: '24 business hours' },
    status: 'draft',
    evidence: 'CS Phần 4, Điều khoản 2: lỗi lắp đặt tại Hà Nội và TP. HCM xử lý trong 24 giờ làm việc (nội thành).',
    approvedBy: null,
    approvedAt: null,
    note: 'Ô "Xử lý lỗi lắp đặt", vùng nội thành TP. HCM và Hà Nội.',
  },
  {
    id: 'b2b.sla.fix-36-business-hours',
    text: { vi: '36 giờ làm việc', en: '36 business hours' },
    status: 'draft',
    evidence: 'CS Phần 4, Điều khoản 2: ngoại thành Hà Nội, TP. HCM và các tỉnh xử lý trong 36 giờ làm việc.',
    approvedBy: null,
    approvedAt: null,
    note: 'Ô "Xử lý lỗi lắp đặt", vùng ngoại thành TP. HCM, Hà Nội và tỉnh, thành khác.',
  },
  {
    id: 'b2b.sla.special-areas-case-by-case',
    text: { vi: 'Theo từng trường hợp', en: 'Case by case' },
    status: 'draft',
    evidence: 'CS Phần 1, Điều khoản 1: khu vực đặc thù (hải đảo, biên giới, vùng sâu vùng xa) xem xét từng trường hợp, không áp dụng cam kết thời gian tiêu chuẩn.',
    approvedBy: null,
    approvedAt: null,
    note: 'Cột "Khu vực đặc thù" của bảng SLA theo vùng.',
  },
  {
    id: 'b2b.sla.special-areas-definition',
    text: {
      vi: 'Khu vực đặc thù gồm hải đảo, biên giới, vùng sâu vùng xa: Bluebolt xem xét theo từng trường hợp và không áp dụng cam kết thời gian tiêu chuẩn.',
      en: 'Special areas (islands, border areas and remote areas) are handled case by case, without the standard time commitments.',
    },
    status: 'draft',
    evidence: 'CS Phần 1, Điều khoản 1.',
    approvedBy: null,
    approvedAt: null,
    note: 'Chú thích dưới bảng SLA và câu hỏi thường gặp ở trang sàn TMĐT.',
  },
  {
    id: 'b2b.sla.urgent-orders',
    text: {
      vi: 'Đơn gấp đặt từ 09:00 đến 13:00 (thứ Hai đến thứ Sáu) hoàn thành trước 18:00 cùng ngày; đặt từ 13:00 đến 17:00 (thứ Hai đến thứ Năm) hoàn thành trước 12:00 hôm sau. Không áp dụng vào thứ Bảy, Chủ nhật, Lễ, Tết và ở khu vực đặc thù.',
      en: 'Urgent jobs booked 09:00–13:00 (Monday to Friday) are completed by 18:00 the same day; jobs booked 13:00–17:00 (Monday to Thursday) are completed by 12:00 the next day. Not available on Saturdays, Sundays, public holidays or in special areas.',
    },
    status: 'draft',
    evidence: 'CS Phần 3, Điều khoản 2 "Chính sách Lắp đặt gấp".',
    approvedBy: null,
    approvedAt: null,
    note: 'Chính sách viết cho thợ; cần xác nhận có cam kết đơn gấp với hãng/sàn không.',
  },
  {
    id: 'b2b.sla.warranty-hours',
    text: {
      vi: 'Xử lý bảo hành từ 08:00 đến 17:00, thứ Hai đến thứ Sáu.',
      en: 'Warranty visits take place 08:00–17:00, Monday to Friday.',
    },
    status: 'draft',
    evidence: 'CS Phần 4, Điều khoản 2: "Thời gian thực hiện bảo hành: Từ 08:00 đến 17:00 (Thứ 2 đến Thứ 6)."',
    approvedBy: null,
    approvedAt: null,
    note: 'Định nghĩa "giờ làm việc" cho các ô 24/36 giờ làm việc. Khung thi công của thợ ở CS Phần 3 là 08:00–17:00 thứ Hai đến thứ Bảy (khác).',
  },

  // ------------------------------------------------------------------------------------------
  // Sàn TMĐT và bán lẻ
  // ------------------------------------------------------------------------------------------
  {
    id: 'b2b.retail.onsite-within-24h',
    text: {
      vi: 'Khách của sàn có thợ đến tận nơi trong 24 giờ',
      en: 'Marketplace customers get a technician at their door within 24 hours',
    },
    status: 'draft',
    evidence: 'Trang chủ cũ, thẻ "Sàn TMĐT / Retail": "Khách hàng nhận thợ đến tận nơi trong 24h" (research/raw/home.txt).',
    approvedBy: null,
    approvedAt: null,
    note: 'Mâu thuẫn với CS Phần 3 (tối đa 48 giờ). NOI-DUNG.md mục 13: "Có cam kết cho mọi tỉnh không?" — chờ anh Duy.',
  },
  {
    id: 'b2b.integration.channels',
    text: {
      vi: 'Bluebolt nhận đơn qua API, tệp đơn hàng hoặc cổng đối tác.',
      en: 'Bluebolt accepts orders by API, order file or partner portal.',
    },
    status: 'draft',
    evidence: 'docs/03 mục 14.1 bước 01 (đề xuất). Chưa kiểm chứng hệ thống điều phối có API.',
    approvedBy: null,
    approvedAt: null,
    note: 'Câu hỏi mở: kênh nhận đơn thực tế với từng hãng/sàn (docs/03 mục 14.1, 15 dòng 7).',
  },
  {
    id: 'b2b.platform.realtime-tracking',
    text: {
      vi: 'Trạng thái đơn, ảnh nghiệm thu và lịch sử thanh toán được cập nhật theo thời gian thực trên hệ thống.',
      en: 'Job status, sign-off photos and payment history are updated in real time in the system.',
    },
    status: 'draft',
    evidence: 'Trang chủ cũ, ưu điểm "Quy trình MINH BẠCH"; NOI-DUNG.md mục 9 (Dashboard cho Hãng/Sàn).',
    approvedBy: null,
    approvedAt: null,
    note: 'Cần xác nhận hãng/sàn có tài khoản xem dashboard hay nhận báo cáo định kỳ.',
  },

  // ------------------------------------------------------------------------------------------
  // Đối soát, hóa đơn, chi phí
  // ------------------------------------------------------------------------------------------
  {
    id: 'b2b.billing.tax-compliant-costs',
    text: {
      vi: 'Chi phí lắp đặt được hợp lệ hóa về thuế (VAT, thuế thu nhập cá nhân) cho hãng.',
      en: 'Installation costs are documented for tax purposes (VAT and personal income tax) on the brand side.',
    },
    status: 'draft',
    evidence: 'Trang chủ cũ: "Hợp lệ hóa chi phí: Tối ưu hóa bài toán thuế (VAT/TNCN) giúp Hãng yên tâm về mặt pháp lý."',
    approvedBy: null,
    approvedAt: null,
    note: 'Cần xác nhận: Bluebolt xuất hóa đơn VAT cho phí dịch vụ; ai kê khai thuế TNCN cho thợ. Pháp chế duyệt câu chữ.',
  },
  {
    id: 'b2b.billing.materials-no-invoice',
    text: {
      vi: 'Bluebolt không thu tiền và không xuất hóa đơn cho vật tư thợ thu tại chỗ.',
      en: 'Bluebolt does not collect payment for, or invoice, the parts that technicians charge on site.',
    },
    status: 'draft',
    evidence: 'CS Phần 2, Điều khoản 2: "BBSV không thu tiền và không xuất hóa đơn cho chi phí vật tư này."',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'b2b.scope.standard-site-conditions',
    text: {
      vi: 'Phí lắp đặt tiêu chuẩn áp dụng cho vị trí thi công an toàn, độ cao dưới 3,5 m.',
      en: 'The standard installation fee covers safe working positions below 3.5 m.',
    },
    status: 'draft',
    evidence: 'CS Phần 2, Điều khoản 2: "phí nhân công lắp đặt tiêu chuẩn (áp dụng cho địa hình an toàn, độ cao < 3.5 mét)".',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'b2b.pricing.no-surprise-costs',
    text: {
      vi: 'Không phát sinh chi phí ngoài báo giá đã thỏa thuận với khách.',
      en: 'No charges beyond the price agreed with the customer.',
    },
    status: 'draft',
    evidence: '/services cũ, mục 4 "Cam kết SLA dịch vụ": "Tuyệt đối không phát sinh chi phí ngoài báo giá và đã thỏa thuận với Khách hàng".',
    approvedBy: null,
    approvedAt: null,
  },

  // ------------------------------------------------------------------------------------------
  // Bảo hành và trách nhiệm
  // ------------------------------------------------------------------------------------------
  {
    id: 'b2b.warranty.installation-faults',
    text: {
      vi: 'Bảo hành lỗi do kỹ thuật lắp đặt, như rò nước, lỏng giắc cắm hay đấu nối sai quy trình.',
      en: 'Faults caused by the installation work, such as water leaks, loose connectors or incorrect wiring, are covered.',
    },
    status: 'draft',
    evidence: '/services cũ, mục 5: "Bảo hành 100% các lỗi phát sinh do kỹ thuật lắp đặt (như rò rỉ nước, lỏng giắc cắm, đấu nối sai quy trình...)"; NOI-DUNG.md mục 8.',
    approvedBy: null,
    approvedAt: null,
    note:
      'Giữ nháp (kiểm định 03/10/2026, D-27): câu về PHẠM VI bảo hành, không nằm trong danh sách số/mốc được duyệt của D-26 mục 2. ' +
      'Khi được duyệt, 4 trang /dich-vu/* hiện tiêu đề "Theo chính sách hiện hành" + link chính sách bảo hành, trong khi trang ' +
      'chính sách vẫn ghi "Chưa ban hành" → duyệt lại cùng lúc với bản chính thức của chính sách bảo hành (pháp chế). Có nguồn, ' +
      'không mâu thuẫn mốc 24–48h đã duyệt.',
  },
  {
    id: 'b2b.warranty.responsibility-split',
    text: {
      vi: 'Lỗi kỹ thuật và linh kiện của sản phẩm do hãng xử lý theo quy trình bảo hành của hãng; lỗi do lắp đặt hoặc sửa chữa của thợ Bluebolt do Bluebolt khắc phục.',
      en: "Product and component faults are handled by the brand under its own warranty process; faults caused by a Bluebolt technician's installation or repair work are fixed by Bluebolt.",
    },
    status: 'draft',
    evidence: 'CS Phần 4, Điều khoản 1 "Phân định trách nhiệm".',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'b2b.warranty.brand-fallback',
    text: {
      vi: 'Nếu Bluebolt không sửa được lỗi lắp đặt trong thời gian cam kết mà khách cần xử lý ngay, hãng có thể tự khắc phục; Bluebolt hoàn trả chi phí theo thỏa thuận.',
      en: 'If Bluebolt cannot fix an installation fault within the committed time and the customer needs it fixed at once, the brand may fix it and Bluebolt reimburses the cost as agreed.',
    },
    status: 'draft',
    evidence: 'CS Phần 4, Điều khoản 2 "Trường hợp ngoại lệ".',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'b2b.warranty.exclusions',
    text: {
      vi: 'Không bảo hành hư hỏng do hao mòn tự nhiên, dùng sai hướng dẫn, nguồn điện không ổn định, thiên tai, bên thứ ba can thiệp và vật tư khách tự mua.',
      en: 'Not covered: normal wear, misuse, unstable power supply, natural disasters, third-party tampering and parts the customer bought separately.',
    },
    status: 'draft',
    evidence: 'CS Phần 1, Điều khoản 3; CS Phần 2, Điều khoản 3 (vật tư khách tự mua).',
    approvedBy: null,
    approvedAt: null,
    note: 'Nội dung pháp lý: trang /chinh-sach-bao-hanh (agent partner) là bản đầy đủ; ở trang B2B chỉ tóm tắt.',
  },

  // ------------------------------------------------------------------------------------------
  // Khiếu nại và đổi thợ
  // ------------------------------------------------------------------------------------------
  {
    id: 'b2b.complaints.change-technician',
    text: {
      vi: 'Khách được khiếu nại hoặc yêu cầu đổi thợ khi có căn cứ hợp lý.',
      en: 'Customers may file a complaint or ask for a different technician when there are reasonable grounds.',
    },
    status: 'draft',
    evidence: 'CS Phần 2, Điều khoản 1 "Quyền lợi và Trách nhiệm".',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'b2b.complaints.technician-sanctions',
    text: {
      vi: 'Thợ trễ hẹn, không đến, báo giá sai bảng giá niêm yết hoặc lắp sai kỹ thuật bị xử lý theo khung chế tài của Bluebolt.',
      en: "Technicians who arrive late, miss an appointment, quote outside the published price list or install incorrectly are penalised under Bluebolt's sanctions framework.",
    },
    status: 'draft',
    evidence: 'CS Phần 3, Điều khoản 3 "Chế tài vi phạm & Đền bù (Khung SLA)".',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'b2b.complaints.property-damage',
    text: {
      vi: 'Thợ làm hỏng tài sản của khách phải đền bù theo giá trị thực tế.',
      en: "Technicians who damage a customer's property compensate at its actual value.",
    },
    status: 'draft',
    evidence: 'CS Phần 3, Điều khoản 3: "thợ phải đền bù theo đúng giá trị tài sản thực tế".',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 'b2b.complaints.support-response',
    text: {
      vi: 'Chăm sóc khách hàng phản hồi yêu cầu trong 24 giờ làm việc.',
      en: 'Customer care replies to requests within 24 business hours.',
    },
    status: 'draft',
    evidence: 'CS Phần 2, Điều khoản 3: "Chăm sóc khách hàng phản hồi yêu cầu trong vòng 24 giờ làm việc."',
    approvedBy: null,
    approvedAt: null,
  },
] as const satisfies readonly Claim[];
