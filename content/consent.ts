import { site } from './site';

/**
 * Câu chữ đồng ý xử lý dữ liệu cá nhân cho form lead — contracts/lead-b2b.md Rule 2 + Rule 3, lead-technician.md mục 3.
 * Chủ sở hữu: agent LEADS. Kiểm bằng Zod ở lib/leads/consent.ts (import file này là chạy kiểm).
 *
 * ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 * │ BẢN NHÁP — CHƯA ĐƯỢC DUYỆT. Tech lead soạn ngày 03/10/2026 theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, chờ      │
 * │ pháp chế viết/duyệt (PC-01 câu chữ, PC-02 mục đích, PC-03 thời hạn lưu, PC-04 đầu mối yêu cầu, PC-05 bên xử lý).     │
 * │ approvedBy = null → production TẮT form và API trả 503 LEADS_DISABLED (AC-C10). Bản xem trước (DRAFT_PREVIEW=1)      │
 * │ hiện form kèm nhãn "Nháp" với câu chữ này. Các chỗ "[… — chờ pháp chế]" PHẢI được thay trước khi duyệt: schema      │
 * │ từ chối version có approvedBy mà còn chỗ trống.                                                                     │
 * └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * Quy tắc (Rule 2):
 * - Mỗi version là một khóa bất biến: KHÔNG sửa, KHÔNG xóa version đã có người dùng đồng ý — DB lưu `consent_version` để
 *   truy lại đúng câu chữ người dùng đã đọc. Đổi câu chữ (kể cả khi tên/địa chỉ pháp nhân ở content/site.ts đổi) = thêm
 *   version mới với `effectiveFrom` mới.
 * - Duyệt: điền `approvedBy` (người/đơn vị duyệt) + `approvedAt` (YYYY-MM-DD) trong cùng commit với câu chữ đã chốt.
 * - Server nhận version hiện hành và version liền trước trong 24 giờ sau khi version mới có hiệu lực (tab mở sẵn); cũ hơn → 409.
 * - Mục đích: mỗi mục đích một checkbox riêng, không tick sẵn. API chỉ nhận mảng mã mục đích ĐÃ đồng ý.
 */

export type ConsentLeadType = 'lead_b2b' | 'lead_technician';

export type ConsentPurpose = {
  /** Mã lưu vào leads.consent_purposes. Không đổi mã đã dùng. */
  code: string;
  required: boolean;
  /** Chữ cạnh checkbox. */
  textVi: string;
  textEn: string;
};

export type ConsentVersion = {
  /** Khóa duy nhất toàn hệ thống, ≤ 32 ký tự (cột consent_version). */
  version: string;
  type: ConsentLeadType;
  /** Thời điểm version bắt đầu hiệu lực (ISO 8601 có múi giờ). */
  effectiveFrom: string;
  /** Thông báo xử lý dữ liệu hiện phía trên các checkbox: bên thu, dữ liệu, mục đích, thời hạn, quyền, kênh liên hệ. */
  textVi: string;
  textEn: string;
  purposes: readonly ConsentPurpose[];
  /** Trang chính sách bảo mật theo ngôn ngữ (i18n/routing.ts: '/chinh-sach-bao-mat' → EN '/privacy-policy'). */
  policyUrl: { vi: string; en: string };
  approvedBy: string | null;
  approvedAt: string | null;
  /** Ghi chú nội bộ (không hiển thị cho người dùng). */
  note: string;
};

const legal = site.legalName.titleCase;
const controllerVi = `${legal} (Bluebolt Services, mã số thuế ${site.taxCode}, địa chỉ ${site.address.text.vi})`;
const controllerEn = `${legal} (Bluebolt Services, tax code ${site.taxCode}, ${site.address.text.en})`;

const RETENTION_VI = '[thời hạn lưu — chờ pháp chế]';
const RETENTION_EN = '[retention period — pending legal review]';
const CONTACT_VI = '[đầu mối tiếp nhận yêu cầu về dữ liệu cá nhân — chờ pháp chế]';
const CONTACT_EN = '[contact point for personal data requests — pending legal review]';
const PROCESSORS_VI = '[danh sách bên xử lý và việc chuyển dữ liệu ra nước ngoài — chờ pháp chế]';
const PROCESSORS_EN = '[list of processors and cross-border transfers — pending legal review]';

const rightsVi =
  `Bạn có quyền được biết, truy cập, yêu cầu chỉnh sửa, yêu cầu xóa, hạn chế xử lý dữ liệu và rút lại sự đồng ý bất cứ ` +
  `lúc nào bằng cách liên hệ ${CONTACT_VI}. Rút lại sự đồng ý không ảnh hưởng tới việc xử lý đã thực hiện trước đó.`;
const rightsEn =
  `You have the right to be informed, to access your data, to ask for it to be corrected or deleted, to restrict ` +
  `processing and to withdraw your consent at any time by contacting ${CONTACT_EN}. Withdrawing consent does not ` +
  `affect processing carried out before the withdrawal.`;

const POLICY_URL = { vi: '/chinh-sach-bao-mat', en: '/en/privacy-policy' } as const;
const DRAFT_NOTE =
  'BẢN NHÁP do tech lead soạn 03/10/2026 (D-26), chờ pháp chế PC-01…05. Chưa approvedBy → production tắt form (AC-C10).';

