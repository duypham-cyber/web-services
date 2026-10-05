# RUNBOOK — Form lead (B2B + đối tác thợ)

> Contract: `contracts/lead-b2b.md` (phần chung + B2B) và `contracts/lead-technician.md`, APPROVED 03/10/2026 (`docs/DECISIONS.md` D-26).
> SRS: `docs/SRS-LEADS.md`. Viết cho quản trị kỹ thuật (người anh Duy chỉ định bằng văn bản) và dev tiếp quản.
> Cập nhật: 03/10/2026, agent LEADS bước 1 (backend). Phần giao diện form (bước 2) ghi bổ sung khi xong.
> 03/10/2026 (sau review): sửa (M1, M2, L1–L6, L8) — quyền cột `lead_notifications`, IPv6 /64, TLS SMTP, khóa test Turnstile,
> cửa sổ 24 giờ của câu đồng ý, export DSR không ghi đè; rủi ro đã biết ở mục 15.

## 1. Thành phần

| Thành phần | File | Ghi chú |
|---|---|---|
| API nhận lead | `app/api/v1/leads/route.ts` → `lib/leads/handler.ts` | Chỉ `POST`. GET/PUT/PATCH/DELETE trả 405 |
| Endpoint cũ | `app/api/contact/route.ts` | `POST` trả 410 `ENDPOINT_GONE` (D-11), giữ ≥ 90 ngày sau cutover |
| Kiểm dữ liệu | `lib/leads/schema.ts` (Zod), `lib/leads/rules.ts` (hằng số, chuẩn hóa — dùng được ở trình duyệt) | |
| Câu đồng ý | `content/consent.ts` + `lib/leads/consent.ts` | **Bản nháp, chưa `approvedBy`** → production tắt form |
| Trạng thái form cho trang | `lib/leads/form-state.ts` → `getLeadFormState(type, locale)` | Server Component gọi, truyền xuống form |
| DB | `db/migrations/*.mjs`, `scripts/db-migrate.mjs`, `lib/leads/db.ts` | Bảng `leads`, `lead_notifications` (outbox) |
| Gửi thông báo | `lib/leads/outbox.ts`, `lib/leads/notify/{email,transport}.ts` | Email theo bộ phận (D-01 a) |
| Thử lại | `scripts/leads-notify-retry.mjs` + timer `deploy/leads/*` (chỉ bbsw) | Mỗi 5 phút |
| Yêu cầu chủ thể dữ liệu | `scripts/leads-dsr.mjs` | find / export / erase |
| Dọn theo thời hạn lưu | `scripts/leads-cleanup.mjs` | Tắt khi `LEAD_RETENTION_DAYS` trống (PC-03) |
| openresty | `deploy/openresty/lapdattoanquoc.conf` (`location = /api/v1/leads`) | Sinh từ `scripts/gen-openresty-map.mjs`, đã có mục 3.8 |

Luồng một request: form tắt? → Origin → JSON ≤ 16 KB → rate-limit → parse → honeypot → Idempotency-Key → Zod → consent →
Turnstile → một transaction ghi `leads` + `lead_notifications` → 201 → `after()` gửi email lần 1. Gửi lỗi thì script thử lại.

## 2. Biến môi trường

Đọc lúc chạy (API, script). Trang có form đọc lúc **build** (trang tĩnh): đổi `LEADS_FORM_ENABLED`/site key thì phải build lại
trang; API vẫn kiểm lại ở mỗi request và trả 503 nếu form đã tắt.

