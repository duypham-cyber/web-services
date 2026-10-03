# Contract: lead-b2b — Form "Nhận báo giá / Đặt lịch demo 30 phút"

## STATUS: APPROVED — anh Duy duyệt 03/10/2026

> Anh duyệt qua chat ("duyệt 2 hạng mục kia", xem `docs/DECISIONS.md` D-26) và nhận mọi đề xuất mặc định ở Phụ lục A.
> Còn mở, nhưng không chặn việc build:
> - **D-02:** hai địa chỉ email nhận, khai bằng biến môi trường lúc deploy.
> - **PC-01…05:** câu chữ đồng ý. Bản nháp nằm trong `content/consent.ts` và chưa có `approvedBy`, nên production tự tắt form theo AC-C10.
>
> Điều kiện bật form trên production: `docs/SRS-LEADS.md` mục 10.

| | |
|---|---|
| Ngày | 02/10/2026 · Phiên bản 0.1 · Soạn: api-designer agent |
| Dự án | Website Bluebolt Services (CTCP Công nghệ Tia Chớp Xanh), repo `bluebolt-web`, thay lapdattoanquoc.vn |
| Căn cứ | `04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md` mục 2.3, 2.5, 2.7, 7.3 (NFR-SEC-04, NFR-SEC-06, NFR-PDP-01, NFR-AVAIL-02) · `03-DINH-HUONG-THIET-KE-3D.md` mục 1.2, 13.4 (P8), 13.5 · `rules/api.md`, `rules/logging.md` |
| Contract cặp | `contracts/lead-technician.md` (form đối tác thợ). SRS: `docs/SRS-LEADS.md` |
| Quyết định đã có | Phim A+ (02/10/2026). B2C nhánh A. Nội dung là code (`content/*.ts` + Zod). Analytics Umami. Claim/số liệu chưa duyệt không hiện ở production (bản xem trước có cờ `DRAFT_PREVIEW` + nhãn "Nháp") |

**Phạm vi file này.** File này gồm phần riêng của form B2B **và PHẦN CHUNG** cho mọi loại lead: endpoint `POST /api/v1/leads`, bảng `leads` + `lead_notifications`, chống spam, dữ liệu cá nhân, thông báo, log. `lead-technician.md` tham chiếu phần chung ở đây, không chép lại. **Hai contract phải được duyệt cùng lúc**, vì `/dev` (prompt P7 ở `04` mục 6.3) cần cả hai ở trạng thái APPROVED.

Ký hiệu: **[D-xx]** = điểm chờ anh Duy quyết (Phụ lục A). **[PC-xx]** = chờ pháp chế. **(đề xuất)** = mặc định em đề xuất, chưa được duyệt. **Chưa kiểm chứng** = chưa tra hoặc chưa chạy thử.

---

## SECTION 1: User Story & Acceptance Criteria

```
AS A   người đại diện Hãng điện máy, Sàn TMĐT hoặc Chuỗi bán lẻ
I WANT TO để lại thông tin liên hệ và nhu cầu lắp đặt (sản lượng, tỉnh triển khai) trong dưới 1 phút
SO THAT Bluebolt gọi lại báo giá hoặc chốt lịch demo 30 phút, còn Bluebolt có lead B2B
        đủ thông tin để phân loại, không mất lead và thu thập dữ liệu đúng Luật BVDLCN 91/2025
```

Nơi đặt form (chi tiết ở `docs/SRS-LEADS.md` mục 4): khối CTA cuối trang chủ (P8, `03` mục 13.4), `/giai-phap/hang-dien-may`, `/giai-phap/san-tmdt-ban-le` ("Thảo luận tích hợp"), `/bang-gia` (giá theo hợp đồng), cùng bản EN. Mỗi trang chỉ một khối form B2B.

**AC chung cho mọi loại lead** (form thợ dùng lại, đổi `type`):

| AC | Given | When | Then |
|---|---|---|---|
| AC-C1 | Form đang bật, Turnstile qua, dữ liệu hợp lệ, đã tick mục đích bắt buộc | Bấm "Gửi" | API trả **201** với `data.id` (UUID) và `data.reference` (8 ký tự hex in hoa). Bảng `leads` có đúng 1 dòng mới, `status='new'`, `consent_version`/`consent_at`/`consent_purposes` đủ, `ip_hash` là 64 ký tự hex, **không cột nào chứa IP thô**. `lead_notifications` có ≥ 1 dòng của lead đó. Form được thay tại chỗ bằng màn hình cảm ơn có mã tham chiếu |
| AC-C2 | Checkbox đồng ý vừa render (HTML server và sau hydrate) | Kiểm DOM | Mọi checkbox mục đích **không tick sẵn**. Có link `/chinh-sach-bao-mat` (EN: `/en/privacy-policy`) |
| AC-C3 | Chưa tick mục đích bắt buộc | Bấm "Gửi" | FE báo lỗi ngay tại checkbox, không gửi request. Gửi thẳng API thiếu mục đích bắt buộc → **422 `CONSENT_REQUIRED`**, không ghi DB |
| AC-C4 | Ô honeypot `hp` có giá trị | POST | **201 giả** (cùng shape, UUID ngẫu nhiên). Không ghi DB, không gửi thông báo. Log có sự kiện `lead_honeypot` kèm `correlationId` |
| AC-C5 | Cùng một IP đã gửi 5 request vào endpoint trong 10 phút | Request thứ 6 | **429 `RATE_LIMITED`**, header `Retry-After` (giây). FE hiện thông báo kèm hotline/Zalo, giữ nguyên dữ liệu đã nhập |
| AC-C6 | Token Turnstile thiếu, sai, hết hạn (300 s) hoặc đã dùng | POST | **403 `CAPTCHA_FAILED`**. FE gọi `turnstile.reset()`, giữ dữ liệu đã nhập |
| AC-C7 | Kênh thông báo đang lỗi (SMTP sập, CRM không phản hồi…) | POST hợp lệ | Vẫn **201**. Lead nằm trong DB. Dòng `lead_notifications` được thử lại theo lịch (mục 3.5). Khi kênh hoạt động lại, thông báo được gửi. Hai tiến trình retry chạy song song không gửi trùng (trừ trường hợp sập giữa chừng, xem R7) |
| AC-C8 | Chạy toàn bộ test e2e với giá trị đánh dấu (tên, SĐT, email, công ty, ghi chú) | Grep log ứng dụng + payload gửi Sentry | **0** lần xuất hiện các giá trị đánh dấu và IP thô |
| AC-C9 | Client gửi lại với cùng header `Idempotency-Key` (mạng rớt sau khi server đã ghi) | POST lần 2 | **201** cùng `data.id`, header `Idempotent-Replayed: true`, không thêm dòng DB, không thêm thông báo |
| AC-C10 | `LEADS_FORM_ENABLED=false`, hoặc câu chữ đồng ý của `type` còn placeholder/chưa có `approvedBy` | Mở trang / POST | Ở production: form không render, thay bằng khối Gọi · Zalo · email bộ phận. API trả **503 `LEADS_DISABLED`**. Ở bản `DRAFT_PREVIEW`: form hiện với nhãn "Nháp", câu đồng ý hiện placeholder |
| AC-C11 | Trang `/en/...` | Gửi form | Nhãn, lỗi, màn hình cảm ơn bằng tiếng Anh, không chuỗi tiếng Việt. DB lưu cùng mã (enum, mã tỉnh), `locale='en'` |
| AC-C12 | Gửi thành công / thất bại | — | Umami nhận `lead_submit{type, intent?}` chỉ khi 201 thật; nhận `lead_error{type, code}` khi lỗi. Không thuộc tính nào chứa dữ liệu cá nhân |

**AC riêng cho B2B:**

| AC | Given | When | Then |
|---|---|---|---|
| AC-B1 | Bấm CTA "Nhận báo giá" | Mở form, gửi hợp lệ | `payload.intent='quote'`. Cảm ơn: "[Bộ phận kinh doanh] sẽ gọi lại trong [SLA]" |
| AC-B2 | Bấm CTA "Đặt lịch demo 30 phút" | Mở cùng form, tiêu đề "Đặt lịch demo 30 phút" | `payload.intent='demo'`. Cảm ơn: "Bluebolt sẽ gọi để chốt lịch demo 30 phút". Không có lịch chọn giờ |
| AC-B3 | Form trên `/giai-phap/san-tmdt-ban-le` | Gửi hợp lệ | `payload.intent='integration'` **[D-15]** |
| AC-B4 | SĐT nhập `abc` | Rời ô / bấm Gửi | FE báo lỗi inline "Số di động chưa đúng định dạng". Gửi thẳng API → **400 `VALIDATION_ERROR`**, `details[0] = {field:"fields.phone", code:"invalid_phone"}`, không ghi DB |
| AC-B5 | SĐT `0902 808 049`, `0902.808.049`, `+84 902 808 049` | Gửi | Chấp nhận, lưu chuẩn E.164 `+84902808049`. Email thông báo hiện `0902 808 049` |
| AC-B6 | SĐT bàn `028 3xxx xxxx` | Gửi | 400 `invalid_phone` (regex chỉ nhận di động) **[D-04]** |
| AC-B7 | Email sai định dạng | Gửi | 400 `{field:"fields.workEmail", code:"invalid_email"}` |
| AC-B8 | Email `@gmail.com` | Gửi | Theo [D-03]. Đề xuất: nhận, lưu `meta.emailFreeDomain=true`, email thông báo gắn nhãn "Email cá nhân" |
| AC-B9 | Chọn "Toàn quốc" ở ô tỉnh | Gửi | Gửi đủ 34 mã tỉnh. Email thông báo ghi "Toàn quốc (34/34)" |
| AC-B10 | Bỏ trống chức danh và ghi chú | Gửi | Hợp lệ. `payload.jobTitle=null`, `payload.note=null` **[D-05]** |

