# Contract: lead-technician — Form "Đăng ký làm đối tác thợ" (4 trường)

## STATUS: APPROVED — anh Duy duyệt 03/10/2026

> Anh duyệt qua chat ("duyệt 2 hạng mục kia", xem `docs/DECISIONS.md` D-26) và nhận mọi đề xuất mặc định ở Phụ lục A của file này và của `lead-b2b.md`.
> Còn mở, nhưng không chặn việc build:
> - **D-02:** hai địa chỉ email nhận, khai bằng biến môi trường lúc deploy.
> - **PC-01…05:** câu chữ đồng ý. Bản nháp nằm trong `content/consent.ts` và chưa có `approvedBy`, nên production tự tắt form theo AC-C10.
>
> Điều kiện bật form trên production: `docs/SRS-LEADS.md` mục 10.

| | |
|---|---|
| Ngày | 02/10/2026 · Phiên bản 0.1 · Soạn: api-designer agent |
| Căn cứ | `04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md` mục 2.3, 2.5, 7.3 · `03-DINH-HUONG-THIET-KE-3D.md` mục 1.2, 10.1, 13.1, 13.5 (`/doi-tac-tho`), 14.1 (lộ trình gia nhập 4 bước) |
| Contract cặp | `contracts/lead-b2b.md` — **chứa PHẦN CHUNG** (endpoint, bảng `leads` + `lead_notifications`, mã lỗi, chống spam, dữ liệu cá nhân, thông báo, log, openresty). File này chỉ ghi phần riêng của form thợ và tham chiếu phần chung theo số mục. **Hai contract duyệt cùng lúc.** SRS: `docs/SRS-LEADS.md` |

Ký hiệu như `lead-b2b.md`: **[D-xx]** chờ anh Duy, **[PC-xx]** chờ pháp chế, **(đề xuất)**, **chưa kiểm chứng**.

---

## SECTION 1: User Story & Acceptance Criteria

```
AS A   thợ kỹ thuật điện lạnh/điện máy (thường mở link từ Zalo hoặc Facebook trên điện thoại)
I WANT TO đăng ký làm đối tác Bluebolt bằng đúng 4 thông tin, trong dưới 30 giây
SO THAT bộ phận tuyển thợ gọi lại hướng dẫn lộ trình gia nhập (Đăng ký → E-KYC → Đào tạo → Nhận đơn),
        còn Bluebolt không mất lead thợ như form cũ ở /system-map và chỉ thu dữ liệu tối thiểu
```

Nơi đặt form: **một form duy nhất** ở `/doi-tac-tho#dang-ky` (EN: `/en/technician-partners#register`), cuối trang, sau FAQ, cạnh link tải app (nếu `content/` có link đã duyệt). Các lối vào dẫn tới anchor này: CTA phụ "Đăng ký làm đối tác thợ" ở shot 0 trang chủ, card "Thợ kỹ thuật" trong "Ba cửa vào", nút phải của thanh dính đáy mobile trên `/doi-tac-tho` ("Đăng ký thợ", `03` mục 13.1), redirect từ `/requirement`, `/worker-map`.

**AC chung:** AC-C1 → AC-C12 ở `lead-b2b.md` mục 1 áp dụng nguyên văn với `type='lead_technician'`, đích thông báo `technician_hr`, và `lead_submit` không có thuộc tính `intent`.

**AC riêng:**