| Biến | Bắt buộc | bbsw (dev 3091 + bản xem trước 9515) | Production |
|---|---|---|---|
| `LEADS_FORM_ENABLED` | Có | `true` | `false` cho tới khi đủ checklist mục 12. Công tắc tắt khẩn cấp |
| `DATABASE_URL` | Có | role `bb_app`, DB `bluebolt_web` | role `bb_app`, host trong mạng Docker nội bộ |
| `DATABASE_URL_OWNER` | Migration | role `bb_owner` | Chỉ lúc chạy migration (không để trong env của app) |
| `DATABASE_URL_OPS` | Script DSR/dọn | role `bb_ops` | Chỉ trên máy quản trị kỹ thuật |
| `DATABASE_URL_TEST`, `_TEST_OWNER`, `_TEST_OPS` | Test tích hợp | DB `bluebolt_web_test` | Không dùng |
| `LEAD_IP_HASH_SECRET` | Có | 64 hex ngẫu nhiên | ≥ 32 byte ngẫu nhiên, từ secret. Đổi khóa = mất khả năng so `ip_hash` cũ/mới (chấp nhận) |
| `LEAD_CLIENT_IP_SOURCE` | Không | `xff-last` | `x-real-ip` (sau openresty) hoặc `xff-last`. Xem mục 9 |
| `LEAD_ALLOWED_ORIGINS` | Có | `http://127.0.0.1:3091,http://localhost:3091,http://<IP Tailscale của máy chủ>:9515,http://<IP LAN của máy chủ>:9515` | `https://lapdattoanquoc.vn` (+ origin staging) |
| `LEAD_RATE_LIMIT_MAX`, `LEAD_RATE_LIMIT_WINDOW_SEC` | Không | `20` / `600` (nới để anh thử nhiều lần) | **Để trống** → 5 lần / 600 giây (contract, D-14) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Có | `1x00000000000000000000AA` (khóa test Cloudflare, luôn qua) | Site key thật của tên miền (lúc build) |
| `TURNSTILE_SECRET_KEY` | Có | `1x0000000000000000000000000000000AA` (test, luôn qua) | Secret thật. Khóa test ở production → API coi là lỗi cấu hình, trả 503; kết quả khóa test lọt qua siteverify → 403 (mục 10) |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Có (khóa thật) | `localhost,127.0.0.1,<IP Tailscale của máy chủ>,<IP LAN của máy chủ>` | `lapdattoanquoc.vn` (+ staging) |
| `TURNSTILE_TIMEOUT_MS` | Không | mặc định 3000 | 3000 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | Production | trống | Có. Tên miền gửi phải có SPF/DKIM/DMARC. **TLS bắt buộc**: cổng 465 (hoặc `SMTP_SECURE=true`) dùng TLS ngay; cổng khác (587…) bắt buộc STARTTLS — máy chủ không hỗ trợ thì không gửi (lỗi `SMTP_…`, outbox thử lại). TLS ≥ 1.2, kiểm chứng chỉ. Chỉ relay loopback (`localhost`, `127.x`, `::1`) được miễn |
| `SMTP_FROM` | Có | `Bluebolt Website (ban xem truoc) <leads@lapdattoanquoc.invalid>` | Địa chỉ gửi thật đã cấu hình SPF/DKIM |
| `LEAD_MAIL_TRANSPORT`, `LEAD_MAIL_DIR` | Chỉ dev/preview | `file`, `.cache/lead-mail` | Không đặt (bị từ chối ở production) |
| `LEAD_NOTIFY_EMAIL_B2B` | Có | `chua-co-dia-chi@invalid` (giữ chỗ, D-02) | Hộp thư kinh doanh B2B — **chờ anh Duy** |
| `LEAD_NOTIFY_EMAIL_TECHNICIAN` | Có | `chua-co-dia-chi@invalid` (giữ chỗ, D-02) | Hộp thư tuyển thợ — **chờ anh Duy** |
| `LEAD_RETENTION_DAYS` | Không | trống (script dọn tắt) | Theo pháp chế (PC-03) |
| `LEAD_OPS_LOG` | Không | mặc định `logs/leads-ops.log` | Đường dẫn nhật ký vận hành |
| `DRAFT_PREVIEW` | — | `1` ở dev và bản xem trước | Không đặt. Có cờ này thì câu đồng ý nháp được dùng |

Máy bbsw: khối biến nằm trong `.env.local` (gitignore, quyền 600) giữa hai dòng `# >>> leads` / `# <<< leads`, do
`node scripts/db-dev-setup.mjs` ghi. Chạy lại script không đổi mật khẩu, không đụng dòng khác. KHÔNG in, KHÔNG chép file này.
`next dev` (3091) và `next start` của bản xem trước (3092) đều tự đọc `.env.local`; dev server nhận thay đổi không cần
khởi động lại (đã kiểm 03/10/2026 bằng một lead thật qua API, sau đó xóa bằng `leads-dsr.mjs erase`).