**OUT OF SCOPE (explicit):**
- Trang quản trị lead (xem, lọc, đổi trạng thái, xuất file). Lead đi qua kênh thông báo (mục 3.6). Không có endpoint đọc lead.
- CMS, `/tra-cuu`, booking B2C (nhánh B), form đăng ký bảo hành (P1, contract riêng `warranty-registration.md`), form liên hệ chung/CSKH.
- Chọn giờ demo trên lịch (Calendly hoặc tương tự). Sales gọi lại để chốt giờ.
- Email/SMS/Zalo tự động gửi cho người điền form.
- Chống trùng theo SĐT (cùng người gửi 2 lần khác thời điểm là 2 lead). Chỉ chống trùng theo `Idempotency-Key`.
- Upload file (RFP, danh sách điểm lắp). Ô "ngành hàng" ở `03` P8 (xem R12).
- Đồng bộ trạng thái lead về site. Cột `status` để dành cho trang quản trị hoặc CRM sau này.

---

## SECTION 2: Database Schema (ERD diff)

PostgreSQL (đề xuất 16, **phiên bản ghim ở G4**). Chạy trong mạng nội bộ Docker, không publish cổng. Truy cập bằng truy vấn tham số hóa (đề xuất thư viện `pg`, không cần ORM cho 2 bảng). **SQL dưới đây chưa chạy thử**: PR migration phải chạy `up` → `down` → `up` trên một Postgres tạm trước khi mở PR.

**Migration file sẽ tên là:** `db/migrations/YYYYMMDDHHMMSS-create-leads.ts` (timestamp = lúc tạo file ở G4, ví dụ `20261102090000-create-leads.ts`). Một file, PR riêng, nhánh `chore/s1-1.6-leads-table-migration`, commit `migration(leads): create leads and lead_notifications tables`. Có `down` xóa theo thứ tự ngược.

```sql
-- NEW TABLE 1: leads — mọi loại lead, payload theo type
CREATE TABLE leads (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  type              VARCHAR(32)  NOT NULL
                    CHECK (type IN ('lead_b2b', 'lead_technician')),
                    -- 'warranty_registration' thêm bằng migration riêng khi contract P1 APPROVED
  payload           JSONB        NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
                    -- đúng shape đã qua Zod + chuẩn hóa (mục 2.1). KHÔNG chứa IP, token, consent
  payload_version   SMALLINT     NOT NULL DEFAULT 1 CHECK (payload_version >= 1),
  consent_version   VARCHAR(32)  NOT NULL,              -- vd '2026-11-v1', khóa trong content/consent.ts
  consent_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(), -- giờ server lúc nhận, không lấy giờ client
  consent_purposes  TEXT[]       NOT NULL CHECK (cardinality(consent_purposes) >= 1),
                    -- mã mục đích ĐÃ đồng ý; mục đích bị từ chối = danh sách của version trừ mảng này
  ip_hash           CHAR(64)     NOT NULL CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
                    -- HMAC-SHA256(ip, LEAD_IP_HASH_SECRET), hex. KHÔNG lưu IP thô ở bất kỳ đâu
  utm               JSONB        NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(utm) = 'object'),
  locale            VARCHAR(5)   NOT NULL DEFAULT 'vi' CHECK (locale IN ('vi', 'en')),
  page_path         VARCHAR(512) NOT NULL DEFAULT '/',  -- chỉ pathname, không query, không hash
  film_tier         VARCHAR(8)   NULL
                    CHECK (film_tier IN ('T-FULL', 'T-LITE', 'T-SEQ', 'T-STILL')),
  status            VARCHAR(16)  NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'qualified', 'spam', 'closed')),
  meta              JSONB        NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(meta) = 'object'),
                    -- cờ do server tính, không PII: {captcha, emailFreeDomain, sanitized[]}
  idempotency_key   UUID         NULL,                  -- header Idempotency-Key (UUID v4 do client sinh)
  correlation_id    VARCHAR(64)  NOT NULL,              -- nối lead với log
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_type_created_at ON leads (type, created_at DESC);
CREATE UNIQUE INDEX uq_leads_idempotency_key ON leads (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- NEW TABLE 2: lead_notifications — hàng đợi gửi thông báo (outbox), để gửi lỗi không mất lead
CREATE TABLE lead_notifications (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID         NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel          VARCHAR(16)  NOT NULL CHECK (channel IN ('email', 'crm', 'lark', 'zalo_oa')),
  target           VARCHAR(64)  NOT NULL,   -- KHÓA cấu hình đích ('b2b_sales', 'technician_hr'), KHÔNG lưu địa chỉ
  status           VARCHAR(16)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'sent', 'dead')),
  attempts         SMALLINT     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- cũng là "lease" khi đang gửi (mục 3.5)
  last_error_code  VARCHAR(64)  NULL,       -- mã lỗi kỹ thuật (vd 'SMTP_ECONNREFUSED'), không chứa nội dung lead
  sent_at          TIMESTAMPTZ  NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lead_notifications_lead_channel_target UNIQUE (lead_id, channel, target)
);

CREATE INDEX idx_lead_notifications_due ON lead_notifications (next_attempt_at)
  WHERE status = 'pending';

-- updated_at tự cập nhật
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lead_notifications_updated_at BEFORE UPDATE ON lead_notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- QUYỀN DB (tạo trong cùng migration hoặc script init, mật khẩu từ secret, không commit)
-- bb_app : INSERT, SELECT trên leads (SELECT cần cho replay idempotency và dựng nội dung thông báo);
--          INSERT, SELECT, UPDATE trên lead_notifications. KHÔNG UPDATE/DELETE trên leads.
-- bb_ops : SELECT, DELETE trên leads (yêu cầu chủ thể dữ liệu, dọn theo thời hạn lưu). Chỉ dùng qua script mục 6.4.
```

Vì sao có thêm cột so với danh sách tối thiểu ở `04` mục 2.5:

| Cột / bảng | Lý do |
|---|---|
| `lead_notifications` | Yêu cầu "gửi thông báo thất bại không mất lead, có retry". Hàng đợi tách khỏi `leads` nên **schema không đổi dù anh chọn kênh (a), (b) hay (c)** ở mục 3.6 |
| `payload_version` | Shape của `payload` có thể đổi về sau (thêm trường qua CR) mà không phải đoán dòng cũ theo shape nào |
| `meta` | Cờ do server tính (captcha chưa xác minh, email miễn phí, metadata bị cắt). Tách khỏi `payload` để `payload` chỉ là dữ liệu người dùng nhập |
| `idempotency_key` | Chống tạo 2 lead khi mạng rớt sau lúc server đã ghi (AC-C9) |
| `correlation_id` | Đi từ một lead tới log của đúng request đó (`rules/logging.md`) |

Không có `created_by`/`updated_by` (người gửi là khách ẩn danh) và không có `deleted_at`: xóa theo yêu cầu chủ thể dữ liệu phải là **xóa thật** (mục 6.4), xóa mềm vẫn giữ dữ liệu cá nhân.

### 2.1 Shape của `payload` (`payload_version = 1`)

```json
// type = 'lead_b2b'
{
  "intent": "quote",                // 'quote' | 'demo' | 'integration'
  "fullName": "Nguyễn Văn An",
  "company": "Công ty CP Điện máy ABC",
  "jobTitle": "Trưởng phòng dịch vụ", // hoặc null
  "phone": "+84902808049",          // luôn E.164
  "workEmail": "an.nguyen@abc.vn",  // chữ thường
  "customerType": "brand",          // 'brand' | 'marketplace' | 'retail_chain'
  "monthlyVolume": "500_1999",      // 'lt_100' | '100_499' | '500_1999' | 'gte_2000' | 'unknown'
  "provinces": ["01", "79"],        // mã tỉnh, duy nhất, sắp tăng dần, 1..34 phần tử
  "note": null                      // hoặc chuỗi ≤ 1.000 ký tự
}
// type = 'lead_technician': xem contracts/lead-technician.md mục 2
```

`utm` lưu dạng `{"source": "...", "medium": "...", "campaign": "...", "term": "...", "content": "..."}`, chỉ các khóa có giá trị. `meta` ví dụ: `{"captcha": "passed", "emailFreeDomain": false, "sanitized": []}`.

### 2.2 Sao lưu và thời hạn lưu

- **NFR-AVAIL-02:** `pg_dump` cả database hằng ngày, **mã hóa trước khi chuyển ra ngoài server** (vì chứa dữ liệu cá nhân), RPO ≤ 24 h, RTO ≤ 4 h, diễn tập restore 1 lần trước launch. Không đạt thì chưa bật form.
- **Thời hạn lưu lead và bản sao lưu: chờ pháp chế [PC-03].** Script dọn (mục 6.4) có sẵn nhưng **tắt** khi `LEAD_RETENTION_DAYS` để trống.

---

## SECTION 3: API Contract

### 3.1 POST /api/v1/leads

