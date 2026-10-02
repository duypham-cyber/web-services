import type { LocalizedText } from './schemas';

/**
 * Nội dung 3 trang pháp lý (T-LEGAL, contracts/site-shell-p0.md AC-LEGAL-1). Chủ sở hữu: agent trang thợ & công ty;
 * NGƯỜI VIẾT NỘI DUNG THẬT: pháp chế. Contract dự kiến content/legal/{vi,en}/*.mdx — repo chưa có MDX nên giữ dạng dữ
 * liệu có cấu trúc ở đây (cùng shape version/effectiveFrom/approvedBy), đổi sang MDX/CMS chỉ cần thay tầng đọc.
 *
 * Luật hiển thị (components/legal/LegalDocument.tsx):
 *   - status "approved" (đủ approvedBy, approvedAt, version, effectiveFrom) → hiện toàn văn ở mọi môi trường.
 *   - status "draft" + DRAFT_PREVIEW=1  → hiện nội dung kèm nhãn Nháp, banner nguồn gốc, ghi chú cho pháp chế.
 *   - status "draft" ở production        → chỉ hiện thông báo "Nội dung đang được cập nhật" + kênh liên hệ, kèm noindex.
 *
 * KHÔNG tự viết điều khoản pháp lý như thật: privacy/terms chỉ có KHUNG MỤC (blocks = null) + ghi chú việc pháp chế cần
 * soạn. warranty chuyển nguyên ý chính sách 4 phần của site cũ (research/agent-notes/content-cro/policy-vi.json,
 * policy-vi-parts.json; bản EN policy-en.json, policy-en-parts.json), chỉ sắp xếp lại và đổi "BBSV" → "Bluebolt".
 */

export type LegalDocKey = 'privacy' | 'terms' | 'warranty';

export type LegalBlock =
  | { kind: 'p'; text: LocalizedText }
  | { kind: 'list'; items: readonly LocalizedText[] }
  | { kind: 'table'; caption: LocalizedText; head: readonly LocalizedText[]; rows: readonly (readonly LocalizedText[])[] };

export type LegalSubsection = {
  /** Neo trong trang, ASCII kebab-case (giống nhau ở VI và EN). */
  id: string;
  title: LocalizedText;
  blocks: readonly LegalBlock[];
  /** Ghi chú cho pháp chế / anh Duy — CHỈ hiện ở bản xem trước. */
  reviewNote?: LocalizedText;
};

export type LegalSection = {
  id: string;
  title: LocalizedText;
  /** null = mục chưa có nội dung (pháp chế soạn). */
  blocks: readonly LegalBlock[] | null;
  subsections?: readonly LegalSubsection[];
  reviewNote?: LocalizedText;
};

export type LegalDoc = {
  key: LegalDocKey;
  status: 'draft' | 'approved';
  /** legacy-site = chuyển từ website cũ · outline = chỉ khung mục chờ pháp chế · legal-team = pháp chế soạn và duyệt */
  origin: 'legacy-site' | 'outline' | 'legal-team';
  version: string | null;
  /** YYYY-MM-DD */
  effectiveFrom: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  source: string;
  sections: readonly LegalSection[];
};

/** Văn bản đã được pháp chế duyệt và được phép hiện ở production. */
export function isLegalDocPublished(doc: LegalDoc): boolean {
  return (
    doc.status === 'approved' &&
    doc.approvedBy !== null &&
    doc.approvedAt !== null &&
    doc.version !== null &&
    doc.effectiveFrom !== null
  );
}

const t = (vi: string, en: string): LocalizedText => ({ vi, en });
const p = (vi: string, en: string): LegalBlock => ({ kind: 'p', text: t(vi, en) });
const list = (...items: LocalizedText[]): LegalBlock => ({ kind: 'list', items });