## 3. Postgres

### bbsw (dev + bản xem trước)
- Container `bluebolt-web-db` (postgres:16-alpine), chỉ `127.0.0.1:5450`, volume `bluebolt-web-db`, `--restart unless-stopped`,
  `--memory 256m`, `shared_buffers=32MB`. Log server không ghi DETAIL/câu lệnh lỗi (tránh lộ dữ liệu dòng).
- Tạo/sửa: `node scripts/db-dev-setup.mjs` (chạy lại bao nhiêu lần cũng được).
- Ba role: `bb_owner` (chủ schema, chạy migration), `bb_app` (app + script retry: INSERT/SELECT `leads`; INSERT/SELECT
  `lead_notifications` + UPDATE **chỉ 5 cột** `status, attempts, next_attempt_at, last_error_code, sent_at`; không DDL, không
  UPDATE/DELETE `leads`, không DELETE `lead_notifications`), `bb_ops` (SELECT/DELETE `leads`, SELECT `lead_notifications`).
  Code thêm câu UPDATE mới trên `lead_notifications` mà SET cột khác → "permission denied" (cố ý).
  Superuser `postgres` không có mật khẩu → quản trị bằng `docker exec -it bluebolt-web-db psql -U postgres`.
- Hai database: `bluebolt_web` (dev + bản xem trước dùng chung), `bluebolt_web_test` (test tích hợp).
- Kiểm: `docker ps --filter name=bluebolt-web-db` · `docker logs --tail 50 bluebolt-web-db`.

### Production (devops, G4)
- Postgres 16 trong mạng Docker nội bộ, **không publish cổng**. Role + mật khẩu từ secret, KHÔNG commit:
  ```sql
  CREATE ROLE bb_owner LOGIN PASSWORD '<secret>';
  CREATE ROLE bb_app   LOGIN PASSWORD '<secret>' CONNECTION LIMIT 20;
  CREATE ROLE bb_ops   LOGIN PASSWORD '<secret>' CONNECTION LIMIT 5;
  CREATE DATABASE bluebolt_web OWNER bb_owner;
  REVOKE ALL ON DATABASE bluebolt_web FROM PUBLIC;
  GRANT CONNECT ON DATABASE bluebolt_web TO bb_app, bb_ops;
  \connect bluebolt_web
  ALTER SCHEMA public OWNER TO bb_owner;
  REVOKE ALL ON SCHEMA public FROM PUBLIC;
  GRANT USAGE ON SCHEMA public TO bb_app, bb_ops;
  ```
  Quyền mức bảng do migration cấp (chỉ khi role đã tồn tại → tạo role TRƯỚC khi chạy migration).
- Sao lưu (NFR-AVAIL-02, điều kiện bật form): `pg_dump` hằng ngày, **mã hóa trước khi chuyển ra ngoài server** (có dữ liệu cá
  nhân), RPO ≤ 24 h, RTO ≤ 4 h, diễn tập restore 1 lần trước launch. Thời hạn giữ bản sao lưu: theo pháp chế (PC-03).

## 4. Migration

```bash
node scripts/db-migrate.mjs status          # DB dev (DATABASE_URL_OWNER)
node scripts/db-migrate.mjs up
node scripts/db-migrate.mjs up --test       # DB test (DATABASE_URL_TEST_OWNER)
node scripts/db-migrate.mjs down --test     # hoàn tác 1 bước (từ chối nếu bảng còn dữ liệu, trừ --force)
MIGRATION_DATABASE_URL=postgres://bb_owner:…@db:5432/bluebolt_web node scripts/db-migrate.mjs up   # production
```
- Mỗi file một transaction; bảng `schema_migrations` ghi version; khóa advisory chống chạy chồng.
- **KHÔNG chạy `down` trên production khi bảng đã có lead** (mất dữ liệu). Rollback app không cần rollback DB.
- Migration hiện có (đều đã chạy up → down → up trên cả `bluebolt_web` và `bluebolt_web_test`):
  - `20261003144700-create-leads.mjs` — hai bảng, index, trigger `updated_at`, quyền mức bảng.
  - `20261003184500-narrow-notification-grants.mjs` — thu hẹp UPDATE của `bb_app` trên `lead_notifications` xuống 5 cột trạng
    thái gửi (review L8). Chỉ đổi quyền → `down` an toàn (trả lại UPDATE cả bảng). Sau migration: timer retry vẫn nhận việc và
    gửi được (kiểm 03/10/2026: `claimed 1, sent 1`, `--requeue-dead` chạy được).
  Kiểm quyền: `docker exec bluebolt-web-db psql -U postgres -d bluebolt_web -c "\dp lead_notifications"` → `bb_app=ar` mức
  bảng + `bb_app=w` trên đúng 5 cột.