```
POST /api/v1/leads
Auth:        KHÔNG (endpoint công khai, không JWT, không cookie). Bảo vệ bằng Origin + honeypot + Turnstile + rate-limit
Roles:       Công khai — chỉ TẠO. Không có GET/PATCH/DELETE (Route Handler chỉ export POST → method khác nhận 405 của Next)
Rate limit:  5 request / 10 phút / IP — cửa sổ trượt trong app (chính xác) + limit_req ở openresty (lớp thô, mục 3.8)
Body tối đa: 16 KB (openresty client_max_body_size + kiểm lại trong app)
Content-Type: application/json; charset=utf-8
Header nhận: Idempotency-Key (UUID v4, khuyến nghị, FE luôn gửi) · x-correlation-id (UUID, tùy chọn)
Header trả:  x-correlation-id (luôn) · Retry-After (khi 429) · Idempotent-Replayed: true (khi replay)
Thời gian:   p95 ≤ 500 ms ở 10 người dùng đồng thời (NFR-SEC-06). Gửi thông báo KHÔNG nằm trong thời gian phản hồi
```

**Request body (dùng chung mọi type):**

| Field | Type | Required | Validation | Mô tả |
|---|---|---|---|---|
| `type` | string | Có | `'lead_b2b'` \| `'lead_technician'` | Loại lead. Giá trị khác → 400 |
| `fields` | object | Có | Strict theo `type` (bảng dưới và `lead-technician.md`). Khóa lạ → 400 `unknown_field` | Dữ liệu người dùng nhập |
| `consent` | object | Có | `{version: string ≤ 32, purposes: string[] ≤ 10}`, strict | Phiên bản câu đồng ý đang hiển thị + mã mục đích người dùng đã tick |
| `utm` | object | Không | **Lỏng**: chỉ giữ `source, medium, campaign, term, content`; mỗi giá trị cắt còn 100 ký tự, bỏ ký tự điều khiển; khóa khác bị bỏ | Lấy từ URL lúc vào site (sessionStorage), không lấy query hiện tại |
| `pagePath` | string | Không | **Lỏng**: phải bắt đầu bằng `/`, ≤ 512, khớp `^/[A-Za-z0-9\-._~/%]*$`; sai thì lưu `/` | `location.pathname`, không query, không hash |
| `locale` | string | Không | **Lỏng**: `'vi'` \| `'en'`; sai thì lưu `'vi'` | Ngôn ngữ trang |
| `filmTier` | string \| null | Không | **Lỏng**: `T-FULL` \| `T-LITE` \| `T-SEQ` \| `T-STILL` \| `null`; sai thì `null` | Tầng phim đang chạy (`04` mục 3.1) |
| `hp` | string | Không | ≤ 200. Có ký tự khác khoảng trắng = honeypot dính | Ô bẫy, người thật để trống |
| `turnstileToken` | string | Có (kiểm ở bước captcha) | ≤ 2.048 | Token Cloudflare Turnstile |

"Lỏng" nghĩa là **siêu dữ liệu do client tự gắn không bao giờ làm hỏng một lead thật**: sai thì sửa hoặc bỏ, ghi tên trường vào `meta.sanitized`. Trường người dùng nhập (`fields`, `consent`) thì **chặt**: sai là 400.

**`fields` khi `type = 'lead_b2b'`** (khóa camelCase; nhãn VI/EN trong `messages/*.json`):

| Field | Type | Required | Validation (sau chuẩn hóa) | Nhãn VI / EN · Mô tả |
|---|---|---|---|---|
| `intent` | enum | Có | `quote` \| `demo` \| `integration` | Ô ẩn, do CTA đặt; không hiện cho người dùng |
| `fullName` | string | Có | NFC, gộp khoảng trắng, trim. 2–100 ký tự. `^[\p{L}\p{M}][\p{L}\p{M} .'\-]*$` (u) | "Họ và tên" / "Full name" |
| `company` | string | Có | Chuẩn hóa như trên. 2–150 ký tự. Không chứa `<`, `>`, `://` | "Công ty" / "Company" |
| `jobTitle` | string \| null | Không [D-05] | Chuẩn hóa. 2–100 ký tự. Rỗng → `null` | "Chức danh" / "Job title" |
| `phone` | string | Có | Bỏ `[\s.\-()]` → khớp `^(0\|\+84)(3\|5\|7\|8\|9)\d{8}$` → lưu E.164 `+84…`. Đầu vào ≤ 20 ký tự | "Số di động" / "Mobile number". Gợi ý: "0902 808 049" |
| `workEmail` | string | Có | Trim, chữ thường, ≤ 254, định dạng email. Tên miền miễn phí: theo [D-03] | "Email công ty" / "Work email" |
| `customerType` | enum | Có | `brand` \| `marketplace` \| `retail_chain` [D-06] | "Loại doanh nghiệp": Hãng · Sàn TMĐT · Chuỗi bán lẻ / Brand · Marketplace · Retail chain |
| `monthlyVolume` | enum | Có | `lt_100` \| `100_499` \| `500_1999` \| `gte_2000` \| `unknown` [D-07] | "Sản lượng đơn lắp/tháng": Dưới 100 · 100–499 · 500–1.999 · Từ 2.000 · Chưa rõ |
| `provinces` | string[] | Có | 1–34 phần tử, mỗi phần tử là mã trong `content/provinces.ts` (34 tỉnh/thành). Bỏ trùng, sắp tăng dần | "Tỉnh/thành triển khai" (chọn nhiều, có lựa chọn "Toàn quốc" = đủ 34 mã) |
| `note` | string \| null | Không | NFC, bỏ ký tự điều khiển trừ xuống dòng, trim, ≤ 1.000 ký tự. Rỗng → `null`. Lưu nguyên văn, **không bao giờ render như HTML** | "Ghi chú" / "Notes" |

**Zod (đặc tả; Zod phiên bản ghim ở G4, cú pháp minh họa):**

```ts
// lib/leads/schema.ts
const PHONE_VN = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const clean = (s: string) => s.normalize('NFC').replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
const personName = z.string().max(200).transform(clean)
  .pipe(z.string().min(2).max(100).regex(/^[\p{L}\p{M}][\p{L}\p{M} .'\-]*$/u));
const phoneVN = z.string().max(20).transform(s => s.replace(/[\s.\-()]/g, ''))
  .pipe(z.string().regex(PHONE_VN)).transform(toE164);           // '0902808049' → '+84902808049'
const provinceCode = z.enum(PROVINCE_CODES);                       // sinh từ content/provinces.ts (34 mã)
const optionalText = (max: number) => z.string().max(max * 3).transform(clean)
  .transform(s => (s === '' ? null : s)).pipe(z.string().min(2).max(max).nullable()).nullable().optional();

export const LeadB2BFields = z.object({
  intent: z.enum(['quote', 'demo', 'integration']),
  fullName: personName,
  company: z.string().max(450).transform(clean).pipe(z.string().min(2).max(150).refine(noMarkupNoUrl)),
  jobTitle: optionalText(100),
  phone: phoneVN,
  workEmail: z.string().trim().toLowerCase().max(254).email(),
  customerType: z.enum(['brand', 'marketplace', 'retail_chain']),
  monthlyVolume: z.enum(['lt_100', '100_499', '500_1999', 'gte_2000', 'unknown']),
  provinces: z.array(provinceCode).min(1).max(34).transform(uniqueSorted),
  note: z.string().max(3000).transform(cleanMultiline).transform(s => (s === '' ? null : s))
        .pipe(z.string().max(1000).nullable()).nullable().optional(),
}).strict();

const Consent = z.object({ version: z.string().max(32), purposes: z.array(z.string().max(48)).max(10) }).strict();
const Common = { consent: Consent, utm: z.unknown().optional(), pagePath: z.unknown().optional(),
  locale: z.unknown().optional(), filmTier: z.unknown().optional(),
  hp: z.string().max(200).optional(), turnstileToken: z.string().max(2048).optional() };

export const LeadRequest = z.discriminatedUnion('type', [
  z.object({ type: z.literal('lead_b2b'), fields: LeadB2BFields, ...Common }).strict(),
  z.object({ type: z.literal('lead_technician'), fields: LeadTechnicianFields, ...Common }).strict(),
]);
// utm/pagePath/locale/filmTier đi qua sanitizeMeta() riêng (lỏng); turnstileToken kiểm ở bước captcha.
```

Cùng một schema dùng cho FE (kiểm inline) và server (kiểm thật). Server **không tin** kết quả kiểm ở FE.

**Thứ tự xử lý ở server (bắt buộc giữ thứ tự):**