// ================================================================================================ Chính sách bảo hành
const warranty: LegalDoc = {
  key: 'warranty',
  status: 'draft',
  origin: 'legacy-site',
  version: null,
  effectiveFrom: null,
  approvedBy: null,
  approvedAt: null,
  source:
    'Website cũ lapdattoanquoc.vn/prices, khối "Điều khoản & quy định dịch vụ" (crawl 01/10/2026): ' +
    'research/agent-notes/content-cro/policy-vi.json, policy-vi-parts.json, policy-en.json, policy-en-parts.json',
  sections: [
    {
      id: 'quy-dinh-chung',
      title: t('Phần 1. Quy định chung và thời gian vận hành', 'Part 1. General provisions and operating hours'),
      blocks: null,
      subsections: [
        {
          id: 'pham-vi',
          title: t('1.1. Bluebolt Services và phạm vi cung cấp', '1.1. Bluebolt Services and scope of service'),
          blocks: [
            p(
              'Bluebolt Services cung cấp dịch vụ lắp đặt, sửa chữa thiết bị điện lạnh, điện máy (điều hòa, máy giặt, tivi, máy lọc nước…) trên phạm vi toàn quốc.',
              'Bluebolt Services provides installation and repair services for refrigeration and electrical appliances (air conditioners, washing machines, TVs, water purifiers and more) nationwide.',
            ),
            p(
              'Với khu vực đặc thù (hải đảo, biên giới, vùng sâu, vùng xa), Bluebolt xem xét cung cấp dịch vụ theo từng trường hợp cụ thể và không áp dụng các cam kết thời gian tiêu chuẩn.',
              'For special locations (islands, border areas and remote regions), Bluebolt considers service availability case by case, and standard time commitments do not apply.',
            ),
          ],
          reviewNote: t(
            'Cụm "trên phạm vi toàn quốc" phụ thuộc claim coverage.provinces-34 (chưa duyệt).',
            'The word "nationwide" depends on claim coverage.provinces-34, which is not yet approved.',
          ),
        },
        {
          id: 'thoi-gian-tiep-nhan',
          title: t('1.2. Thời gian tiếp nhận và xử lý đơn', '1.2. Order intake and processing hours'),
          blocks: [
            p(
              'Bluebolt tiếp nhận và xác nhận lịch dịch vụ trong các khung giờ sau:',
              'Bluebolt accepts and confirms service appointments during the following hours:',
            ),
            list(
              t(
                'Thứ Hai đến thứ Sáu: 09:00–16:30. Đơn phát sinh sau 16:30 được xử lý vào ngày làm việc kế tiếp.',
                'Monday to Friday: 09:00–16:30. Orders placed after 16:30 are processed on the next business day.',
              ),
              t(
                'Thứ Bảy: 09:00–12:00. Đơn phát sinh sau 12:00 được xử lý vào ngày làm việc kế tiếp (không tính Chủ nhật).',
                'Saturday: 09:00–12:00. Orders placed after 12:00 are processed on the next business day (Sundays excluded).',
              ),
              t(
                'Chủ nhật, ngày lễ, Tết: không tiếp nhận đơn. Đơn được chuyển sang xử lý vào ngày làm việc kế tiếp.',
                'Sundays and public holidays: no orders are accepted. Orders are carried over to the next business day.',
              ),
            ),
          ],
        },
        {
          id: 'gioi-han-trach-nhiem',
          title: t('1.3. Giới hạn trách nhiệm và bất khả kháng', '1.3. Limitation of liability and force majeure'),
          blocks: [
            p(
              'Bluebolt không chịu trách nhiệm đền bù với các hư hỏng do hao mòn tự nhiên, sử dụng sai hướng dẫn, nguồn điện không ổn định, thiên tai hoặc do bên thứ ba can thiệp trái phép.',
              'Bluebolt is not liable for damage caused by normal wear and tear, misuse, an unstable power supply, natural disasters or unauthorized intervention by third parties.',
            ),
            p(
              'Trong mọi trường hợp, tổng trách nhiệm bồi thường (nếu có) của Bluebolt không vượt quá giá trị dịch vụ sửa chữa mà khách hàng đã thanh toán cho hạng mục đó. Các bên được miễn trừ trách nhiệm khi gặp sự kiện bất khả kháng, với điều kiện phải thông báo kịp thời.',
              "In all cases, Bluebolt's total liability for compensation (if any) does not exceed the value of the repair service the customer paid for that item. The parties are released from liability in the event of force majeure, provided that timely notice is given.",
            ),
          ],
        },
      ],
    },
    {
      id: 'khach-hang',
      title: t('Phần 2. Dành cho khách hàng', 'Part 2. For customers'),
      blocks: null,
      subsections: [
        {
          id: 'quyen-loi-trach-nhiem',
          title: t('2.1. Quyền lợi và trách nhiệm', '2.1. Rights and responsibilities'),
          blocks: [
            list(
              t(
                'Quyền lợi: khách hàng được cung cấp minh bạch về giá, được yêu cầu cung cấp dịch vụ đúng cam kết, có quyền khiếu nại hoặc yêu cầu đổi thợ khi có căn cứ hợp lý.',
                'Rights: customers are entitled to transparent pricing and to service delivered as committed, and may file a complaint or ask for a different technician when there are reasonable grounds.',
              ),
              t(
                'Trách nhiệm: chuẩn bị nguồn điện và không gian thi công an toàn, phối hợp nghiệm thu và thanh toán đúng hạn. Không tự ý tháo lắp, can thiệp kỹ thuật hoặc thuê bên thứ ba xử lý trong thời gian Bluebolt đang xử lý hoặc trong thời hạn bảo hành.',
                'Responsibilities: customers provide a safe power supply and work area, take part in the sign-off and pay on time. Customers must not remove the installation, carry out technical work or hire a third party while Bluebolt is handling the job or during the warranty period.',
              ),
            ),
          ],
        },
        {
          id: 'chi-phi-vat-tu',
          title: t('2.2. Chi phí và vật tư', '2.2. Costs and materials'),
          blocks: [
            p(
              'Chi phí trên hệ thống Bluebolt là phí nhân công lắp đặt tiêu chuẩn, áp dụng cho địa hình an toàn, độ cao dưới 3,5 mét.',
              'Prices in the Bluebolt system are standard installation labor fees, applicable to safe locations at heights below 3.5 meters.',
            ),
            p(
              'Mọi vật tư phát sinh ngoài nhân công (ống đồng, dây điện, giá đỡ…) do khách hàng và thợ thỏa thuận, thanh toán trực tiếp tại hiện trường theo khung giá tham khảo. Bluebolt không thu tiền và không xuất hóa đơn cho chi phí vật tư này.',
              'Any materials beyond labor (copper pipe, wiring, mounting brackets and so on) are agreed between the customer and the technician and paid directly on site, based on the reference price list. Bluebolt does not collect payment or issue invoices for these materials.',
            ),
          ],
        },
        {
          id: 'dang-ky-bao-hanh',
          title: t('2.3. Đăng ký và xử lý bảo hành', '2.3. Warranty registration and handling'),
          blocks: [
            p(
              'Cách đăng ký: khách hàng đăng ký bảo hành trong vòng 7 ngày sau khi nghiệm thu, qua một trong các kênh: website Bluebolt, Zalo chính thức hoặc tổng đài.',
              'How to register: customers register for warranty within 7 days of sign-off through one of these channels: the Bluebolt website, the official Zalo account or the hotline.',
            ),
            p('Thời hạn bảo hành dịch vụ, tính từ ngày nghiệm thu:', 'Service warranty periods, counted from the sign-off date:'),
            {
              kind: 'table',
              caption: t('Thời hạn bảo hành dịch vụ', 'Service warranty periods'),
              head: [t('Hạng mục', 'Service'), t('Thời hạn', 'Period')],
              rows: [
                [t('Lắp đặt mới', 'New installation'), t('02 tháng', '2 months')],
                [t('Sửa chữa, thay thế linh kiện', 'Repair or part replacement'), t('03 tháng', '3 months')],
                [t('Vệ sinh, bảo dưỡng', 'Cleaning and servicing'), t('01 tháng', '1 month')],
              ],
            },
            p('Bluebolt không bảo hành vật tư do khách hàng tự mua.', 'Bluebolt does not provide warranty for materials bought by the customer.'),
            p(
              'Thời gian phản hồi và sửa lỗi: bộ phận chăm sóc khách hàng phản hồi yêu cầu trong vòng 24 giờ làm việc. Với lỗi thuộc trách nhiệm của Bluebolt hoặc thợ, thời gian ưu tiên khắc phục thông thường từ 24 đến 48 giờ kể từ khi xác định được nguyên nhân. Nếu lỗi từ phía khách hàng, việc khắc phục được tính phí như dịch vụ thông thường.',
              'Response and repair time: customer care responds to requests within 24 business hours. For faults that are the responsibility of Bluebolt or its technicians, the usual priority fix time is 24 to 48 hours from when the cause is identified. If the fault is on the customer side, the fix is charged as a standard service.',
            ),
          ],
          reviewNote: t(
            'Mâu thuẫn thời hạn: chính sách ghi lắp đặt mới 02 tháng, một bài viết cũ ghi 12 tháng (content/sla.ts). Kênh "website" chưa có form (P1, chờ contract riêng).',
            'Conflicting periods: the policy says 2 months for new installations, an old article says 12 months (content/sla.ts). The "website" channel has no form yet (P1, pending its own contract).',
          ),
        },
      ],
    },
    {
      id: 'doi-tac-tho',
      title: t('Phần 3. Dành cho đối tác thợ và kỹ thuật viên', 'Part 3. For technician partners'),
      blocks: null,
      subsections: [
        {
          id: 'thoi-gian-thi-cong',
          title: t('3.1. Thời gian làm việc và thi công tại hiện trường', '3.1. Working hours and on-site work'),
          blocks: [
            list(
              t(
                'Khung giờ thi công: 08:00–12:00 và 13:00–17:00, từ thứ Hai đến thứ Bảy. Không thi công vào Chủ nhật, ngày lễ, Tết.',
                'Service hours: 08:00–12:00 and 13:00–17:00, Monday to Saturday. No on-site work on Sundays or public holidays.',
              ),
              t(
                'Cam kết tiến độ: thời gian lắp đặt trung bình 60–120 phút mỗi thiết bị và phải hoàn thành trong ngày. Thời hạn tối đa là 48 giờ kể từ khi khách hàng đặt lịch.',
                'Turnaround: average installation time is 60–120 minutes per appliance and the job must be finished the same day. The maximum is 48 hours from when the customer books.',
              ),
            ),
          ],
        },
        {
          id: 'lap-dat-gap',
          title: t('3.2. Lắp đặt gấp', '3.2. Urgent installation'),
          blocks: [
            list(
              t(
                'Đơn gấp đặt từ 09:00 đến 13:00 (thứ Hai đến thứ Sáu): hoàn thành trước 18:00 cùng ngày.',
                'Urgent orders placed 09:00–13:00 (Monday to Friday): finished before 18:00 the same day.',
              ),
              t(
                'Đơn gấp đặt từ 13:00 đến 17:00 (thứ Hai đến thứ Năm): hoàn thành trước 12:00 hôm sau.',
                'Urgent orders placed 13:00–17:00 (Monday to Thursday): finished before 12:00 the next day.',
              ),
            ),
            p(
              'Không áp dụng lắp gấp vào thứ Bảy, Chủ nhật, ngày lễ, Tết và tại các khu vực đặc thù.',
              'Urgent installation is not available on Saturdays, Sundays, public holidays or in special locations.',
            ),
            p(
              'Phụ phí hỗ trợ: thợ thực hiện đơn gấp nhận được một khoản phụ phí (được hệ thống trừ trực tiếp vào ví Top-up). Mức phụ phí thay đổi theo khu vực: nội thành TP. Hồ Chí Minh và Hà Nội thấp hơn ngoại thành và các tỉnh, thành phố khác.',
              'Support surcharge: technicians who take urgent orders receive a surcharge (deducted directly from the Top-up wallet by the system). The surcharge varies by area: central Ho Chi Minh City and Hanoi have a lower surcharge than the suburbs and other provinces.',
            ),
          ],
          reviewNote: t(
            'Câu gốc chưa rõ phụ phí được cộng vào hay trừ khỏi ví Top-up. Vận hành và pháp chế làm rõ trước khi duyệt.',
            'The original wording does not make clear whether the surcharge is credited to or deducted from the Top-up wallet. Operations and legal to clarify before approval.',
          ),
        },
        {
          id: 'che-tai',
          title: t('3.3. Chế tài vi phạm và đền bù', '3.3. Violations and compensation'),
          blocks: [
            p(
              'Thợ bị áp dụng chế tài phạt hoặc đền bù theo khung chính sách hiện hành nếu vi phạm các tiêu chuẩn sau:',
              'Technicians are subject to penalties or compensation under the current policy framework if they breach the following standards:',
            ),
            list(
              t(
                'Vi phạm tiến độ, liên hệ: chậm liên hệ với khách trong ngày nhận đơn; Bluebolt không điều phối được thợ trong 36 giờ; thợ đến trễ hẹn 30–60 phút hoặc không đến thi công theo lịch hẹn.',
                'Schedule and contact: contacting the customer late on the day the order is received; Bluebolt unable to assign a technician within 36 hours; the technician arriving 30–60 minutes late or not showing up as scheduled.',
              ),
              t(
                'Vi phạm báo giá: cố tình báo giá sai so với bảng giá niêm yết chuẩn của Bluebolt.',
                "Pricing: deliberately quoting prices that differ from Bluebolt's standard published price list.",
              ),
              t(
                'Lỗi thi công: mức nhỏ (sai vị trí, chưa vệ sinh), trung bình (không chắc chắn, không an toàn) hoặc lớn (máy không hoạt động, lắp sai kỹ thuật).',
                'Workmanship: minor faults (wrong position, area not cleaned), moderate faults (insecure or unsafe) or major faults (appliance not working, incorrect installation).',
              ),
              t(
                'Thiệt hại tài sản: làm vỡ gạch, hỏng tường hoặc đồ đạc của khách thì thợ phải đền bù theo đúng giá trị tài sản thực tế.',
                "Property damage: if tiles, walls or the customer's belongings are damaged, the technician must compensate at the actual value of the property.",
              ),
            ),
          ],
          reviewNote: t(
            'Ý "Bluebolt không điều phối được thợ trong 36 giờ" nằm trong danh sách vi phạm của thợ ở bản gốc. Pháp chế xem lại vị trí ý này.',
            'The item "Bluebolt unable to assign a technician within 36 hours" sits in the list of technician violations in the original. Legal to review where it belongs.',
          ),
        },
      ],
    },
    {
      id: 'hang-nha-phan-phoi',
      title: t('Phần 4. Dành cho hãng và nhà phân phối', 'Part 4. For brands and distributors'),
      blocks: null,
      subsections: [
        {
          id: 'phan-dinh-trach-nhiem',
          title: t('4.1. Phân định trách nhiệm', '4.1. Allocation of responsibility'),
          blocks: [
            list(
              t(
                'Hãng, nhà sản xuất: chịu trách nhiệm xử lý các lỗi kỹ thuật, linh kiện của sản phẩm theo quy trình bảo hành của hãng.',
                "Brand or manufacturer: responsible for technical and component faults of the product, under the brand's warranty process.",
              ),
              t(
                'Bluebolt: chịu trách nhiệm trực tiếp khắc phục các lỗi do quá trình lắp đặt, sửa chữa của kỹ thuật viên Bluebolt.',
                'Bluebolt: directly responsible for fixing faults caused by installation or repair work done by Bluebolt technicians.',
              ),
            ),
          ],
        },
        {
          id: 'phoi-hop-xu-ly',
          title: t('4.2. Quy trình và thời gian phối hợp xử lý sự cố', '4.2. Incident handling process and timeframes'),
          blocks: [
            p('Thời gian thực hiện bảo hành: 08:00–17:00, thứ Hai đến thứ Sáu.', 'Warranty service hours: 08:00–17:00, Monday to Friday.'),
            p(
              'Khi có sự cố, bên đang có mặt tại hiện trường trực tiếp khắc phục dứt điểm cho khách hàng ngay khi xác nhận được nguyên nhân.',
              'When an incident occurs, whichever party is on site resolves it fully for the customer as soon as the cause is confirmed.',
            ),
            p(
              'Với lỗi lắp đặt, Bluebolt cam kết cử nhân viên đến xử lý theo khung thời gian:',
              'For installation faults, Bluebolt commits to sending staff within the following timeframes:',
            ),
            list(
              t(
                'Hà Nội và TP. Hồ Chí Minh: trong vòng 24 giờ làm việc (nội thành) và 36 giờ làm việc (ngoại thành).',
                'Hanoi and Ho Chi Minh City: within 24 business hours (inner city) and 36 business hours (suburbs).',
              ),
              t('Các tỉnh khác: trong vòng 36 giờ làm việc.', 'Other provinces: within 36 business hours.'),
            ),
            p(
              'Trường hợp ngoại lệ: nếu Bluebolt không thể sửa chữa trong thời gian cam kết và khách hàng yêu cầu xử lý ngay, hãng hoặc nhà phân phối có thể tự tiến hành sửa lỗi lắp đặt. Bluebolt chịu trách nhiệm hoàn trả chi phí khắc phục cho hãng theo thỏa thuận.',
              'Exceptions: if Bluebolt cannot complete the repair within the committed time and the customer requires immediate action, the brand or distributor may fix the installation fault itself. Bluebolt will reimburse the brand for the remediation cost as agreed.',
            ),
          ],
        },
      ],
    },
  ],
};