## 5. Timer thử lại thông báo (chỉ bbsw / bản xem trước)

```bash
cp deploy/leads/bluebolt-web-leads-retry.{service,timer} ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now bluebolt-web-leads-retry.timer
systemctl --user list-timers bluebolt-web-leads-retry.timer       # lần chạy kế tiếp
journalctl --user -u bluebolt-web-leads-retry -n 20 --no-pager    # mỗi lượt một dòng lead_notify_run
systemctl --user start bluebolt-web-leads-retry.service           # chạy ngay một lượt
```
Đã cài và bật trên bbsw ngày 03/10/2026. Gỡ: `systemctl --user disable --now bluebolt-web-leads-retry.timer`.

Production: KHÔNG dùng timer này. Chọn một trong hai (devops, G4): cron trên host
`*/5 * * * * docker compose run --rm web node scripts/leads-notify-retry.mjs`, hoặc service `lead-notifier` dùng cùng image chạy
vòng lặp 5 phút. Cả hai an toàn khi chạy chồng nhau (lease + `FOR UPDATE SKIP LOCKED`).

Lịch thử: lần 1 ngay (trong `after()`), rồi sau 1 phút · 5 phút · 15 phút · 1 giờ · 3 giờ · 6 giờ · 12 giờ (8 lần, ~22 giờ).
Timer 5 phút nên khoảng "1 phút" thực tế là ≤ 5 phút.

## 6. Dead letter (thông báo hết lượt thử)

Dấu hiệu: log `error` sự kiện `lead_notify_dead` (Sentry sẽ cảnh báo khi có DSN) hoặc `lead_notify_backlog` (pending > 30 phút).

```bash
# Xem các dòng chưa gửi được (không in nội dung lead)
docker exec bluebolt-web-db psql -U postgres -d bluebolt_web -c \
  "select lead_id, target, status, attempts, last_error_code, next_attempt_at from lead_notifications where status <> 'sent' order by created_at"
```
| `last_error_code` | Nghĩa | Xử lý |
|---|---|---|
| `MAIL_TRANSPORT_MISSING` | Production không có `SMTP_HOST` | Khai SMTP, khởi động lại app |
| `NO_RECIPIENT` / `RECIPIENT_PLACEHOLDER` | Thiếu địa chỉ nhận hoặc còn `…@invalid` | Khai `LEAD_NOTIFY_EMAIL_*` thật |
| `SMTP_ECONNECTION`, `SMTP_ETIMEDOUT`, `SMTP_ECONNREFUSED` | Không kết nối được SMTP | Kiểm host/port/firewall |
| `SMTP_EAUTH` | Sai tài khoản SMTP | Kiểm `SMTP_USER`/`SMTP_PASS` |
| `SMTP_5xx` | Máy chủ thư từ chối (vd SPF/DKIM) | Kiểm DNS tên miền gửi |

Sau khi sửa nguyên nhân:
```bash
node scripts/leads-notify-retry.mjs --requeue-dead                 # mọi dòng dead → pending (attempts = 0), gửi ngay lượt này
node scripts/leads-notify-retry.mjs --requeue-dead --lead <uuid>   # chỉ một lead
```
Không sửa được ngay: xuất lead (`leads-dsr.mjs export`, mục 7) và chuyển tay cho bộ phận qua kênh nội bộ, ghi lại mã tham chiếu.

## 7. Yêu cầu của chủ thể dữ liệu (truy cập / xóa) — chỉ quản trị kỹ thuật