| # | Bước | Kết quả nếu dừng |
|---|---|---|
| 0 | Form tắt? (`LEADS_FORM_ENABLED=false` hoặc câu đồng ý của `type` chưa duyệt ở production) | 503 `LEADS_DISABLED` |
| 1 | Lấy `x-correlation-id` nếu là UUID, không thì sinh mới | — |
| 2 | `Origin` có mặt mà không thuộc `LEAD_ALLOWED_ORIGINS` | 403 `FORBIDDEN_ORIGIN` |
| 3 | Content-Type không phải JSON, hoặc body > 16 KB | 400 `INVALID_JSON` / 413 `PAYLOAD_TOO_LARGE` |
| 4 | Rate-limit trong app: đếm request này theo `ip_hash`, cửa sổ trượt 600 s, tối đa 5 | 429 `RATE_LIMITED` |
| 5 | Parse JSON | 400 `INVALID_JSON` |
| 6 | Honeypot: `hp` có ký tự khác khoảng trắng, hoặc `hp` không phải chuỗi | 201 giả, dừng (không DB, không thông báo) |
| 7 | `Idempotency-Key` đã có trong `leads` | 201 replay cùng `data`, dừng |
| 8 | Zod (strict) | 400 `VALIDATION_ERROR` |
| 9 | Consent: `version` có trong danh sách còn hiệu lực của `type`; mục đích lạ → 400; thiếu mục đích bắt buộc → 422 | 409 `CONSENT_VERSION_OUTDATED` / 400 / 422 `CONSENT_REQUIRED` |
| 10 | (Chỉ khi [D-03] = chặn) email thuộc danh sách tên miền miễn phí | 422 `EMAIL_DOMAIN_NOT_ALLOWED` |
| 11 | Turnstile: gọi siteverify (timeout 3 s, **không gửi `remoteip`**). `success=false`, hoặc `hostname` ngoài `TURNSTILE_ALLOWED_HOSTNAMES`, hoặc `action` ≠ `type` → 403. Lỗi mạng/timeout/5xx → theo [D-09] (đề xuất: nhận lead, `meta.captcha='unverified'`) | 403 `CAPTCHA_FAILED` |
| 12 | Một transaction: INSERT `leads` + INSERT `lead_notifications` (1 dòng cho mỗi kênh/đích đã cấu hình của `type`). Đụng unique `idempotency_key` (2 request cùng key chạy song song) → đọc lại, trả replay | 500 `INTERNAL_ERROR` nếu DB lỗi |
| 13 | Trả 201 | — |
| 14 | Sau khi trả response (`after()` của Next): thử gửi thông báo lần 1 cho các dòng `lead_notifications` của lead này (mục 3.5) | Không ảnh hưởng response |

Bước 8–10 đứng trước bước 11 để lỗi nhập liệu **không đốt token Turnstile** (token chỉ dùng một lần). FE vẫn phải `reset()` widget sau mọi phản hồi khác 2xx.

**RESPONSE 201:**

```json
{
  "success": true,
  "data": {
    "id": "0b9f3c2e-6d1a-4c55-9a7e-2f4d8b1c9e01",
    "reference": "0B9F3C2E",
    "type": "lead_b2b",
    "receivedAt": "2026-11-02T02:15:00.000Z"
  }
}
```

`reference` = 8 ký tự hex đầu của `id`, in hoa, để khách đọc khi gọi hotline (nhân viên tra bằng `id::text LIKE '0b9f3c2e%'`). Không trả lại dữ liệu người dùng đã gửi. Không có `meta` (không phân trang). Phản hồi honeypot (bước 6) có đúng shape này với UUID ngẫu nhiên không lưu ở đâu.

**RESPONSE lỗi** (mọi mã, theo `rules/api.md` + `rules/logging.md`):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "fields.phone", "code": "invalid_phone", "message": "Phone must match ^(0|\\+84)(3|5|7|8|9)\\d{8}$" }
    ],
    "correlationId": "5f0c1d7e-2b8a-4e3f-9d61-0a7b3c4e5f60"
  }
}
```

`error.message` viết cho developer (tiếng Anh). FE **không** hiện `message`; FE ánh xạ `code` (+ `details[].code`) sang câu chữ trong `messages/vi.json` / `en.json` (khóa `leads.errors.<CODE>` và `leads.fieldErrors.<code>`). Mã trong `details[].code`: `required`, `too_short`, `too_long`, `invalid_format`, `invalid_phone`, `invalid_email`, `invalid_option`, `too_many`, `unknown_field`, `unknown_purpose`.

**Bảng mã lỗi (dùng chung mọi type):**

| Code | HTTP | Điều kiện | FE làm gì |
|---|---|---|---|
| `INVALID_JSON` | 400 | Body không parse được, hoặc Content-Type không phải `application/json` | "Không gửi được, vui lòng thử lại" + hotline |
| `VALIDATION_ERROR` | 400 | Zod fail: thiếu trường, sai định dạng, khóa lạ, `type` lạ, mục đích lạ. `details[]` liệt kê từng trường | Lỗi inline theo `details[].field`, focus ô lỗi đầu tiên |
| `FORBIDDEN_ORIGIN` | 403 | Header `Origin` có mặt và không thuộc `LEAD_ALLOWED_ORIGINS` | Không xảy ra với site thật; log `warn` |
| `CAPTCHA_FAILED` | 403 | Thiếu token, siteverify trả `success=false`, sai `hostname` hoặc `action` | `turnstile.reset()`, "Xác minh chưa thành công, vui lòng thử lại" |
| `CONSENT_VERSION_OUTDATED` | 409 | `consent.version` không còn trong danh sách hiệu lực (điều khoản vừa đổi khi trang đang mở) | "Điều khoản vừa cập nhật, vui lòng tải lại trang" (giữ dữ liệu trong sessionStorage) |
| `PAYLOAD_TOO_LARGE` | 413 | Body > 16 KB (openresty hoặc app) | "Nội dung quá dài" |
| `CONSENT_REQUIRED` | 422 | Thiếu ít nhất một mục đích bắt buộc của `type` | Lỗi tại checkbox |
| `EMAIL_DOMAIN_NOT_ALLOWED` | 422 | **Chỉ khi [D-03] = chặn**: email thuộc tên miền miễn phí | Lỗi inline ở ô email |
| `RATE_LIMITED` | 429 | Quá 5 request/10 phút/IP (app) hoặc chạm `limit_req` (openresty). Có `Retry-After` | "Bạn đã gửi nhiều lần, vui lòng thử lại sau N phút hoặc gọi 0902 808 049" |
| `INTERNAL_ERROR` | 500 | DB lỗi, lỗi không lường trước. Không có stack trace | "Hệ thống đang lỗi" + hotline/Zalo + mã `correlationId` 8 ký tự đầu, giữ dữ liệu đã nhập |
| `LEADS_DISABLED` | 503 | Form đang tắt (bước 0) | Thay form bằng khối Gọi · Zalo · email |

Lỗi phía client (không có response): FE dùng mã `NETWORK_ERROR` cho analytics và thông báo, cho phép bấm gửi lại với **cùng** `Idempotency-Key`.

### 3.2 Endpoint cũ `/api/contact` (thời gian chuyển tiếp)

`04` mục 2.7 để contract chốt. **Đề xuất [D-11]:** sau cutover, `POST /api/contact` trả **410** với `{"success":false,"error":{"code":"ENDPOINT_GONE","message":"Use POST /api/v1/leads","details":[],"correlationId":"…"}}`, giữ tối thiểu 90 ngày, không ghi DB, không thông báo. **Không dùng 308 sang `/api/v1/leads`**: body cũ khác shape và không có `consent`, nên chuyển tiếp chỉ sinh 400. Nhận body cũ vào bảng mới thì lại thu dữ liệu cá nhân không có đồng ý theo mục đích (trái NFR-PDP-01).

### 3.3 Không có endpoint đọc hoặc sửa lead

Không có `GET /api/v1/leads`, `GET /api/v1/leads/:id`, `PATCH`, `DELETE`. Cột `status` giữ `'new'` trong phạm vi này. Người được xem lead và cách xem: mục 4.

### 3.4 SIDE EFFECTS (mọi thứ xảy ra khi POST thành công)

1. INSERT 1 dòng `leads` (`status='new'`, `consent_at=NOW()`, `ip_hash`, `meta`, `correlation_id`).
2. INSERT N dòng `lead_notifications` cùng transaction, `status='pending'`. N = số kênh/đích cấu hình cho `type` (kênh (a): N = 1, đích `b2b_sales` cho B2B, `technician_hr` cho thợ).
3. Tăng bộ đếm rate-limit trong bộ nhớ của instance cho `ip_hash` (tăng cả khi request bị từ chối ở bước sau bước 4).
4. Gọi ra ngoài: Cloudflare siteverify (token + secret; **không gửi IP**).
5. Sau response: gửi thông báo lần 1 (`after()`), cập nhật dòng `lead_notifications` tương ứng.
6. Log `info` sự kiện `lead_received` (mục 6.6). Không ghi `audit_logs` (không có thao tác quản trị trong phạm vi này).
7. **Không** gửi gì cho người điền form. **Không** ghi cookie. **Không** ghi Umami từ server (sự kiện phân tích do FE gửi, mục 3.7).

Khi honeypot dính: chỉ có (3) và log `warn` `lead_honeypot`. Khi replay idempotency: chỉ có (3) và log `info` `lead_replayed`.

### 3.5 Gửi thông báo và thử lại (outbox)

**Luật: lưu DB trước, gửi thông báo sau. Gửi thông báo không bao giờ nằm trong transaction ghi lead và không bao giờ làm request lỗi.**

- **Lần 1:** trong `after()` của Route Handler, ngay sau khi trả 201.
- **Các lần sau:** script `scripts/leads-notify-retry.mjs` chạy mỗi 5 phút (cron trên host hoặc service `lead-notifier` trong compose dùng cùng image — devops chọn ở G4; cả hai cách đều phải an toàn khi chạy chồng nhau).
- **Nhận việc bằng lease, không giữ transaction lâu:**
  ```sql
  UPDATE lead_notifications
     SET attempts = attempts + 1, next_attempt_at = NOW() + INTERVAL '10 minutes'
   WHERE id IN (SELECT id FROM lead_notifications
                 WHERE status = 'pending' AND next_attempt_at <= NOW()
                 ORDER BY next_attempt_at LIMIT 20
                 FOR UPDATE SKIP LOCKED)
  RETURNING id, lead_id, channel, target, attempts;
  ```
  Gửi xong: `status='sent', sent_at=NOW(), last_error_code=NULL`. Lỗi: `next_attempt_at = NOW() + backoff(attempts)`, `last_error_code` = mã lỗi kỹ thuật. Tiến trình sập giữa chừng thì lease 10 phút hết hạn và dòng được nhận lại.
- **Lịch thử (backoff), tối đa 8 lần (~22 giờ):** lần 1 ngay · lần 2 sau 1 phút · 5 phút · 15 phút · 1 giờ · 3 giờ · 6 giờ · lần 8 sau 12 giờ. Hết lượt: `status='dead'`, log `error` `lead_notify_dead` (Sentry cảnh báo ngay), quản trị kỹ thuật xử lý theo runbook (xuất lead bằng script mục 6.4 và chuyển tay cho bộ phận).
- **Giám sát:** script retry log `error` `lead_notify_backlog` khi có dòng `pending` cũ hơn 30 phút.
- **Ngữ nghĩa "ít nhất một lần":** sập đúng sau lúc gửi mà trước lúc ghi `sent` thì có thể gửi trùng. Mọi thông báo có `reference` để người nhận nhận ra bản trùng.

### 3.6 Kênh thông báo — CHỜ ANH CHỌN [D-01]

Schema và API **không đổi** theo phương án. Khác nhau ở giá trị `lead_notifications.channel`, biến môi trường, danh sách bên xử lý dữ liệu và test.

| | **(a) Email SMTP theo bộ phận — đề xuất** | (b) Đẩy vào CRM-Bluebolt qua API ingest | (c) Lark hoặc Zalo OA |
|---|---|---|---|
| Cách chạy | Lead B2B → hộp thư kinh doanh, lead thợ → hộp thư tuyển thợ. Email text + HTML (đã escape) | `POST` sang endpoint ingest của CRM, khóa idempotency = `leads.id`, xác thực bằng API key hoặc chữ ký HMAC | Bot nhắn vào nhóm chat nội bộ |
| `channel` | `email` | `crm` | `lark` / `zalo_oa` |
| Biến môi trường | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `LEAD_NOTIFY_EMAIL_B2B`, `LEAD_NOTIFY_EMAIL_TECHNICIAN` | `CRM_INGEST_URL`, `CRM_INGEST_KEY` | `LARK_WEBHOOK_URL` hoặc `ZALO_OA_*` |
| "Ai xem lead" | Người có quyền vào hộp thư bộ phận | Phân quyền trong CRM. **Lấp được khoảng trống "không có trang quản trị"** (trạng thái, phân công, lịch sử gọi) | Mọi thành viên nhóm chat |
| Tác động lên contract | Nội dung email ở dưới bảng. Tiêu đề **không** chứa tên/SĐT/email. Cần SPF/DKIM/DMARC cho tên miền gửi | **Cần một contract ingest phía CRM** (endpoint, schema, lỗi, idempotency). CRM có API hay chưa: **chưa kiểm chứng**. Thời hạn lưu theo CRM, pháp chế phải duyệt CRM như nơi lưu lead | **Không nên là kênh duy nhất**: tin nhắn chỉ nên chứa `reference`, loại, tỉnh (không tên/SĐT), nên vẫn cần (a) hoặc (b) mang chi tiết |
| Dữ liệu cá nhân | Nhà cung cấp email (Google Workspace, Zoho…, **chưa biết bên nào**) là bên xử lý, có thể ngoài lãnh thổ | Nội bộ nếu CRM cùng server; nếu không, thêm một nơi lưu | Lark: dữ liệu ra nước ngoài. Zalo OA: điều kiện API/chi phí **chưa kiểm chứng** |
| Giờ Claude Code (ước, chưa đo) | ~2 giờ | ~4 giờ + phía CRM | ~2 giờ + thiết lập OA/bot |

**Nội dung thông báo theo (a)** (dựng từ `leads` khi gửi, không lưu nội dung vào `lead_notifications`):
- Tiêu đề: `[Lead B2B][Báo giá] 0B9F3C2E · Hãng · 500–1.999 đơn/tháng · 3 tỉnh`. Chỉ chứa mã tham chiếu và enum.
- Thân: mọi trường `payload` với nhãn tiếng Việt, SĐT dạng `0902 808 049` (link `tel:`), tên tỉnh từ `content/provinces.ts`, mục đích đã đồng ý + `consent_version` + giờ (Asia/Ho_Chi_Minh), `utm.source/campaign`, `page_path`, `locale`, cảnh báo nếu `meta.captcha='unverified'` hoặc `meta.emailFreeDomain=true`, `id` và `reference`.
- `Reply-To` = `workEmail` (đã qua Zod, không thể chứa CR/LF). Mọi header khác cố định.
- Chân thư: "Email chứa dữ liệu cá nhân. Không chuyển tiếp ra ngoài. Yêu cầu xóa/truy cập dữ liệu: chuyển cho [đầu mối PC-04]."

### 3.7 Sự kiện analytics (FE gửi Umami, không cookie)

| Sự kiện | Khi nào | Thuộc tính (không dữ liệu cá nhân) |
|---|---|---|
| `lead_submit` | Nhận 201 thật (không tính replay) | `type`, `intent` (chỉ B2B), `locale`, `filmTier` |
| `lead_error` | Mọi phản hồi khác 2xx, lỗi mạng, hoặc bấm Gửi khi FE chặn vì lỗi nhập | `type`, `code` (mã ở 3.1, hoặc `NETWORK_ERROR`, `CLIENT_VALIDATION`) |

### 3.8 openresty cho `/api/v1/leads` (sửa mẫu ở `04` mục 2.7)

Mẫu ở `04` mục 2.7 có hai lỗi phải sửa trước khi áp:
1. `rate=5r/10m` **không phải cú pháp hợp lệ**: theo tài liệu nginx, `limit_req_zone` chỉ nhận số nguyên `r/s` hoặc `r/m`, nên `openresty -t` sẽ báo lỗi. Lớp openresty chỉ làm được giới hạn thô; giới hạn chính xác 5/10 phút nằm trong app. Muốn chính xác ở openresty thì dùng `resty.limit.count` (5 lần/600 s) của lua-resty-limit-traffic (kèm OpenResty, **chưa kiểm chứng trên server**) [D-17].
2. `location = /api/v1/leads` không có `proxy_set_header`. nginx không kế thừa `proxy_set_header` từ `location /` sang location khác, nên app không thấy IP thật: mọi request trông như cùng một IP, rate-limit trong app sẽ khóa **toàn site** sau 5 lead/10 phút.

```nginx
# http{}
limit_req_zone $binary_remote_addr zone=bb_leads:1m rate=1r/m;