| AC | Given | When | Then |
|---|---|---|---|
| AC-T1 | Mở `/doi-tac-tho` | Đếm ô nhập liệu nhìn thấy được trong form | **Đúng 4**: Họ và tên, Số di động, Tỉnh/thành, Kỹ năng chính. Ngoài ra chỉ có checkbox đồng ý, vùng Turnstile và nút Gửi. Không có email, ngày sinh, địa chỉ, CCCD, ảnh |
| AC-T2 | Dữ liệu hợp lệ, tick mục đích bắt buộc, Turnstile qua | Bấm "Đăng ký" | 201. `leads.type='lead_technician'`, `payload` đúng shape mục 2. `lead_notifications` có dòng `target='technician_hr'` (không có dòng `b2b_sales`) |
| AC-T3 | SĐT `abc` | Rời ô / bấm Đăng ký | FE báo lỗi inline. Gọi thẳng API → **400 `VALIDATION_ERROR`**, `details[0] = {field:"fields.phone", code:"invalid_phone"}`, không ghi DB |
| AC-T4 | Không chọn tỉnh, hoặc gửi mã tỉnh lạ, hoặc gửi mảng nhiều tỉnh | Gửi | 400 (`required` / `invalid_option` / `invalid_format`) ở `fields.province` |
| AC-T5 | Chọn "Khác" ở kỹ năng chính | Gửi | Hợp lệ, `primarySkill='other'`. Không có ô chữ tự do đi kèm |
| AC-T6 | Gửi thêm trường ngoài 4 trường (`email`, `dateOfBirth`, `address`, `idNumber`…) | POST | **400 `unknown_field`**, không ghi DB. Đây là cách server giữ "đúng 4 trường" |
| AC-T7 | Điện thoại 360–414 px, kể cả trình duyệt trong app Zalo và Facebook | Điền và gửi | Chữ trong ô ≥ 16 px (iOS không tự phóng to); SĐT có `type="tel"`, `inputmode="tel"`, `autocomplete="tel"`; họ tên `autocomplete="name"`; tỉnh và kỹ năng là `<select>` gốc; nút Gửi không bị thanh dính đáy che; Turnstile chạy được trong webview Zalo/Facebook (**chưa kiểm chứng**, có ca test riêng) |
| AC-T8 | Gửi thành công | Màn hình cảm ơn | Mã tham chiếu; câu "Bộ phận tuyển thợ sẽ gọi lại trong [SLA]" (đọc `content/sla.ts`, chưa duyệt thì ẩn ở production) [D-12]; 4 bước lộ trình gia nhập (đọc `content/process.ts`); link tải app chỉ khi `content/` có link đã duyệt; số hotline |
| AC-T9 | Trên `/doi-tac-tho` mobile | Bấm "Đăng ký thợ" ở thanh dính đáy | Cuộn tới form và focus ô "Họ và tên" (không dùng `scrollIntoView` mượt khi reduced-motion) |

**OUT OF SCOPE (explicit):**
- Mọi thứ đã liệt kê ở `lead-b2b.md` mục 1 (trang quản trị lead, CMS, `/tra-cuu`, booking B2C, bảo hành, chống trùng theo SĐT, tự trả lời người gửi).
- Hồ sơ ứng tuyển đầy đủ của modal cũ (ngày sinh, email, địa chỉ tạm trú, nhiều khu vực, nhiều dịch vụ, người giới thiệu, giới thiệu bản thân). E-KYC và hồ sơ chi tiết diễn ra **trong app thợ**, ngoài website.
- Danh sách việc đang tuyển (`#viec-dang-tuyen`) và nút "ứng tuyển" theo từng tin: là nội dung tĩnh trỏ về form này, không có form riêng cho từng tin.
- Hỗ trợ thợ đang là đối tác (đổi tỉnh, khiếu nại thanh toán): dẫn sang hotline/Zalo.
- Chọn nhiều tỉnh, nhiều kỹ năng (bộ phận tuyển thợ hỏi khi gọi lại).

---

## SECTION 2: Database Schema (ERD diff)

**Không có thay đổi schema riêng.** Dùng bảng `leads` và `lead_notifications`, migration `db/migrations/YYYYMMDDHHMMSS-create-leads.ts` định nghĩa ở `lead-b2b.md` mục 2 (CHECK `type` đã gồm `'lead_technician'`). Không có migration thứ hai.

Shape của `payload` khi `type = 'lead_technician'` (`payload_version = 1`):

```json
{
  "fullName": "Trần Văn Bình",
  "phone": "+84912345678",        // luôn E.164
  "province": "79",               // đúng 1 mã trong content/provinces.ts
  "primarySkill": "air_conditioner"
}
```

`meta` của lead thợ không có `emailFreeDomain`. Sao lưu, thời hạn lưu: như `lead-b2b.md` mục 2.2.

---

## SECTION 3: API Contract

Endpoint, header, rate-limit, thứ tự xử lý, response 201, envelope lỗi, bảng mã lỗi, `/api/contact`, outbox, kênh thông báo, openresty, biến môi trường: **như `lead-b2b.md` mục 3.1 → 3.9.** Phần dưới chỉ là khác biệt.

```
POST /api/v1/leads        (type = 'lead_technician')
Auth: KHÔNG (công khai)   |  Roles: công khai — chỉ tạo
Rate limit: 5 request / 10 phút / IP, tính chung với mọi type (lead-b2b.md mục 3.8 + bước 4)
```

**REQUEST BODY:** khung chung ở `lead-b2b.md` mục 3.1. `fields` khi `type = 'lead_technician'` — **đúng 4 khóa, strict**:

| Field | Type | Required | Validation (sau chuẩn hóa) | Nhãn VI / EN · Mô tả |
|---|---|---|---|---|
| `fullName` | string | Có | Như `fullName` của B2B: NFC, gộp khoảng trắng, 2–100 ký tự, `^[\p{L}\p{M}][\p{L}\p{M} .'\-]*$` (u) | "Họ và tên" / "Full name" |
| `phone` | string | Có | Bỏ `[\s.\-()]` → `^(0\|\+84)(3\|5\|7\|8\|9)\d{8}$` → lưu E.164 | "Số di động (Zalo)" / "Mobile number (Zalo)". Gợi ý "0912 345 678" |
| `province` | string | Có | Đúng 1 mã trong `content/provinces.ts` (34 tỉnh/thành). Mảng → 400 | "Tỉnh/thành nhận việc chính" / "Main working province" |
| `primarySkill` | enum | Có | Một trong 8 mã dưới [D-08] | "Kỹ năng chính" / "Main skill" |

Danh sách kỹ năng chính **(đề xuất, gom từ 14 lựa chọn của modal ứng tuyển cũ và 4 nhóm dịch vụ ở `03` mục 13.4 P4; vận hành thợ xác nhận)**:

| Mã | Nhãn VI | Nhãn EN |
|---|---|---|
| `air_conditioner` | Điều hòa / máy lạnh (lắp, tháo, bảo dưỡng) | Air conditioners |
| `washer_dryer` | Máy giặt, máy sấy | Washers and dryers |
| `tv_mounting` | Treo TV | TV mounting |
| `water_appliances` | Máy lọc nước, máy nước nóng, bồn cầu thông minh | Water appliances |
| `kitchen_appliances` | Bếp, máy hút mùi, máy rửa bát | Kitchen appliances |
| `electrical_plumbing` | Điện, nước dân dụng | Electrical and plumbing |
| `robot_vacuum` | Robot hút bụi | Robot vacuums |
| `other` | Khác | Other |

**Zod (đặc tả, dùng chung helper với `lead-b2b.md`):**

```ts
export const PRIMARY_SKILLS = ['air_conditioner', 'washer_dryer', 'tv_mounting', 'water_appliances',
  'kitchen_appliances', 'electrical_plumbing', 'robot_vacuum', 'other'] as const;   // nguồn: content/skills.ts

export const LeadTechnicianFields = z.object({
  fullName: personName,
  phone: phoneVN,
  province: provinceCode,
  primarySkill: z.enum(PRIMARY_SKILLS),
}).strict();   // khóa thứ 5 → 400 unknown_field
```

**RESPONSE 201:** như `lead-b2b.md` mục 3.1, `data.type = 'lead_technician'`.

**RESPONSE 4xx/5xx:** bảng mã lỗi `lead-b2b.md` mục 3.1. Áp dụng: `INVALID_JSON`, `VALIDATION_ERROR`, `FORBIDDEN_ORIGIN`, `CAPTCHA_FAILED`, `CONSENT_VERSION_OUTDATED`, `PAYLOAD_TOO_LARGE`, `CONSENT_REQUIRED`, `RATE_LIMITED`, `INTERNAL_ERROR`, `LEADS_DISABLED`. **Không áp dụng:** `EMAIL_DOMAIN_NOT_ALLOWED` (form không có email).

**Mục đích đồng ý (đề xuất, chờ PC-02):** bắt buộc `tech_partner_contact` (liên hệ tư vấn gia nhập, hướng dẫn E-KYC, đào tạo, tải app); tùy chọn `tech_job_alerts` (gọi/nhắn Zalo khi có việc mới ở tỉnh đã chọn). Câu chữ do pháp chế viết [PC-01], nằm trong `content/consent.ts` theo Rule 2 của `lead-b2b.md`.

**SIDE EFFECTS:** như `lead-b2b.md` mục 3.4, với khác biệt:
- Dòng `lead_notifications` có `target='technician_hr'`.
- Thông báo theo kênh (a): tiêu đề `[Đối tác thợ] 7C1D2E3F · Điều hòa · TP. Hồ Chí Minh` (chỉ mã tham chiếu, kỹ năng, tỉnh). Thân: họ tên, SĐT dạng `0912 345 678` (link `tel:` và link Zalo `https://zalo.me/<số>` nếu bộ phận tuyển thợ muốn — [D-19]), tỉnh, kỹ năng, mục đích đã đồng ý + version + giờ, `utm`, `page_path`, cờ captcha, `id`, `reference`. **Không có `Reply-To`.**
- Không gửi gì cho thợ (không SMS/Zalo tự động).