```bash
node scripts/leads-dsr.mjs find --phone "0902 808 049"     # hoặc --email <địa chỉ> | --reference 0B9F3C2E
node scripts/leads-dsr.mjs export --id <uuid> --out /tmp/yeu-cau-<mã>.json   # tệp MỚI quyền 600, không in ra màn hình
node scripts/leads-dsr.mjs erase --id <uuid> --yes          # DELETE thật, cascade sang lead_notifications
```
- Chạy bằng role `bb_ops` (`DATABASE_URL_OPS`). Mỗi lần chạy ghi một dòng KHÔNG PII vào `logs/leads-ops.log` (người chạy,
  thời điểm, lệnh, loại tìm, id) — không ghi số điện thoại/email đã tìm.
- `export` chỉ tạo tệp mới (`O_EXCL`): `--out` đã tồn tại (kể cả symlink) → báo lỗi "đã tồn tại", không ghi đè, không đổi quyền
  tệp cũ. Xóa tệp cũ hoặc chọn tên khác rồi chạy lại.
- Gửi tệp export cho chủ thể dữ liệu qua kênh pháp chế quy định (PC-04), rồi xóa tệp.
- Bản sao trong hộp thư nhận thông báo và trong bản sao lưu: xử lý theo hướng dẫn pháp chế (PC-03). Email thông báo có mã
  tham chiếu để tìm.

## 8. Dọn theo thời hạn lưu

`node scripts/leads-cleanup.mjs [--dry-run]` — xóa lead cũ hơn `LEAD_RETENTION_DAYS` ngày. **Tắt** khi biến trống (hiện tại:
chờ pháp chế, PC-03). Khi có số: chạy hằng ngày bằng cron, `--dry-run` lần đầu để xem số dòng.

## 9. IP, rate-limit, openresty

- App KHÔNG lưu/log IP thô. `ip_hash = HMAC-SHA256(khóa gom, LEAD_IP_HASH_SECRET)`; IP chỉ sống trong bộ nhớ request; siteverify
  không nhận `remoteip`. Khóa gom (`ipBucket` trong `lib/leads/ip.ts`): IPv4 giữ nguyên địa chỉ; **IPv6 gom theo tiền tố /64**
  (một thuê bao IPv6 thường có cả khối /64 và tự đổi địa chỉ trong khối). Rate-limit và cột `ip_hash` cùng dùng khóa này.
- **Bất biến triển khai** (vi phạm = client tự chọn IP, né được rate-limit): app chỉ tin phần tử `X-Forwarded-For` do proxy tin
  cậy nối vào (openresty production, proxy 9515 bản xem trước); app chỉ bind loopback, không có đường nào từ ngoài máy vào thẳng
  app. Thêm proxy/CDN nào trước openresty thì phải cấu hình openresty lấy IP thật từ proxy đó trước khi nối header. Có Cloudflare
  proxy → bắt buộc `real_ip_header CF-Connecting-IP` + `set_real_ip_from` đúng dải IP Cloudflare.
- App chỉ bind `localhost` → mọi kết nối tới app là tiến trình trên chính máy đó (proxy 9515 hoặc openresty). Tin header:
  - `xff-last` (mặc định): lấy phần tử **cuối** của `X-Forwarded-For` — proxy bản xem trước (`deploy/preview/proxy.mjs`) và
    openresty (`$proxy_add_x_forwarded_for`) đều nối IP socket vào cuối; gọi thẳng app thì Next tự đặt 127.0.0.1. Phần client
    tự khai ở đầu chuỗi bị bỏ qua.
  - `x-real-ip`: đọc `X-Real-IP` do openresty ghi đè (`snippets/bb-proxy-headers.conf`). Sau `proxy.mjs` (từ 05/10/2026, D-30):
    header này chỉ được giữ khi kết nối đến từ IP trong `PREVIEW_TRUSTED_PROXIES` (openresty); nơi khác thì proxy ghi đè bằng IP
    socket, nên client tự khai không có tác dụng.
  - Có Cloudflare proxy trước openresty → bật `real_ip_header CF-Connecting-IP` + `set_real_ip_from` dải IP Cloudflare
    (contract mục 3.8, giả định hiện tại: không có Cloudflare proxy).