# server{} lapdattoanquoc.vn
location = /api/v1/leads {
    limit_req zone=bb_leads burst=4 nodelay;   # 5 request dồn ngay, sau đó 1/phút (lớp thô)
    limit_req_status 429;                      # mặc định nginx trả 503
    client_max_body_size 16k;
    error_page 429 = @leads_429;
    error_page 413 = @leads_413;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;   # ghi đè giá trị client tự gửi; app CHỈ đọc header này
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Correlation-Id $http_x_correlation_id;
    proxy_pass http://bb_web;
}
location @leads_429 {
    default_type application/json;
    include snippets/bb-security-headers.conf;
    add_header Retry-After 60 always;
    return 429 '{"success":false,"error":{"code":"RATE_LIMITED","message":"Too many requests","details":[]}}';
}
location @leads_413 {
    default_type application/json;
    include snippets/bb-security-headers.conf;
    return 413 '{"success":false,"error":{"code":"PAYLOAD_TOO_LARGE","message":"Payload too large","details":[]}}';
}
```

*Giả định, chờ anh xác nhận:* site **không** đi qua proxy Cloudflare (chỉ dùng Turnstile). Nếu có proxy Cloudflare thì `$remote_addr` là IP của Cloudflare: phải thêm `real_ip_header CF-Connecting-IP` + `set_real_ip_from` theo dải IP Cloudflare, nếu không rate-limit sẽ khóa nhầm.

### 3.9 Biến môi trường

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Có | User `bb_app` |
| `LEADS_FORM_ENABLED` | Có | `true`/`false`. Công tắc tắt khẩn cấp |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Có | Dev/CI dùng bộ khóa test "luôn qua"/"luôn trượt" do Cloudflare công bố (tra lại tài liệu Turnstile khi cấu hình) |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Có | `lapdattoanquoc.vn` + tên miền staging |
| `LEAD_ALLOWED_ORIGINS` | Có | `https://lapdattoanquoc.vn` + origin staging. Dev: `http://127.0.0.1:3000` |
| `LEAD_IP_HASH_SECRET` | Có | ≥ 32 byte ngẫu nhiên. Đổi khóa thì mất khả năng so `ip_hash` cũ/mới (chấp nhận) |
| `LEAD_RATE_LIMIT_MAX`, `LEAD_RATE_LIMIT_WINDOW_SEC` | Không | Mặc định 5 và 600 |
| `LEAD_RETENTION_DAYS` | Không | Trống = script dọn tắt (chờ PC-03) |
| Biến của kênh thông báo | Theo [D-01] | Mục 3.6 |

---

## SECTION 4: RBAC Map