**Analytics:** `lead_submit{type:'lead_technician', locale, filmTier}`, `lead_error{type:'lead_technician', code}` (`lead-b2b.md` mục 3.7).

---

## SECTION 4: RBAC Map

Như `lead-b2b.md` mục 4. Khác biệt về phạm vi dữ liệu:

| Hành động | Khách truy cập | Hệ thống | Kinh doanh B2B | Tuyển thợ | Quản trị kỹ thuật | Anh Duy |
|---|---|---|---|---|---|---|
| Tạo lead thợ | Có | — | Có (như khách) | Có (như khách) | Có (như khách) | Có (như khách) |
| Nhận chi tiết lead thợ qua kênh thông báo | Không | Gửi | **Không** | **Có** | Không (trừ khi được thêm vào kênh) | Theo cấu hình kênh |
| Xem/sửa lead qua web/API | Không | — | Không | Không | Không | Không |
| Truy vấn DB, xuất/xóa theo yêu cầu chủ thể dữ liệu | Không | — | Không | Chuyển yêu cầu | `bb_ops` qua script | Duyệt khi pháp chế yêu cầu |

---

## SECTION 5: Business Rules & Edge Cases

```
RULE T1: Đúng 4 trường
  - FE chỉ render 4 ô; server strict, khóa thứ 5 → 400. Thêm trường = CR + sửa contract, không thêm tay.

RULE T2: Tối thiểu hóa dữ liệu so với modal cũ
  - Không thu ngày sinh, email, địa chỉ, CCCD, ảnh. E-KYC làm trong app thợ, ngoài phạm vi website.

RULE T3: Một tỉnh, một kỹ năng chính
  - Thợ làm nhiều tỉnh/nhiều kỹ năng: bộ phận tuyển thợ hỏi khi gọi lại.

RULE T4: Định tuyến
  - Chỉ tới đích 'technician_hr'. Kinh doanh B2B không nhận lead thợ.

RULE T5: Không hứa điều chưa duyệt
  - Màn hình cảm ơn và phần chữ quanh form chỉ đọc từ content/sla.ts, content/process.ts, content/claims.ts.
    Thu nhập, phí nền tảng, "không thu phí đăng ký"… chỉ hiện khi đã có approvedBy.

Các rule chung: lead-b2b.md mục 5, Rule 1 → 11.
```

**EDGE CASES riêng:**

| Tình huống | Xử lý |
|---|---|
| Mở link từ Zalo/Facebook (trình duyệt trong app) | Ca test riêng trên R-AND và R-IOS. Nếu Turnstile không chạy trong webview: FE hiện nút "Mở bằng trình duyệt" + hotline/Zalo, không im lặng |
| Nhiều thợ cùng một nhà mạng 4G hoặc cùng wifi buổi tuyển (chung IP) | Có thể chạm 5/10 phút → 429 có hotline. Theo dõi tỉ lệ 429 của `lead_technician`, chỉnh qua [D-14] |
| Khách lẻ nhầm form thợ để gọi thợ sửa | Tiêu đề form ghi rõ "dành cho thợ kỹ thuật"; dòng phụ "Bạn cần thợ lắp đặt? Gọi 0902 808 049" |
| Thợ đăng ký 2 lần | 2 lead (chống trùng theo SĐT ngoài phạm vi). Mã tham chiếu giúp bộ phận tuyển thợ gộp tay |
| SĐT không dùng Zalo | Hợp lệ; nhãn "(Zalo)" chỉ là gợi ý, không kiểm |
| Thợ ở tỉnh chưa có thợ Bluebolt | Vẫn nhận; không hiện thông báo "tỉnh chưa hỗ trợ" (chưa có số thợ theo tỉnh được duyệt) |

---

## SECTION 6: Security Requirements

Như `lead-b2b.md` mục 6.1 → 6.7. Bổ sung cho form thợ:
- [ ] Không có email trong form nên không có `Reply-To`, không có kiểm tên miền email.
- [ ] Log và Sentry: thêm `province` và `primarySkill` vào danh sách **được phép** log (không định danh một người); họ tên, SĐT vẫn cấm.
- [ ] Thông báo qua kênh (c) Lark/Zalo OA (nếu chọn): chỉ `reference`, kỹ năng, tỉnh.
- [ ] Mục đích `tech_job_alerts` tùy chọn: nếu thợ không đồng ý thì bộ phận tuyển thợ không được dùng SĐT để báo việc mới ngoài lần gọi lại cho đăng ký này. Email thông báo phải hiện rõ "Không đồng ý nhận tin việc mới".
- [ ] Không còn đường thu dữ liệu nào ở `/system-map`, `/requirement`, `/worker-map` sau cutover (301 sang trang mới; form cũ chết đã gỡ ở G0).