export const consentVersions: readonly ConsentVersion[] = [
  {
    version: 'b2b-2026-10-v1',
    type: 'lead_b2b',
    effectiveFrom: '2026-10-03T00:00:00+07:00',
    textVi:
      `${controllerVi} là bên kiểm soát và xử lý dữ liệu cá nhân bạn nhập vào biểu mẫu này: họ và tên, công ty, chức danh, ` +
      `số di động, email công ty, loại doanh nghiệp, sản lượng đơn lắp mỗi tháng, tỉnh/thành triển khai và ghi chú. Hệ ` +
      `thống ghi kèm phiên bản điều khoản, thời điểm gửi, các mục đích bạn chọn và một mã băm một chiều của địa chỉ IP ` +
      `(không lưu địa chỉ IP) để chống gửi tự động. Dữ liệu chỉ được dùng cho các mục đích bạn chọn dưới đây, được lưu ` +
      `trong ${RETENTION_VI} rồi xóa. Biểu mẫu dùng Cloudflare Turnstile để chống spam; ${PROCESSORS_VI}. ${rightsVi}`,
    textEn:
      `${controllerEn} is the controller and processor of the personal data you enter in this form: full name, company, ` +
      `job title, mobile number, work email, business type, monthly installation volume, provinces and notes. The system ` +
      `also records the version of these terms, the time of submission, the purposes you select and a one-way hash of ` +
      `your IP address (the IP address itself is not stored) to block automated submissions. Your data is used only for ` +
      `the purposes you select below and is kept for ${RETENTION_EN}, then deleted. This form uses Cloudflare Turnstile ` +
      `to prevent spam; ${PROCESSORS_EN}. ${rightsEn}`,
    purposes: [
      {
        code: 'b2b_sales_contact',
        required: true,
        textVi:
          'Tôi đồng ý để Bluebolt Services dùng họ tên, số di động, email và thông tin công ty tôi cung cấp để liên hệ tư ' +
          'vấn, gửi báo giá và chốt lịch demo cho yêu cầu này.',
        textEn:
          'I agree that Bluebolt Services may use the name, mobile number, email and company details I provide to ' +
          'contact me about this request, send a quote and arrange a demo.',
      },
      {
        code: 'b2b_marketing',
        required: false,
        textVi:
          'Tôi đồng ý nhận tin tức, tài liệu và lời mời sự kiện của Bluebolt Services qua email hoặc điện thoại. Không chọn ' +
          'mục này không ảnh hưởng tới yêu cầu của tôi.',
        textEn:
          'I agree to receive news, materials and event invitations from Bluebolt Services by email or phone. Leaving ' +
          'this unticked does not affect my request.',
      },
    ],
    policyUrl: POLICY_URL,
    approvedBy: null,
    approvedAt: null,
    note: DRAFT_NOTE,
  },
  {
    version: 'tech-2026-10-v1',
    type: 'lead_technician',
    effectiveFrom: '2026-10-03T00:00:00+07:00',
    textVi:
      `${controllerVi} là bên kiểm soát và xử lý dữ liệu cá nhân bạn nhập vào biểu mẫu này: họ và tên, số di động (Zalo), ` +
      `tỉnh/thành nhận việc chính và kỹ năng chính. Hệ thống ghi kèm phiên bản điều khoản, thời điểm gửi, các mục đích ` +
      `bạn chọn và một mã băm một chiều của địa chỉ IP (không lưu địa chỉ IP) để chống gửi tự động. Dữ liệu chỉ được ` +
      `dùng cho các mục đích bạn chọn dưới đây, được lưu trong ${RETENTION_VI} rồi xóa. Biểu mẫu dùng Cloudflare ` +
      `Turnstile để chống spam; ${PROCESSORS_VI}. ${rightsVi}`,
    textEn:
      `${controllerEn} is the controller and processor of the personal data you enter in this form: full name, mobile ` +
      `number (Zalo), main working province and main skill. The system also records the version of these terms, the ` +
      `time of submission, the purposes you select and a one-way hash of your IP address (the IP address itself is not ` +
      `stored) to block automated submissions. Your data is used only for the purposes you select below and is kept for ` +
      `${RETENTION_EN}, then deleted. This form uses Cloudflare Turnstile to prevent spam; ${PROCESSORS_EN}. ${rightsEn}`,
    purposes: [
      {
        code: 'tech_partner_contact',
        required: true,
        textVi:
          'Tôi đồng ý để bộ phận tuyển thợ của Bluebolt Services gọi điện hoặc nhắn Zalo theo số tôi cung cấp để tư vấn và ' +
          'hướng dẫn các bước gia nhập mạng lưới đối tác thợ.',
        textEn:
          'I agree that the Bluebolt Services technician recruitment team may call me or message me on Zalo at the ' +
          'number I provide to explain how to join the technician partner network.',
      },
      {
        code: 'tech_job_alerts',
        required: false,
        textVi:
          'Tôi đồng ý nhận cuộc gọi hoặc tin nhắn Zalo khi có việc mới ở tỉnh/thành tôi đã chọn. Không chọn mục này không ' +
          'ảnh hưởng tới đăng ký của tôi.',
        textEn:
          'I agree to receive calls or Zalo messages about new jobs in the province I selected. Leaving this unticked ' +
          'does not affect my registration.',
      },
    ],
    policyUrl: POLICY_URL,
    approvedBy: null,
    approvedAt: null,
    note: DRAFT_NOTE,
  },
];