Dự án không dùng bộ 7 role của mẫu skill (bộ đó cho hệ thống bán lẻ). Phạm vi này **không có người dùng đăng nhập**.

| Hành động | Khách truy cập (ẩn danh) | Hệ thống (route + script retry) | Người nhận thông báo: kinh doanh B2B | Người nhận thông báo: tuyển thợ | Quản trị kỹ thuật (do anh Duy chỉ định bằng văn bản) | Anh Duy |
|---|---|---|---|---|---|---|
| Tạo lead (`POST /api/v1/leads`) | Có | — | Có (như khách) | Có (như khách) | Có (như khách) | Có (như khách) |
| Xem lead qua web/API | Không (không có endpoint) | — | Không | Không | Không | Không |
| Nhận chi tiết lead qua kênh thông báo | Không | Gửi | Chỉ `lead_b2b` | Chỉ `lead_technician` | Không (trừ khi được thêm vào kênh) | Theo cấu hình kênh |
| Truy vấn DB trực tiếp | Không | `bb_app`: INSERT/SELECT | Không | Không | `bb_ops` qua SSH tunnel, chỉ để xử lý yêu cầu chủ thể dữ liệu, sự cố, lead `dead` | Không trực tiếp; yêu cầu qua quản trị kỹ thuật |
| Đổi `status` | Không | Không (giữ `'new'`) | Không | Không | Không trong phạm vi này | — |
| Xuất / xóa theo yêu cầu chủ thể dữ liệu | Gửi yêu cầu qua kênh pháp chế quy định [PC-04] | — | Chuyển yêu cầu | Chuyển yêu cầu | Chạy script mục 6.4, ghi nhật ký | Duyệt khi pháp chế yêu cầu |
| Sửa nội dung lead | Không | Không | Không | Không | Không (chỉ xóa hoặc xuất) | — |

Giới hạn phạm vi dữ liệu: định tuyến theo `type` là cơ chế phân quyền duy nhất. Kênh B2B không nhận lead thợ và ngược lại. Nếu chọn (b), phân quyền chuyển sang CRM và cần ghi trong contract ingest.

---

## SECTION 5: Business Rules & Edge Cases

```
RULE 1: Lưu trước, báo sau
  - Điều kiện: mọi POST hợp lệ
  - Hành động: commit leads + lead_notifications rồi mới trả 201; gửi thông báo sau response
  - Ví dụ: SMTP sập 3 giờ → 201 bình thường, thông báo tới hộp thư khi SMTP sống lại (tối đa ~22 giờ thử)

RULE 2: Câu chữ đồng ý là nội dung có phiên bản, chỉ thêm, không sửa
  - content/consent.ts: mỗi version gồm {version, type, purposes[{code, required, textVi, textEn}], policyUrl,
    approvedBy, approvedAt}. Câu chữ do pháp chế viết [PC-01]; khi chưa có thì là placeholder.
  - Production: version của type còn placeholder hoặc thiếu approvedBy → form tắt (AC-C10), API 503.
  - Không xóa hay sửa version đã dùng: version là khóa để truy lại đúng câu chữ người dùng đã đọc.
  - Server nhận version hiện hành và version liền trước trong 24 giờ sau deploy (tab mở sẵn); cũ hơn → 409.

RULE 3: Mục đích đồng ý
  - Mỗi mục đích một checkbox riêng, không tick sẵn. Hình thức "không đồng ý ngang hàng" (để trống hay cặp
    Đồng ý/Không đồng ý) do pháp chế chốt; API chỉ nhận mảng mục đích đã đồng ý nên hỗ trợ cả hai.
  - B2B (đề xuất, chờ PC-02): bắt buộc 'b2b_sales_contact' (liên hệ tư vấn, báo giá, chốt lịch demo);
    tùy chọn 'b2b_marketing' (gửi tin tức, tài liệu, sự kiện).
  - Thiếu mục đích bắt buộc → 422. Mục đích không thuộc version/type → 400 unknown_purpose.

RULE 4: Chuẩn hóa trước khi lưu
  - Chuỗi: NFC, bỏ ký tự zero-width, gộp khoảng trắng, trim. SĐT: E.164. Email: chữ thường.
    provinces: bỏ trùng, sắp tăng dần. Giờ: TIMESTAMPTZ (UTC), hiển thị Asia/Ho_Chi_Minh.

RULE 5: Trường người dùng nhập thì chặt, siêu dữ liệu thì lỏng
  - fields, consent sai → 400. utm/pagePath/locale/filmTier sai → sửa/bỏ, ghi meta.sanitized, vẫn nhận lead.

RULE 6: Định tuyến theo type
  - lead_b2b → đích 'b2b_sales'; lead_technician → đích 'technician_hr'. Địa chỉ thật nằm trong biến môi trường.

RULE 7: Chống trùng theo Idempotency-Key, không theo SĐT
  - FE sinh UUID v4 khi người dùng bấm Gửi lần đầu, giữ nguyên khi bấm lại sau lỗi mạng/500,
    sinh mới khi người dùng sửa dữ liệu sau một lỗi 4xx.

RULE 8: Chống spam theo lớp
  - Thứ tự: Origin → rate-limit → honeypot → Zod → consent → Turnstile (bảng 3.1).
  - Turnstile lỗi mạng/timeout/5xx: theo [D-09]. Đề xuất nhận lead, meta.captcha='unverified',
    thông báo gắn nhãn "Chưa xác minh captcha". Lý do: mất lead thật đắt hơn vài lead rác,
    rate-limit và honeypot vẫn chạy.

RULE 9: Công tắc tắt form
  - LEADS_FORM_ENABLED=false → form thay bằng Gọi · Zalo · email, API 503. Dùng khi pháp chế chưa duyệt,
    khi bị spam dồn dập, hoặc khi DB bảo trì.

RULE 10: Mã tham chiếu
  - reference = 8 ký tự hex đầu của id, in hoa. Hiện ở màn hình cảm ơn và trong mọi thông báo.

RULE 11: Màn hình cảm ơn
  - Thay form tại chỗ (không đổi URL, không trang /cam-on để tránh bị index). Focus vào tiêu đề cảm ơn
    (role="status"). Thời gian gọi lại đọc từ content/sla.ts; chưa duyệt thì ẩn câu đó ở production,
    DRAFT_PREVIEW hiện kèm nhãn "Nháp". Chi tiết ở docs/SRS-LEADS.md mục 5.

RULE 12: Theo 04 khi 03 và 04 khác nhau
  - 03 mục 13.4 (P8) ghi "ngành hàng" và "khu vực"; 04 mục 2.5 ghi "loại khách (Hãng/Sàn/Chuỗi)" và
    "tỉnh triển khai". Contract theo 04. Không thu "ngành hàng" ở form này (xin anh xác nhận, D-16).
```

**EDGE CASES cần xử lý:**

| Tình huống | Xử lý |
|---|---|
| Bấm Gửi 2 lần liên tiếp | Nút disable khi đang gửi (`aria-busy`). Request thứ hai (nếu lọt) cùng `Idempotency-Key` → replay |
| Mạng rớt sau khi server đã ghi | FE báo `NETWORK_ERROR`, cho gửi lại cùng key → 201 replay, không trùng |
| 2 request cùng key chạy song song | Unique index chặn dòng thứ hai → server bắt lỗi unique, đọc lại, trả replay |
| SĐT có khoảng trắng, dấu chấm, gạch ngang, ngoặc | Bỏ ký tự đó rồi mới kiểm regex |
| SĐT bàn (02x), số nước ngoài, số có `84` không có dấu `+` | 400 `invalid_phone` theo regex đã giao [D-04] |
| Tên chỉ có khoảng trắng / có emoji / có chữ số | 400 (`too_short` / `invalid_format`) |
| Ghi chú chứa `<script>` hoặc HTML | Lưu nguyên văn dạng chữ. Email escape. Không nơi nào render như HTML |
| Chọn "Toàn quốc" rồi bỏ vài tỉnh | FE gửi đúng danh sách còn lại; server chỉ kiểm mã hợp lệ |
| Token Turnstile hết hạn khi người dùng điền lâu | Widget tự làm mới (`refresh-expired: 'auto'`); nếu vẫn hết hạn → 403, `reset()` |
| Tắt JavaScript | Form không gửi được (Turnstile cần JS). `<noscript>`: hotline, Zalo, email bộ phận |
| Điều khoản đổi khi tab đang mở | 409 → FE lưu dữ liệu đã nhập vào sessionStorage, tải lại, điền lại, người dùng tick lại |
| DB không kết nối được | 500 `INTERNAL_ERROR`, log `error`. FE giữ dữ liệu, hiện hotline/Zalo. Lead chưa được lưu: đây là trường hợp duy nhất mất lead, được giảm bằng NFR-AVAIL-01/02 |
| Nhiều thợ cùng nhà mạng 4G (chung IP qua CGNAT) hoặc cùng wifi buổi tuyển | Có thể chạm 5/10 phút. Giữ ngưỡng theo NFR-SEC-04, theo dõi tỉ lệ 429 theo `type` 2 tuần đầu, chỉnh qua [D-14] |
| Blue/green: 2 instance chạy cùng lúc | Bộ đếm rate-limit trong bộ nhớ tách theo instance → trong vài phút chuyển đổi, giới hạn nới gấp đôi. Chấp nhận. Muốn chặt thì dùng Redis (tùy chọn ở `04` mục 2.3) |
| Rollback | Lead đã ghi giữ nguyên. Migration có `down` nhưng **không chạy `down` trên production khi bảng đã có lead** (mất dữ liệu); rollback app không cần rollback DB |