- Rate-limit chính xác trong app: cửa sổ trượt, mặc định 5 request / 600 giây / `ip_hash`, lưu trong **bộ nhớ tiến trình**
  (contract mục 3.4: "bộ đếm trong bộ nhớ của instance"; blue/green 2 instance thì vài phút nới gấp đôi — chấp nhận). Request bị
  429 không được tính thêm. Lớp thô ở openresty: `limit_req zone=bb_leads rate=1r/m burst=4`.
- openresty: `location = /api/v1/leads` đã có trong `deploy/openresty/lapdattoanquoc.conf` (16 KB, 429/413 JSON, header IP).
  File sinh từ `scripts/gen-openresty-map.mjs` — sửa ở script sinh, không sửa tay. **CSP cho Turnstile chưa có** (site chưa có
  CSP nào): khi thêm CSP phải cho `script-src`/`frame-src https://challenges.cloudflare.com`, `connect-src 'self'`.

- **Bản trưng bày services.bluebolt.software (D-30)**: chuỗi là khách → openresty (máy khác) → `proxy.mjs` (<IP Tailscale của máy chủ>:9515, tin
  `X-Forwarded-*`/`X-Real-IP` CHỈ từ openresty <IP Tailscale của máy openresty>) → app. Phần tử cuối của `X-Forwarded-For` vì vậy là IP của openresty,
  không phải IP khách → để `xff-last` thì mọi khách chung một bucket rate-limit. Trước khi bật form trên tên miền này:
  - cho openresty gửi `X-Real-IP $remote_addr` và đặt `LEAD_CLIENT_IP_SOURCE=x-real-ip` cho bản công khai (`proxy.mjs` đã giữ
    nguyên header này khi đến từ openresty và ghi đè khi đến từ nơi khác); hoặc thêm cấu hình số hop tin cậy;
  - bỏ `LEADS_FORM_ENABLED=false` và các biến DB rỗng trong `.env.public`; `deploy/preview/update.sh` truyền
    `LEADS_FORM_ENABLED=false` lúc build bản công khai — sửa cả chỗ đó;
  - CSP tối thiểu của proxy hiện không giới hạn script nên không chặn Turnstile; khi siết CSP phải mở `challenges.cloudflare.com`.

## 10. Turnstile

- Khóa test chính thức (tra developers.cloudflare.com/turnstile/troubleshooting/testing, 03/10/2026): site key
  `1x00000000000000000000AA` (hiện, luôn qua) · `2x00000000000000000000AB` (luôn trượt) · secret `1x0000000000000000000000000000000AA`
  (luôn qua) · `2x…AA` (luôn trượt) · `3x…AA` (token đã dùng). Token giả `XXXX.DUMMY.TOKEN.XXXX`.
- Với secret test, app bỏ kiểm `hostname`/`action` (siteverify test không trả đúng hostname của site) và gắn `meta.captcha='test'`.
  Chỉ ở dev/bản xem trước: trên site thật (`NODE_ENV=production`, không `DRAFT_PREVIEW`), kết quả khóa test (secret test hoặc
  `metadata.result_with_testing_key`) bị coi là trượt → 403 `CAPTCHA_FAILED` + log `error` `lead_captcha_misconfigured`
  (`turnstileError: testing-key-on-production`). Thấy log này: thay site key/secret thật rồi build lại.
- Production: tạo widget cho `lapdattoanquoc.vn`, `action` = `lead_b2b` / `lead_technician`; app kiểm `success`, `hostname`
  (∈ `TURNSTILE_ALLOWED_HOSTNAMES`), `action`. Lỗi mạng/timeout/5xx của Cloudflare → vẫn nhận lead, `meta.captcha='unverified'`,
  email gắn cảnh báo (D-09). Secret sai → log `error` `lead_captcha_misconfigured`.

## 11. Anh Duy xem lead trên bản xem trước

Bản xem trước (9515) và dev (3091) dùng chung DB `bluebolt_web`; email thông báo **không gửi thật**, mà ghi thành tệp:

```bash
ls -lt /home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/.cache/lead-mail/     # mỗi email một tệp .eml, mở bằng Thunderbird/Outlook
docker exec -it bluebolt-web-db psql -U postgres -d bluebolt_web
```
```sql
-- 20 lead mới nhất (mã tham chiếu = 8 ký tự đầu của id)
select upper(left(id::text, 8)) as ma, type, payload->>'intent' as nhu_cau, payload->>'fullName' as ho_ten,
       payload->>'phone' as sdt, locale, meta->>'captcha' as captcha,
       created_at at time zone 'Asia/Ho_Chi_Minh' as luc
  from leads order by created_at desc limit 20;
-- trạng thái gửi thông báo
select upper(left(lead_id::text, 8)) as ma, target, status, attempts, last_error_code from lead_notifications order by created_at desc limit 20;
```
Bản xem trước nới rate-limit lên 20 lần / 10 phút để anh thử nhiều lần. Lead thử xong: xóa bằng `leads-dsr.mjs erase`.
Lưu ý: bản xem trước 9515 chạy bản build; API form chỉ có sau lần build/cập nhật kế tiếp (`deploy/preview/update.sh`, tech lead chạy).

## 12. Checklist bật form trên production (SRS mục 10)

Chỉ đặt `LEADS_FORM_ENABLED=true` khi đủ:
- [ ] Hai contract APPROVED (đã có, D-26) — kèm email xác nhận của anh Duy.
- [ ] Pháp chế giao câu đồng ý + mục đích (PC-01, PC-02), thời hạn lưu (PC-03), đầu mối xử lý yêu cầu (PC-04), hồ sơ đánh giá
      tác động + bên xử lý ngoài lãnh thổ (PC-05), trang `/chinh-sach-bao-mat`. Thêm **version mới** trong `content/consent.ts`
      (không sửa version nháp đã dùng ở bản xem trước) với `approvedBy` + `approvedAt`; schema chặn version đã duyệt mà còn chỗ
      "[… chờ pháp chế]". Thay chân thư "[đầu mối … PC-04]" trong `lib/leads/notify/email.ts`.
      `effectiveFrom` = thời điểm deploy dự kiến: version liền trước chỉ còn được nhận 24 giờ kể từ `effectiveFrom` của version
      mới (Rule 2) — tính theo dữ liệu, khởi động lại server KHÔNG mở lại cửa sổ. Deploy trễ hơn `effectiveFrom` thì cửa sổ ngắn
      lại tương ứng (tab mở sẵn nhận 409 sớm hơn, FE tự tải lại và giữ dữ liệu đã nhập).
- [ ] Anh Duy cho hai địa chỉ nhận (D-02) → `LEAD_NOTIFY_EMAIL_B2B`, `LEAD_NOTIFY_EMAIL_TECHNICIAN`.
- [ ] SMTP production (cổng 465 hoặc 587 có STARTTLS, TLS ≥ 1.2) + SPF/DKIM/DMARC cho tên miền gửi; gửi thử tới cả hai hộp thư.
- [ ] Turnstile: widget production cho đúng tên miền, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (lúc build) + `TURNSTILE_SECRET_KEY` +
      `TURNSTILE_ALLOWED_HOSTNAMES`.
- [ ] `LEAD_IP_HASH_SECRET` mới (không dùng lại của bbsw), `LEAD_ALLOWED_ORIGINS=https://lapdattoanquoc.vn`, rate-limit để trống.
- [ ] Postgres production + role + migration `up`; sao lưu mã hóa hằng ngày + diễn tập restore đạt (NFR-AVAIL-02).
- [ ] openresty đã áp `location = /api/v1/leads` (`openresty -t && openresty -s reload`); `LEAD_CLIENT_IP_SOURCE` đúng mục 9.
- [ ] Cron/service thử lại thông báo chạy mỗi 5 phút (mục 5); cảnh báo `lead_notify_dead`/`lead_notify_backlog` tới người trực.
- [ ] (Nên có) Sentry: `SENTRY_DSN`, `sendDefaultPii: false`, `beforeSend` xóa `request.data` + `x-real-ip`/`x-forwarded-for` của
      `/api/v1/leads` — chỗ gắn: `reportError()` trong `lib/leads/logger.ts` (chưa cài, chưa có DSN).
