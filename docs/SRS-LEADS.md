# SRS rút gọn — Form lead (B2B và đối tác thợ)

> Dự án: website Bluebolt Services (CTCP Công nghệ Tia Chớp Xanh) · Ngày 02/10/2026 · Phiên bản 0.1 · **APPROVED cùng hai contract lead (anh Duy duyệt 03/10/2026, D-26)**
> Chi tiết kỹ thuật (schema, API, mã lỗi, RBAC, test): `contracts/lead-b2b.md` (gồm phần chung) và `contracts/lead-technician.md`. Chỗ nào SRS và contract khác nhau thì theo contract.
> Căn cứ: `04` mục 2.5, 2.6, 7.3 · `03` mục 1.2, 13.1, 13.4 (P8), 13.5.

## 1. Mục tiêu

| # | Mục tiêu | Đo bằng |
|---|---|---|
| G1 | Không mất lead. Site cũ đang mất lead thợ (form `/system-map` không gửi request) và nhận SĐT "abc" | 0 lead hợp lệ bị mất khi kênh thông báo lỗi (AC-C7); so số lead tuần trước/sau cutover (`04` G8) |
| G2 | Mỗi nhóm khách có đúng một form gọn: Hãng/Sàn/Chuỗi (9 ô, 7 bắt buộc) và thợ (đúng 4 ô) | Đếm ô trong test; thời gian điền form thợ < 30 giây (đo 3 người thật) |
| G3 | Lead đủ thông tin để phân loại ngay: loại doanh nghiệp, sản lượng, tỉnh (B2B); tỉnh, kỹ năng (thợ) | Bộ phận nhận không phải gọi chỉ để hỏi lại các thông tin này |
| G4 | Thu dữ liệu cá nhân đúng Luật BVDLCN 91/2025 và nghị định hướng dẫn (pháp chế xác nhận số hiệu) | NFR-PDP-01: đồng ý theo mục đích, lưu version/thời điểm/mục đích, có kênh xóa/truy cập |
| G5 | Đo được chuyển đổi theo nhóm khách | Umami: `lead_submit{type}`, `lead_error{code}` |

## 2. Phạm vi

**Trong phạm vi:** form B2B "Nhận báo giá / Đặt lịch demo 30 phút" (`lead_b2b`), form "Đăng ký làm đối tác thợ" (`lead_technician`), API `POST /api/v1/leads`, bảng `leads` + hàng đợi thông báo, gửi thông báo cho bộ phận (kênh chờ anh chọn), màn hình cảm ơn, sự kiện analytics, script vận hành (thử lại thông báo, xử lý yêu cầu chủ thể dữ liệu).

**Ngoài phạm vi:** trang quản trị lead, đổi trạng thái lead, CMS, `/tra-cuu`, booking B2C (nhánh B), form bảo hành (P1, contract riêng), form liên hệ chung, chọn giờ demo trên lịch, tự gửi email/SMS/Zalo cho người điền, upload file.

## 3. Actor

| Actor | Mô tả | Làm gì với form |
|---|---|---|
| Khách B2B | Người đại diện Hãng điện máy, Sàn TMĐT, Chuỗi bán lẻ. Chủ yếu desktop | Gửi form B2B |
| Thợ kỹ thuật | Thợ điện lạnh/điện máy. Chủ yếu điện thoại, thường mở link từ Zalo/Facebook | Gửi form thợ |
| Kinh doanh B2B | Nhận lead B2B qua kênh thông báo, gọi lại | Đọc thông báo `lead_b2b` |
| Tuyển thợ | Nhận lead thợ, gọi lại hướng dẫn lộ trình gia nhập | Đọc thông báo `lead_technician` |
| Quản trị kỹ thuật | Người được anh Duy chỉ định bằng văn bản | Chạy script retry/xuất/xóa, xử lý lead thông báo thất bại |
| Hệ thống | Route Handler, script thử lại, Cloudflare Turnstile | Kiểm tra, lưu, gửi thông báo |
| Pháp chế | — | Viết câu đồng ý, thời hạn lưu, quy trình yêu cầu chủ thể dữ liệu |

## 4. Điểm vào

| Trang | Form | `type` / `intent` |
|---|---|---|
| Trang chủ: khối CTA cuối (P8) | B2B | `lead_b2b` / `quote` hoặc `demo` theo nút bấm |
| Trang chủ: CTA chính shot 0 "Nhận báo giá cho doanh nghiệp" | Cuộn tới form P8 | `quote` |
| Trang chủ: CTA phụ "Đăng ký làm đối tác thợ", card "Thợ kỹ thuật" ở "Ba cửa vào" | Sang `/doi-tac-tho#dang-ky` | `lead_technician` |
| `/giai-phap/hang-dien-may` (cuối trang) | B2B | `quote` / `demo` |
| `/giai-phap/san-tmdt-ban-le` ("Thảo luận tích hợp") | B2B | `integration` (chờ anh, D-15) |
| `/bang-gia` (giá theo hợp đồng cho B2B) | B2B | `quote` |
| `/doi-tac-tho#dang-ky` + thanh dính đáy mobile "Đăng ký thợ" | Thợ | `lead_technician` |
| Header "Nhận báo giá", thanh dính đáy mobile "Nhận báo giá" | Cuộn tới form B2B của trang hiện tại, không có thì sang trang chủ `#bao-gia` | `quote` |
| `/lien-he` | Không có form riêng: link tới form B2B và `/doi-tac-tho#dang-ky`, kèm hotline/Zalo/email theo bộ phận | — |
| Bản EN của các trang trên | Như bản VI | `locale='en'` |