**KHÔNG XỬ LÝ trong feature này:** trang quản trị, đổi trạng thái, phân công sales, chống trùng theo SĐT, tự trả lời người gửi, chọn giờ demo, upload file, form bảo hành, booking B2C, CMS, `/tra-cuu`.

---

## SECTION 6: Security Requirements

### 6.1 Dữ liệu tài chính
Không áp dụng: form không có giá, tiền, tồn kho.

### 6.2 Xác thực và phân quyền
- [ ] Endpoint công khai, chỉ POST. Không có endpoint đọc/sửa/xóa lead (kiểm bằng test 405/404).
- [ ] Không nhận từ client: `id`, `status`, `createdAt`, `consentAt`, `ipHash`, `meta`, `correlationId` (Zod strict → 400 `unknown_field`).
- [ ] Kiểm `Origin` (bước 2). Không trả header CORS (chỉ cùng origin).
- [ ] Không OTP (không có thao tác nhạy cảm của người nội bộ trong phạm vi).

### 6.3 Kiểm tra đầu vào
- [ ] Zod strict ở server cho `type`, `fields`, `consent`; lỏng có kiểm soát cho siêu dữ liệu (Rule 5).
- [ ] SĐT: `^(0|\+84)(3|5|7|8|9)\d{8}$` sau khi bỏ ký tự phân cách. Email ≤ 254. Mọi chuỗi có giới hạn độ dài.
- [ ] Body ≤ 16 KB ở openresty và app.
- [ ] SQL chỉ tham số hóa. `payload` ghi bằng tham số `$n::jsonb`, không nối chuỗi.
- [ ] Email thông báo: escape HTML mọi giá trị; không đưa dữ liệu người dùng vào header trừ `Reply-To` đã qua Zod.
- [ ] Không fetch URL nào do người dùng cung cấp (chỉ siteverify với URL cố định): không có bề mặt SSRF.

### 6.4 Dữ liệu cá nhân (NFR-PDP-01, Luật BVDLCN 91/2025/QH15 + nghị định hướng dẫn, pháp chế xác nhận số hiệu)
- [ ] Chỉ thu đúng các trường ở mục 3.1 (tối thiểu hóa). Không thu ngày sinh, địa chỉ, CCCD như modal ứng tuyển cũ.
- [ ] Checkbox theo mục đích, không tick sẵn, "không đồng ý" ngang hàng (Rule 3). Lưu `consent_version`, `consent_at`, `consent_purposes`.
- [ ] Câu chữ đồng ý **[PC-01]**, danh sách mục đích **[PC-02]**, thời hạn lưu lead + bản sao lưu **[PC-03]**, kênh và thời hạn xử lý yêu cầu rút đồng ý/truy cập/xóa **[PC-04]**: pháp chế viết, contract chỉ để chỗ.
- [ ] Hồ sơ đánh giá tác động liệt kê bên xử lý và chuyển dữ liệu ra nước ngoài: Cloudflare (Turnstile), Sentry, nhà cung cấp email/CRM/chat theo [D-01], Umami (tự host, không cookie) **[PC-05]**.
- [ ] Không lưu IP thô ở DB, log, Sentry. `ip_hash` là dữ liệu đã bút danh hóa, vẫn liệt kê trong chính sách.
- [ ] Script cho quản trị kỹ thuật (chạy bằng user `bb_ops`, không có giao diện web):
  - `scripts/leads-dsr.mjs find --phone <số>` (hoặc `--email`, `--reference`): in danh sách `id`, `type`, `created_at` (không in nội dung ra log).
  - `scripts/leads-dsr.mjs export --id <uuid>`: xuất JSON một lead cho yêu cầu truy cập.
  - `scripts/leads-dsr.mjs erase --id <uuid>`: `DELETE` thật (cascade sang `lead_notifications`).
  - `scripts/leads-purge.mjs`: xóa lead cũ hơn `LEAD_RETENTION_DAYS` (tắt khi biến trống).
  - Mỗi lần chạy ghi một dòng nhật ký không PII (người chạy, thời điểm, lệnh, `id`) vào `logs/leads-ops.log`.
  - Bản sao trong hộp thư/CRM/chat và trong bản sao lưu: cách xử lý do pháp chế quyết [PC-03].
- [ ] Sao lưu mã hóa (mục 2.2). Postgres không publish cổng.

### 6.5 Chống spam (NFR-SEC-04)
- [ ] Honeypot `hp`: input `type="text"` nằm ngoài màn hình, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`, nhãn "Không điền ô này", tên không gợi ý trường thật.
- [ ] Turnstile (Cloudflare, miễn phí theo `04`, **chưa kiểm chứng giá và giới hạn hiện tại**): render tường minh với `action = type`; script `challenges.cloudflare.com/turnstile/v0/api.js` chỉ tải khi người dùng tương tác lần đầu với form (`focusin`), không ở lần render đầu, để không ảnh hưởng LCP/TBT. Kiểm ở server: `success`, `hostname`, `action`.
- [ ] Rate-limit hai lớp (mục 3.8 + bước 4).
- [ ] CSP cho phép `script-src` và `frame-src` `https://challenges.cloudflare.com`; `connect-src 'self'`.

### 6.6 Log và theo dõi lỗi (`rules/logging.md`)
- [ ] Mọi dòng log của request có `correlationId`. Logger NestJS-style JSON, không `console.log`.
- [ ] Sự kiện và trường được log:

| Sự kiện | Mức | Trường được phép |
|---|---|---|
| `lead_received` | info | `correlationId`, `leadId`, `type`, `intent`, `locale`, `filmTier`, `utmSource`, `captcha` |
| `lead_rejected` | warn | `correlationId`, `type`, `code`, `fields` (chỉ tên trường lỗi, không giá trị) |
| `lead_honeypot` / `lead_rate_limited` / `lead_replayed` | warn / warn / info | `correlationId`, `type` |
| `lead_captcha_unverified` | warn | `correlationId`, `type`, `turnstileError` |
| `lead_notify_failed` / `lead_notify_dead` / `lead_notify_backlog` | warn / error / error | `leadId`, `channel`, `target`, `attempts`, `errorCode` |
| `lead_db_error` | error | `correlationId`, `type`, `error.message`, `stack` (chỉ ở log server) |

- [ ] **Không bao giờ log:** họ tên, SĐT, email, công ty, chức danh, ghi chú, IP thô, `ip_hash`, `turnstileToken`, body request, nội dung thông báo, địa chỉ hộp thư nhận.
- [ ] Sentry: `sendDefaultPii: false`; `beforeSend` xóa toàn bộ `request.data` và header `x-real-ip`/`x-forwarded-for` của mọi event thuộc `/api/v1/leads`.

### 6.7 Threat model rút gọn

| Mối đe dọa | Ví dụ | Chặn bằng |
|---|---|---|
| Spam / dồn lead rác | Bot điền form hàng loạt | Turnstile, honeypot, rate-limit 2 lớp, công tắc tắt form |
| Làm ngập DB / hộp thư | Botnet nhiều IP vượt rate-limit | Turnstile ở mọi lead; `lead_notify_backlog`; công tắc tắt form; giới hạn 16 KB |
| Injection | SQL qua `note`; HTML/script trong email; CRLF vào header email | SQL tham số hóa; escape HTML; Zod email không chứa CR/LF |
| Lộ dữ liệu cá nhân | Log, Sentry, email bị chuyển tiếp, bản sao lưu, chat nhóm | Mục 6.4 + 6.6; tiêu đề email không PII; sao lưu mã hóa; (c) chỉ gửi `reference` |
| Giả mạo IP để né rate-limit | Gửi header `X-Forwarded-For` tự chế | App chỉ đọc `X-Real-IP` do openresty ghi đè; app chỉ bind 127.0.0.1 |
| Gửi từ site khác | Form của bên thứ ba POST sang | Kiểm `Origin` + `hostname` của Turnstile |

---

## SECTION 7: Test Checklist

Chạy trên staging (Postgres thật, SMTP giả lập cục bộ, khóa test Turnstile). Mỗi PR form đính kèm bảng AC → test → pass/fail (prompt P7).

**HAPPY PATH**
- [ ] AC-C1/AC-B1: gửi B2B `quote` hợp lệ → 201; kiểm DB (`type`, `status`, `payload` đã chuẩn hóa, `consent_*`, `ip_hash` 64 hex, không IP thô ở mọi cột); `lead_notifications` có dòng `b2b_sales`; SMTP giả lập nhận 1 email, tiêu đề không chứa tên/SĐT/email.
- [ ] AC-B2: CTA demo → `intent='demo'`, cảm ơn đúng câu demo. AC-B3: trang sàn TMĐT → `integration`.
- [ ] AC-B5: 3 cách viết SĐT → cùng `+84902808049`. AC-B9: "Toàn quốc" → 34 mã. AC-B10: bỏ trống trường tùy chọn → `null`.
- [ ] AC-C11: luồng `/en`, không ký tự tiếng Việt trên form và màn hình cảm ơn, DB `locale='en'`.