// ================================================================================================ Chính sách bảo mật (khung)
const privacy: LegalDoc = {
  key: 'privacy',
  status: 'draft',
  origin: 'outline',
  version: null,
  effectiveFrom: null,
  approvedBy: null,
  approvedAt: null,
  source:
    'Khung mục do agent dựng (chưa có nội dung). Pháp chế soạn theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và nghị định ' +
    'hướng dẫn (NFR-PDP-01, docs/04 mục 7.3). Điều kiện launch: phải có bản pháp chế duyệt.',
  sections: [
    {
      id: 'pham-vi-ap-dung',
      title: t('Phạm vi áp dụng', 'Scope'),
      blocks: null,
      reviewNote: t(
        'Website lapdattoanquoc.vn và các kênh hotline, email, Zalo; các form gửi thông tin khi được bật.',
        'The lapdattoanquoc.vn website and the hotline, email and Zalo channels, plus contact forms once they go live.',
      ),
    },
    {
      id: 'ben-kiem-soat',
      title: t('Bên kiểm soát dữ liệu', 'Data controller'),
      blocks: null,
      reviewNote: t(
        'Tên pháp nhân, mã số thuế, địa chỉ (content/site.ts) và đầu mối liên hệ về dữ liệu cá nhân.',
        'Registered company name, tax code and address (content/site.ts), plus the contact point for personal data.',
      ),
    },
    {
      id: 'du-lieu-xu-ly',
      title: t('Dữ liệu cá nhân được xử lý', 'Personal data we process'),
      blocks: null,
      reviewNote: t(
        'Theo từng form khi bật. Form doanh nghiệp: họ tên, công ty, chức vụ, số điện thoại, email công ty, ngành hàng, sản lượng, khu vực. Form thợ: họ tên, số di động, tỉnh/thành, kỹ năng chính. Dữ liệu kỹ thuật: địa chỉ IP đã băm, thông tin trình duyệt (contracts/lead-b2b.md, lead-technician.md).',
        'Per form, once live. Business form: name, company, job title, phone, work email, product category, volume, area. Technician form: name, mobile number, province, main skill. Technical data: hashed IP address, browser details (contracts/lead-b2b.md, lead-technician.md).',
      ),
    },
    {
      id: 'muc-dich',
      title: t('Mục đích và căn cứ xử lý', 'Purposes and legal basis'),
      blocks: null,
      reviewNote: t(
        'Mỗi mục đích có ô đồng ý riêng, không đánh dấu sẵn; lựa chọn không đồng ý ngang hàng với đồng ý (NFR-PDP-01).',
        'A separate consent box for each purpose, never pre-ticked; declining is as easy as agreeing (NFR-PDP-01).',
      ),
    },
    {
      id: 'thoi-han-luu-tru',
      title: t('Thời hạn lưu trữ', 'Retention period'),
      blocks: null,
      reviewNote: t('Theo contract lead (lead-b2b.md mục 2.2).', 'As set in the lead contract (lead-b2b.md section 2.2).'),
    },
    {
      id: 'chia-se',
      title: t('Chia sẻ dữ liệu và bên xử lý', 'Sharing and data processors'),
      blocks: null,
      reviewNote: t(
        'Liệt kê bên xử lý trước khi bật form: chống spam (Cloudflare Turnstile), dịch vụ gửi email, theo dõi lỗi (Sentry), đo lường truy cập (Umami tự host, nếu dùng).',
        'List processors before forms go live: spam protection (Cloudflare Turnstile), email delivery, error tracking (Sentry), analytics (self-hosted Umami, if used).',
      ),
    },
    {
      id: 'chuyen-ra-nuoc-ngoai',
      title: t('Chuyển dữ liệu ra nước ngoài', 'Cross-border transfers'),
      blocks: null,
      reviewNote: t(
        'Hồ sơ đánh giá tác động khi dùng dịch vụ có máy chủ đặt ở nước ngoài.',
        'Impact assessment file for any service whose servers are located abroad.',
      ),
    },
    {
      id: 'quyen-chu-the',
      title: t('Quyền của chủ thể dữ liệu', 'Your rights'),
      blocks: null,
      reviewNote: t(
        'Rút đồng ý, truy cập, chỉnh sửa, xóa dữ liệu; kênh tiếp nhận và thời hạn xử lý theo luật.',
        'Withdrawing consent, access, correction and deletion; how to submit a request and the statutory response time.',
      ),
    },
    {
      id: 'bao-ve-du-lieu',
      title: t('Biện pháp bảo vệ dữ liệu', 'How we protect data'),
      blocks: null,
      reviewNote: t('Biện pháp kỹ thuật và tổ chức đang áp dụng.', 'Technical and organizational measures in place.'),
    },
    {
      id: 'cookie',
      title: t('Cookie và công cụ đo lường', 'Cookies and analytics'),
      blocks: null,
      reviewNote: t(
        'Website hiện không đặt cookie theo dõi; công cụ đo lường dự kiến (Umami tự host) không dùng cookie.',
        'The website currently sets no tracking cookies; the planned analytics tool (self-hosted Umami) is cookieless.',
      ),
    },
    {
      id: 'lien-he',
      title: t('Liên hệ về dữ liệu cá nhân', 'Contact for personal data'),
      blocks: null,
      reviewNote: t('Kênh liên hệ riêng cho yêu cầu về dữ liệu cá nhân.', 'A dedicated channel for personal data requests.'),
    },
    {
      id: 'cap-nhat',
      title: t('Cập nhật chính sách', 'Changes to this policy'),
      blocks: null,
      reviewNote: t(
        'Số phiên bản, ngày hiệu lực và cách thông báo khi thay đổi.',
        'Version number, effective date and how changes are announced.',
      ),
    },
  ],
};