Mỗi trang chỉ một khối form (UX-32). Khách lẻ (nhánh A) không có form trong phạm vi này: hotline/Zalo, đăng ký bảo hành ở P1.

## 5. Luồng chính

**5.1 Khách B2B**
1. Khách bấm "Nhận báo giá" hoặc "Đặt lịch demo 30 phút". Form hiện tiêu đề tương ứng.
2. Khách nhập: họ tên, công ty, chức danh (tùy chọn), số di động, email công ty, loại doanh nghiệp, sản lượng đơn/tháng, tỉnh triển khai (chọn nhiều, có "Toàn quốc"), ghi chú (tùy chọn). Lỗi định dạng báo ngay khi rời ô.
3. Lần đầu khách chạm vào form, trang mới tải Turnstile (không tải lúc vào trang).
4. Khách đọc câu đồng ý (pháp chế viết) và tick mục đích bắt buộc; mục đích tùy chọn để trống nếu không muốn. Không ô nào tick sẵn.
5. Khách bấm "Gửi yêu cầu". Nút chuyển trạng thái đang gửi, không bấm lại được.
6. Hệ thống kiểm tra, lưu lead, trả mã tham chiếu.
7. Form được thay tại chỗ bằng màn hình cảm ơn (mục 7). Gửi `lead_submit`.
8. Sau đó hệ thống gửi thông báo cho kinh doanh B2B; lỗi thì tự thử lại (tối đa ~22 giờ).

**5.2 Thợ kỹ thuật**
1. Thợ vào `/doi-tac-tho` (thường từ Zalo/Facebook), bấm "Đăng ký thợ" hoặc cuộn tới form.
2. Thợ nhập đúng 4 ô: họ tên, số di động (Zalo), tỉnh/thành nhận việc chính, kỹ năng chính.
3. → 8. Như luồng B2B (bước 3–8), thông báo đi tới bộ phận tuyển thợ; màn hình cảm ơn có lộ trình gia nhập 4 bước.

## 6. Luồng phụ và ngoại lệ

| # | Tình huống | Hệ thống | Người dùng thấy |
|---|---|---|---|
| A1 | Dữ liệu sai (vd SĐT "abc") | FE chặn; nếu lọt, API 400 `VALIDATION_ERROR` | Lỗi ngay dưới ô, focus ô lỗi đầu tiên. Dữ liệu giữ nguyên |
| A2 | Chưa tick mục đích bắt buộc | FE chặn; API 422 `CONSENT_REQUIRED` | Lỗi tại checkbox, giải thích vì sao cần đồng ý |
| A3 | Xác minh Turnstile thất bại / hết hạn | 403 `CAPTCHA_FAILED`, widget làm mới | "Xác minh chưa thành công, vui lòng thử lại" |
| A4 | Gửi quá 5 lần/10 phút từ một IP | 429 `RATE_LIMITED` | "Vui lòng thử lại sau N phút hoặc gọi 0902 808 049" |
| A5 | Lỗi hệ thống (DB) | 500 `INTERNAL_ERROR`, log có `correlationId` | "Hệ thống đang lỗi", hotline/Zalo, mã lỗi 8 ký tự. Dữ liệu giữ nguyên |
| A6 | Mạng rớt | Gửi lại cùng `Idempotency-Key`, không tạo trùng | "Chưa gửi được, bấm gửi lại" |
| A7 | Form đang tắt (pháp chế chưa duyệt, spam, bảo trì) | API 503 `LEADS_DISABLED` | Không có form; khối Gọi · Zalo · email bộ phận |
| A8 | Điều khoản đổi khi tab đang mở | 409 `CONSENT_VERSION_OUTDATED` | "Điều khoản vừa cập nhật", tải lại, dữ liệu điền lại, tick lại |
| A9 | Bot điền ô bẫy | Trả thành công giả, không lưu, không thông báo | (bot) thấy thành công |
| A10 | Kênh thông báo lỗi | Lead đã lưu; thử lại theo lịch; hết lượt → cảnh báo quản trị kỹ thuật | Không thấy gì khác (đã nhận màn hình cảm ơn) |
| A11 | Tắt JavaScript | Không gửi được | `<noscript>`: hotline, Zalo, email bộ phận |
| A12 | Trình duyệt trong app Zalo/Facebook chặn Turnstile (chưa kiểm chứng) | — | Nút "Mở bằng trình duyệt" + hotline/Zalo |