**VALIDATION**
- [ ] AC-B4: SĐT `abc` → FE chặn inline; gọi thẳng API → 400, `details[0].field='fields.phone'`, `code='invalid_phone'`; số dòng `leads` không đổi.
- [ ] AC-B6: SĐT bàn → 400. Số `+1…` → 400. 11 chữ số → 400.
- [ ] AC-B7: email sai → 400. AC-B8: gmail → đúng theo [D-03].
- [ ] Thiếu từng trường bắt buộc → 400 `required` đúng tên trường. Tên 1 ký tự, 101 ký tự, chỉ khoảng trắng, có emoji → 400.
- [ ] `provinces` rỗng, 35 phần tử, mã lạ → 400. `customerType`/`monthlyVolume`/`intent` lạ → 400 `invalid_option`.
- [ ] Khóa lạ ở gốc, trong `fields`, trong `consent` (`status`, `id`, `ipHash`) → 400 `unknown_field`, không ghi DB.
- [ ] `utm` có khóa lạ, giá trị 500 ký tự; `pagePath='https://evil.example'`; `filmTier='X'`; `locale='fr'` → vẫn 201, dữ liệu được sửa đúng Rule 5, `meta.sanitized` liệt kê đủ.
- [ ] Body 17 KB → 413 JSON (qua openresty và gọi thẳng app). Content-Type `text/plain` → 400 `INVALID_JSON`.

**CONSENT / DỮ LIỆU CÁ NHÂN**
- [ ] AC-C2: HTML server và DOM sau hydrate không có checkbox `checked`.
- [ ] AC-C3: thiếu mục đích bắt buộc → 422 `CONSENT_REQUIRED`. Mục đích lạ → 400 `unknown_purpose`.
- [ ] Version cũ hơn cửa sổ 24 giờ → 409; version liền trước trong 24 giờ → 201.
- [ ] AC-C10: build production với câu đồng ý placeholder → form không render, có khối Gọi/Zalo/email, API 503. `DRAFT_PREVIEW` → form hiện nhãn "Nháp".
- [ ] Script DSR: `find` → `export` → `erase` một lead thử; sau `erase` không còn dòng ở `leads` và `lead_notifications`; `logs/leads-ops.log` có dòng không PII.

**CHỐNG SPAM**
- [ ] AC-C4: `hp='x'` → 201 giả; `leads` và SMTP giả lập không đổi; log có `lead_honeypot`.
- [ ] AC-C5: 6 request trong 10 phút từ cùng IP → lần 6 nhận 429 + `Retry-After` (test riêng lớp app với openresty bỏ qua, và test qua openresty). IP khác vẫn gửi được.
- [ ] Gửi header `X-Real-IP`/`X-Forwarded-For` tự chế qua openresty → không né được rate-limit.
- [ ] AC-C6: khóa test "luôn trượt" → 403 `CAPTCHA_FAILED`; thiếu token → 403; `hostname` sai → 403; token dùng lại → 403.
- [ ] Siteverify không truy cập được (chặn mạng ra hoặc trỏ URL test tới cổng đóng) → hành vi đúng [D-09].
- [ ] `Origin: https://evil.example` → 403 `FORBIDDEN_ORIGIN`. Không có `Origin` (curl) + Turnstile hợp lệ → 201.

**ĐỘ TIN CẬY**
- [ ] AC-C7: SMTP trỏ tới cổng không có dịch vụ → POST trả 201 trong ≤ 500 ms; lead trong DB; `attempts` tăng, `next_attempt_at` theo backoff; bật SMTP giả lập, chạy script retry → `status='sent'`.
- [ ] Chạy 2 script retry cùng lúc trên 20 dòng `pending` → mỗi dòng gửi đúng 1 lần.
- [ ] Hết 8 lần → `status='dead'`, log `lead_notify_dead`, Sentry nhận cảnh báo (không chứa PII).
- [ ] AC-C9: gửi lại cùng `Idempotency-Key` → 201 cùng `id`, header `Idempotent-Replayed`, không thêm dòng/thông báo. Hai request cùng key gửi song song → 1 dòng.
- [ ] DB dừng → 500 `INTERNAL_ERROR` có `correlationId`, không stack trace trong response.

**BẢO MẬT / LOG**
- [ ] AC-C8: chạy toàn bộ e2e với giá trị đánh dấu (vd tên `Sentinel Tên Thử`, SĐT `0987654321`, email `sentinel@congty-thu.vn`, ghi chú `SENTINEL-NOTE`), grep log ứng dụng, log retry, payload Sentry (transport test) → 0 kết quả; grep IP của máy test → 0 kết quả.
- [ ] `GET`, `PATCH`, `DELETE /api/v1/leads` → 405. `GET /api/v1/leads/<uuid>` → 404.
- [ ] `note` chứa `<img src=x onerror=alert(1)>` → email hiển thị nguyên văn dạng chữ.
- [ ] `/security` rà form + openresty + dependency (NFR-SEC-05). Response không có `X-Powered-By`.

**HIỆU NĂNG (NFR-SEC-06)**
- [ ] k6: 10 người dùng đồng thời, 5 phút, khóa test Turnstile, bỏ rate-limit bằng biến môi trường **chỉ trên staging** → p95 ≤ 500 ms, lỗi < 1%. Ghi rõ siteverify là gọi mạng thật.

**FE / A11Y**
- [ ] Mọi ô có `<label>` thật; lỗi nối bằng `aria-describedby`; bấm Gửi khi có lỗi → focus ô lỗi đầu tiên; màn hình cảm ơn nhận focus, `role="status"`. axe 0 lỗi serious/critical. Không animate trường form và thông báo lỗi.
- [ ] Turnstile không tải trước tương tác đầu tiên với form (Playwright đếm request tới `challenges.cloudflare.com`).
- [ ] AC-C12: `lead_submit` chỉ bắn khi 201 thật; `lead_error` đúng `code`; thuộc tính không có PII.
- [ ] Form không gây tràn ngang ở 9 breakpoint (NFR-COMP-01), VI và EN.

**REGRESSION**
- [ ] Trang chủ vẫn đúng 1 H1, form P8 không đẩy CLS > 0,1 (đặt sẵn kích thước khối cảm ơn và vùng Turnstile).
- [ ] `seo-render.spec`, `modes.spec`, `overflow.spec` vẫn xanh. `POST /api/contact` → 410 JSON (nếu [D-11] giữ đề xuất).
- [ ] Cutover: gửi 1 lead B2B thử có ghi chú `[TEST-CUTOVER]`, xác nhận tới đúng hộp thư, rồi xóa bằng `leads-dsr.mjs erase`.

---

## Phụ lục A: Điểm chờ quyết định

| Mã | Câu hỏi | Đề xuất mặc định | Ai |
|---|---|---|---|
| D-01 | Kênh thông báo: (a) email, (b) CRM-Bluebolt, (c) Lark/Zalo OA | (a) email theo bộ phận; (c) chỉ làm kênh nhắc thêm | Anh Duy |
| D-02 | Địa chỉ nhận thông báo của kinh doanh B2B và tuyển thợ | — (không tự quyết) | Anh Duy |
| D-03 | Email tên miền miễn phí ở form B2B | Nhận + gắn cờ, không chặn | Anh Duy |
| D-04 | Nhận số máy bàn (02x) ở form B2B? | Không (giữ regex đã giao) | Anh Duy |
| D-05 | Trường bắt buộc B2B | Chức danh và ghi chú tùy chọn, còn lại bắt buộc | Anh Duy |
| D-06 | Loại doanh nghiệp: chỉ Hãng/Sàn/Chuỗi hay thêm "Khác"? | Chỉ 3 loại | Anh Duy |
| D-07 | Mốc sản lượng đơn/tháng | <100 · 100–499 · 500–1.999 · ≥2.000 · Chưa rõ | Anh Duy + kinh doanh |
| D-09 | Turnstile không kiểm được (lỗi mạng) | Nhận lead, gắn cờ "chưa xác minh" | Anh Duy |
| D-10 | Honeypot dính: lưu hay không | Không lưu | Anh Duy |
| D-11 | `/api/contact` cũ | 410 JSON ≥ 90 ngày, không 308 | Anh Duy |
| D-12 | Thời gian gọi lại hiện ở màn hình cảm ơn (B2B, thợ) và giờ làm việc | — (placeholder trong `content/sla.ts`) | Anh Duy |
| D-14 | Ngưỡng rate-limit 5/10 phút/IP với thợ dùng 4G chung IP | Giữ, theo dõi tỉ lệ 429 hai tuần đầu | Anh Duy |
| D-15 | Gộp form "Thảo luận tích hợp" (trang sàn TMĐT) vào `lead_b2b` với `intent='integration'` | Có | Anh Duy |
| D-16 | Bỏ "ngành hàng" của `03` P8, theo `04` (loại khách + tỉnh) | Có | Anh Duy |
| D-17 | Giới hạn ở openresty: `limit_req` thô hay `resty.limit.count` chính xác | `limit_req` thô (app giữ ngưỡng chính xác) | Anh Duy + quản trị server |
| PC-01…05 | Câu chữ đồng ý; danh sách mục đích; thời hạn lưu (lead, hộp thư, sao lưu); kênh + thời hạn xử lý yêu cầu chủ thể dữ liệu; hồ sơ đánh giá tác động + bên xử lý ngoài lãnh thổ; số hiệu nghị định hướng dẫn | — (không tự quyết). Chưa có thì form tắt ở production | Pháp chế |

Ghi chú ước lượng: so với "Form lead theo contract: LM 9 giờ" ở `04` G4, contract này thêm hàng đợi thông báo + script retry, script DSR, idempotency, lỗi JSON ở openresty: **ước +3 giờ LM** (ước lượng, chưa phải số đo).