- [ ] Build lại trang (form-state đọc lúc build), smoke test: `POST /api/v1/leads` thiếu body → 400 có `correlationId`.
- [ ] Cutover: gửi 1 lead B2B thử (ghi chú `[TEST-CUTOVER]`) và 1 lead thợ (`TEST CUTOVER`), xác nhận tới đúng hộp thư, rồi
      `leads-dsr.mjs erase`.

Chưa đủ thì site vẫn launch được: trang hiện khối Gọi · Zalo · email bộ phận thay cho form (AC-C10).

## 13. Kiểm thử

```bash
npm run test          # unit (không cần DB): tests/unit/leads-*.test.ts
npm run test:leads    # tích hợp với Postgres thật (bluebolt_web_test): tests/leads/*.test.ts — tự bỏ qua nếu thiếu DATABASE_URL_TEST*
```

## 14. Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Xử lý |
|---|---|---|
| API trả 503 `LEADS_DISABLED`, log `lead_config_error` | Thiếu biến (trường `missing` liệt kê TÊN biến) | Khai biến, khởi động lại |
| 503, log `lead_disabled` `consent_unapproved` | Production, câu đồng ý chưa `approvedBy` | Đúng thiết kế (AC-C10) — chờ pháp chế |
| 403 `FORBIDDEN_ORIGIN` khi thử trên bản xem trước | Truy cập bằng địa chỉ chưa có trong `LEAD_ALLOWED_ORIGINS` | Thêm origin (gồm cổng) vào `.env.local`, khởi động lại bản xem trước |
| 500 `INTERNAL_ERROR`, log `lead_db_error` | DB không chạy / sai mật khẩu | `docker ps`, `docker start bluebolt-web-db`; production: kiểm DB |
| Lead có trong DB nhưng không có email | Outbox lỗi | Mục 6 |
| Mọi lead trông như cùng một IP (429 hàng loạt) | Proxy không gửi IP thật | Kiểm header IP ở openresty/proxy, `LEAD_CLIENT_IP_SOURCE` (mục 9) |

## 15. Rủi ro đã biết (chấp nhận, ghi lại)

| Rủi ro | Vì sao giữ | Giảm thiểu / theo dõi |
|---|---|---|
| `Idempotency-Key` không gắn với nội dung (review L7): gửi lại cùng khóa nhưng dữ liệu KHÁC vẫn nhận 201 replay của lead đầu, dữ liệu mới bị bỏ qua | Đúng Rule 7 của contract: chống trùng theo khóa, không so nội dung | FE sinh khóa mới khi người dùng sửa dữ liệu sau lỗi 4xx (Rule 7), nên chỉ client lỗi/tự chế gặp. Replay chỉ trả `id`, `reference`, `type`, `receivedAt` — không trả nội dung lead. Người dùng báo "đã sửa mà bộ phận nhận dữ liệu cũ" → tìm theo mã tham chiếu (mục 7) |
| Gom IPv6 theo /64 có thể gộp nhiều người dùng chung một /64 (văn phòng, nhà mạng cấp /64 dùng chung); IPv4 sau NAT cũng vậy | Đổi lại không cho một thuê bao né rate-limit bằng cách đổi địa chỉ trong khối | 5 lần / 10 phút đủ rộng cho người thật; thấy 429 hàng loạt từ một nơi thì xem mục 14 và cân nhắc nới `LEAD_RATE_LIMIT_MAX` |
| Bộ đếm rate-limit nằm trong bộ nhớ tiến trình (mục 9) | Contract mục 3.4 | Khởi động lại/2 instance thì nới tạm thời; lớp `limit_req` ở openresty vẫn chạy |
| Ký tự điều khiển, ký tự định hướng (U+202A–202E, U+2066–2069, LRM/RLM) và surrogate lẻ bị **bỏ im lặng** khỏi họ tên, công ty, chức danh, ghi chú, utm (review M2) | Không bao giờ 500 vì ký tự lạ; dữ liệu trong DB/email sạch | Chuỗi chỉ toàn ký tự lạ → coi như trống (trường bắt buộc báo lỗi 400 bình thường) |