// ================================================================================================ Điều khoản sử dụng (khung)
const terms: LegalDoc = {
  key: 'terms',
  status: 'draft',
  origin: 'outline',
  version: null,
  effectiveFrom: null,
  approvedBy: null,
  approvedAt: null,
  source: 'Khung mục do agent dựng (chưa có nội dung). Pháp chế soạn và duyệt.',
  sections: [
    {
      id: 'gioi-thieu',
      title: t('Giới thiệu và phạm vi', 'Introduction and scope'),
      blocks: null,
      reviewNote: t(
        'Website do pháp nhân trong content/site.ts vận hành; áp dụng cho mọi người dùng website.',
        'The website is operated by the legal entity in content/site.ts; the terms apply to every website user.',
      ),
    },
    {
      id: 'chap-nhan',
      title: t('Chấp nhận điều khoản', 'Acceptance of terms'),
      blocks: null,
      reviewNote: t('Cách người dùng chấp nhận điều khoản khi dùng website.', 'How users accept the terms by using the website.'),
    },
    {
      id: 'dich-vu',
      title: t('Dịch vụ Bluebolt cung cấp', 'Services Bluebolt provides'),
      blocks: null,
      reviewNote: t(
        'Website giới thiệu dịch vụ cho doanh nghiệp và tuyển thợ; không nhận đặt dịch vụ trực tiếp của khách lẻ (giả định nhánh A, D-02). Bảo hành theo /chinh-sach-bao-hanh.',
        'The website presents services for businesses and recruits technicians; it does not take direct bookings from consumers (branch A assumption, D-02). Warranty terms live on the warranty policy page.',
      ),
    },
    {
      id: 'thong-tin-website',
      title: t('Thông tin trên website', 'Information on the website'),
      blocks: null,
      reviewNote: t(
        'Bảng giá vật tư chỉ để tham khảo (Bluebolt không bán vật tư); số liệu có định nghĩa và ngày cập nhật; ảnh minh họa có nhãn.',
        'The materials price list is for reference only (Bluebolt does not sell materials); figures carry a definition and update date; illustrations are labeled.',
      ),
    },
    {
      id: 'so-huu-tri-tue',
      title: t('Quyền sở hữu trí tuệ', 'Intellectual property'),
      blocks: null,
      reviewNote: t(
        'Logo, nội dung, hình ảnh của Bluebolt; logo hãng chỉ dùng khi có văn bản đồng ý.',
        "Bluebolt's logo, content and images; brand logos are used only with written permission.",
      ),
    },
    {
      id: 'hanh-vi-cam',
      title: t('Hành vi bị cấm', 'Prohibited conduct'),
      blocks: null,
      reviewNote: t(
        'Ví dụ: gửi thông tin giả mạo, spam form, thu thập dữ liệu tự động trái phép.',
        'For example: submitting false information, spamming forms, unauthorized automated scraping.',
      ),
    },
    {
      id: 'lien-ket-ngoai',
      title: t('Liên kết tới website khác', 'Links to other websites'),
      blocks: null,
      reviewNote: t('Liên kết Google Maps, Zalo và các website bên thứ ba.', 'Links to Google Maps, Zalo and other third-party websites.'),
    },
    {
      id: 'gioi-han-trach-nhiem',
      title: t('Giới hạn trách nhiệm', 'Limitation of liability'),
      blocks: null,
      reviewNote: t(
        'Đối chiếu chính sách cũ Phần 1, Điều khoản 3 (giới hạn trách nhiệm, bất khả kháng) ở trang Chính sách bảo hành.',
        'Check against Part 1, Clause 3 of the old policy (liability limits, force majeure) on the warranty policy page.',
      ),
    },
    {
      id: 'luat-ap-dung',
      title: t('Luật áp dụng và giải quyết tranh chấp', 'Governing law and disputes'),
      blocks: null,
      reviewNote: t('Luật Việt Nam; cơ quan giải quyết tranh chấp.', 'Vietnamese law; the body that resolves disputes.'),
    },
    {
      id: 'lien-he',
      title: t('Liên hệ', 'Contact'),
      blocks: null,
      reviewNote: t('Hotline, email và địa chỉ trong content/site.ts.', 'Hotline, email and address from content/site.ts.'),
    },
    {
      id: 'hieu-luc',
      title: t('Hiệu lực và sửa đổi', 'Effective date and changes'),
      blocks: null,
      reviewNote: t(
        'Số phiên bản, ngày hiệu lực, cách thông báo sửa đổi.',
        'Version number, effective date and how changes are announced.',
      ),
    },
  ],
};

export const legalDocs: Record<LegalDocKey, LegalDoc> = { privacy, terms, warranty };