## 7. Màn hình cảm ơn

Thay form tại chỗ (không đổi URL, không có trang `/cam-on`). Focus vào tiêu đề, `role="status"`. Không animate. Giữ đúng kích thước khối form để CLS không tăng.

| Thành phần | B2B — `quote` / `integration` | B2B — `demo` | Thợ |
|---|---|---|---|
| Tiêu đề | "Bluebolt đã nhận yêu cầu của bạn" | "Bluebolt đã nhận yêu cầu đặt lịch demo" | "Bluebolt đã nhận đăng ký của bạn" |
| Mã tham chiếu | "Mã yêu cầu: 0B9F3C2E" | như trái | như trái |
| Thời gian gọi lại | "Bộ phận kinh doanh sẽ gọi lại trong **[SLA: `content/sla.ts` → `leadCallback.b2b`]** ([giờ làm việc: `businessHours`])" | "Bluebolt sẽ gọi trong **[SLA]** để chốt lịch demo 30 phút" | "Bộ phận tuyển thợ sẽ gọi lại trong **[SLA: `leadCallback.technician`]**" |
| Tiếp theo | Link tài liệu giải pháp (nếu có trong `content/`) | — | Lộ trình gia nhập 4 bước (Đăng ký → E-KYC → Đào tạo → Nhận đơn) từ `content/process.ts`; link tải app nếu đã duyệt |
| Cần gấp | Hotline `0902 808 049` (EN `+84 902 808 049`), Zalo | như trái | như trái |

**SLA đang là placeholder, chờ anh chốt (D-12, `03` mục 14.2).** Production: SLA chưa duyệt thì **ẩn cả câu thời gian gọi lại**, không hiện số đoán. Bản xem trước `DRAFT_PREVIEW`: hiện placeholder kèm nhãn "Nháp".

## 8. Sự kiện analytics (Umami tự host, không cookie)

| Sự kiện | Khi nào | Thuộc tính |
|---|---|---|
| `lead_submit` | Nhận 201 thật (không tính replay, không tính lỗi) | `type`, `intent` (chỉ B2B), `locale`, `filmTier` |
| `lead_error` | Phản hồi khác 2xx, lỗi mạng, hoặc bấm Gửi khi còn lỗi nhập | `type`, `code` (mã lỗi API, `NETWORK_ERROR`, `CLIENT_VALIDATION`) |

Không thuộc tính nào chứa họ tên, SĐT, email, công ty, ghi chú. Liên quan sự kiện chung ở `04` mục 2.6 (`cta_click{target}`, `call_click`, `zalo_click`).

## 9. Yêu cầu phi chức năng liên quan (`04` mục 7.3)

| NFR | Yêu cầu chính với form | Fail thì |
|---|---|---|
| NFR-SEC-04 | Zod ở server, honeypot + Turnstile, 5 lần/10 phút/IP (429), không lộ stack trace, 0 PII trong log | Không bật form |
| NFR-SEC-06 | p95 ≤ 500 ms, lỗi < 1% ở 10 người dùng đồng thời trong 5 phút (k6) | Tối ưu trước BBNT |
| NFR-PDP-01 | Chính sách do pháp chế duyệt, đồng ý theo mục đích không tick sẵn, lưu version/thời điểm/mục đích, kênh rút đồng ý/xóa/truy cập, hồ sơ đánh giá tác động | Không bật form |
| NFR-AVAIL-02 | Sao lưu hằng ngày (mã hóa, ngoài server), RPO ≤ 24 h, RTO ≤ 4 h, diễn tập restore trước launch | Chưa bật form |
| NFR-A11Y-01, NFR-COMP-01 | axe 0 lỗi serious/critical; không tràn ngang ở 9 breakpoint | Chặn merge |

## 10. Điều kiện để bật form trên production

Form chỉ bật (`LEADS_FORM_ENABLED=true`) khi đủ:
1. `contracts/lead-b2b.md` và `contracts/lead-technician.md` có **STATUS: APPROVED** (kèm email xác nhận của anh Duy).
2. Pháp chế giao: câu đồng ý + mục đích, thời hạn lưu, kênh xử lý yêu cầu chủ thể dữ liệu, hồ sơ đánh giá tác động, trang `/chinh-sach-bao-mat` (PC-01 → PC-05).
3. Anh chọn kênh thông báo (D-01) và cho địa chỉ nhận (D-02). Nếu email: tên miền gửi có SPF/DKIM/DMARC.
4. Diễn tập restore sao lưu đạt (NFR-AVAIL-02).
5. Khóa Turnstile production đã tạo cho đúng tên miền; openresty đã áp cấu hình đã sửa (`lead-b2b.md` mục 3.8).
6. Gửi lead thử khi cutover tới đúng hộp thư, sau đó xóa.

Chưa đủ thì site vẫn launch được (mốc M2): các vị trí form hiện khối Gọi · Zalo · email bộ phận.