---

## SECTION 7: Test Checklist

Chạy toàn bộ checklist ở `lead-b2b.md` mục 7 với `type='lead_technician'` (trừ ca email, `intent`, `provinces` nhiều phần tử). Bổ sung:

**HAPPY PATH**
- [ ] AC-T1: Playwright đếm ô nhập liệu nhìn thấy được trong `#dang-ky` = 4 (VI) và trong `#register` (EN) = 4.
- [ ] AC-T2: gửi hợp lệ → 201; `payload` đúng 4 khóa; chỉ có dòng thông báo `technician_hr`; SMTP giả lập: hộp thư tuyển thợ nhận, hộp thư B2B không nhận.
- [ ] AC-T5: `other` hợp lệ. AC-T8: màn hình cảm ơn có mã tham chiếu, 4 bước lộ trình; câu SLA ẩn ở production khi chưa duyệt, hiện nhãn "Nháp" ở `DRAFT_PREVIEW`.

**VALIDATION**
- [ ] AC-T3: SĐT `abc` → FE chặn; API 400 `invalid_phone`; DB không đổi.
- [ ] AC-T4: thiếu tỉnh → 400 `required`; mã `99` → 400 `invalid_option`; `["79","01"]` → 400.
- [ ] AC-T6: thêm lần lượt `email`, `dateOfBirth`, `address`, `idNumber` → 400 `unknown_field`, DB không đổi.
- [ ] `primarySkill='plumbing_pro'` → 400 `invalid_option`.

**MOBILE / THỰC TẾ**
- [ ] AC-T7 trên R-AND (Chrome + webview Zalo + webview Facebook) và R-IOS (Safari + webview Zalo): điền, gửi, nhận 201; ô không bị zoom; nút Gửi không bị thanh dính đáy che; bàn phím số khi nhập SĐT.
- [ ] AC-T9: nút "Đăng ký thợ" ở thanh dính đáy → focus "Họ và tên"; reduced-motion không cuộn mượt.
- [ ] Đo thời gian điền của 3 người thật (không phải dev) trên R-AND: mục tiêu < 30 giây/lần (theo user story; số đo ghi vào báo cáo QA, không chặn BBNT).

**BẢO MẬT / LOG**
- [ ] AC-C8 với giá trị đánh dấu của form thợ: 0 kết quả trong log/Sentry; `province`, `primarySkill` được phép xuất hiện.
- [ ] Đồng ý bắt buộc thiếu → 422; chỉ đồng ý bắt buộc, không đồng ý `tech_job_alerts` → 201 và email thông báo hiện "Không đồng ý nhận tin việc mới".

**REGRESSION**
- [ ] `/requirement`, `/worker-map`, `/en/requirement`, `/en/worker-map` → 301 một hop tới `/doi-tac-tho` / `/en/technician-partners` (NFR-SEO-01), anchor form hoạt động.
- [ ] Form B2B vẫn pass toàn bộ checklist của nó (dùng chung endpoint và schema).
- [ ] Cutover: gửi 1 lead thợ thử tên `TEST CUTOVER`, xác nhận tới hộp thư tuyển thợ, rồi xóa bằng `leads-dsr.mjs erase`.

---

## Phụ lục A: Điểm chờ quyết định (riêng form thợ)

| Mã | Câu hỏi | Đề xuất mặc định | Ai |
|---|---|---|---|
| D-08 | Danh sách 8 kỹ năng chính (bảng mục 3) | Như bảng | Vận hành thợ / tuyển thợ |
| D-12 | Thời gian bộ phận tuyển thợ gọi lại hiện ở màn hình cảm ơn | — (placeholder `content/sla.ts`) | Anh Duy |
| D-18 | Một tỉnh hay nhiều tỉnh | Một tỉnh (đúng "4 trường") | Anh Duy |
| D-19 | Email thông báo có link `zalo.me/<số>` để tuyển thợ nhắn nhanh? | Có | Tuyển thợ |
| PC-02 | Mục đích `tech_partner_contact` (bắt buộc) và `tech_job_alerts` (tùy chọn) | Như đề xuất | Pháp chế |

Các điểm chung (D-01 kênh thông báo, D-02 địa chỉ nhận, D-09, D-10, D-11, D-14, D-17, PC-01 → PC-05): `lead-b2b.md` Phụ lục A.
