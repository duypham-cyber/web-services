# Hai bản chạy trên bbsw: trưng bày công khai và nháp nội bộ (D-21, D-30)

Từ 05/10/2026, anh Duy bỏ mật khẩu vì đây là website cho khách vào xem. Bản công khai vì vậy là **bản build production**:
- nội dung nháp ẩn hẳn, chỉ hiện số liệu và câu khẳng định đã duyệt (D-26, D-27);
- form lead tự tắt.

Bản có nhãn "Nháp" chuyển sang cổng nội bộ, có mật khẩu.

| Bản | Link | Ai xem | Build |
|---|---|---|---|
| **Trưng bày công khai** | https://services.bluebolt.software | Khách, không cần mật khẩu | `.next-public`: production + `STAGING=1` + `SITE_URL=https://services.bluebolt.software` |
| Nháp nội bộ | Tailscale http://<IP Tailscale của máy chủ>:9516 · LAN http://<IP LAN của máy chủ>:9516 | Anh Duy, đội dự án. User `bluebolt`, mật khẩu trong `.env.preview` | `.next-preview`: `DRAFT_PREVIEW=1` + `STAGING=1` |

## Bản công khai: khách thấy gì

- **Không có:**
  - nhãn "Nháp" hay ghi chú nội bộ (`npm run check:draft -- .next-public` phải 0 vi phạm);
  - câu khẳng định chưa duyệt;
  - bảng giá vật tư (chưa có ngày hiệu lực), tin tuyển, nút Zalo (chưa xác nhận Zalo chính thức);
  - nội dung trang pháp lý: các trang này ghi "đang cập nhật" và không có trong sitemap.
- **Form nhận báo giá / đăng ký thợ:** TẮT, thay bằng khối Gọi · email. API `POST /api/v1/leads` trả 503 `LEADS_DISABLED`.
  - Lý do: chưa đủ điều kiện ở `docs/SRS-LEADS.md` mục 10, gồm câu đồng ý được duyệt, 2 email nhận, SMTP, khóa Turnstile thật.
  - Nếu bật bây giờ, lead của khách không tới tay ai.
- **Google không index:** `X-Robots-Tag: noindex` (proxy + `STAGING`). `robots.txt` cho crawl (`Allow: /`, không có Sitemap), để
  Google đọc được noindex và trình xem trước link của Facebook/Zalo/Telegram lấy được ảnh. Tên miền chính thức sau này là
  lapdattoanquoc.vn.
- **Trang không tồn tại:** `proxy.ts` đưa về trang 404 render bình thường (mã 404, HTML đầy đủ). Không dùng vỏ lỗi của
  `notFound()`, vì trên vỏ lỗi đó router Next 16.3.8 prefetch lặp không dừng các link `/en/*` (D-30).
- **Link chia sẻ** (Zalo, Facebook): canonical, `og:image`, sitemap, JSON-LD trỏ `https://services.bluebolt.software` (biến
  `SITE_URL` lúc build, `lib/routes.ts`).

## Cách chạy

```
khách → https://services.bluebolt.software → openresty (máy khác, TLS, nối qua Tailscale từ <IP Tailscale của máy openresty>) → bbsw <IP Tailscale của máy chủ>:9515
      deploy/preview/proxy.mjs (PREVIEW_AUTH=off, noindex, HSTS) systemd: bluebolt-web-public-proxy  (.env.public)
      → localhost:3092 next start, NEXT_DIST_DIR=.next-public  systemd: bluebolt-web-public         (.env.public)

nội bộ → 0.0.0.0:9516 proxy.mjs (PREVIEW_AUTH=basic)           systemd: bluebolt-web-preview-proxy  (.env.preview)
       → localhost:3097 next start, NEXT_DIST_DIR=.next-preview systemd: bluebolt-web-preview        (.env.preview)
```

- `next start` bind `localhost` (không phải 127.0.0.1, xem D-09).
- Hai tệp `.env.public` và `.env.preview` nằm ở gốc repo: đã gitignore, quyền 600, không commit.
  - Chứa `SITE_URL`, `PREVIEW_PORT`, `PREVIEW_TARGET_PORT`, `PREVIEW_AUTH`.
  - `.env.preview` có thêm `PREVIEW_USER`/`PREVIEW_PASSWORD`.
  - `.env.public` có thêm:
    - `PREVIEW_LISTEN_HOST=<IP Tailscale của máy chủ>`: chỉ nghe trên Tailscale, LAN không vào thẳng được.
    - `PREVIEW_TRUSTED_PROXIES=<IP Tailscale của máy openresty>`: chỉ tin `X-Forwarded-*` từ openresty.
    - `PREVIEW_HSTS`.
    - `LEADS_FORM_ENABLED=false`.
    - Các biến DB/bí mật để RỖNG: next start luôn nạp `.env.local` của bản dev, nhưng biến môi trường của tiến trình được ưu
      tiên, nên bản công khai không cầm thông tin đăng nhập DB lead.
- Proxy công khai:
  - Từ chối đường dẫn không hợp lệ (400) và URL quá dài (414).
  - Bỏ các header nối chuyển (hop-by-hop).
  - Thêm CSP tối thiểu (`frame-ancestors 'self'; object-src 'none'; base-uri 'self'`).
- Hai unit công khai có `NoNewPrivileges` và các hạn chế seccomp. Vẫn chạy bằng user `bbsw`; muốn cô lập hẳn, xem D-30.
- Mẫu unit nằm ở `deploy/preview/systemd/`. Cài:
  1. Chép vào `~/.config/systemd/user/`.
  2. Chạy `systemctl --user daemon-reload`.
  3. Chạy `systemctl --user enable --now <unit>`.
- Cổng 9516 (bản nháp) tới được qua LAN và Tailscale; router không chuyển cổng này ra Internet. Muốn chỉ Tailscale thì đặt
  `PREVIEW_LISTEN_HOST=<IP Tailscale của máy chủ>` trong `.env.preview` rồi restart proxy.

## Cập nhật sau khi code đổi (một lệnh)

```bash
bash deploy/preview/update.sh           # cả hai bản
bash deploy/preview/update.sh public    # chỉ bản công khai
bash deploy/preview/update.sh draft     # chỉ bản nháp nội bộ
```

- Mỗi bản build ra `<dist>-new` qua `scripts/safe-build.sh`. Bản cũ vẫn phục vụ trong lúc build.
- Sau đó dừng dịch vụ vài giây để đổi tên thư mục, rồi bật lại. Không build đè lên thư mục đang chạy.
- Sau khi cập nhật bản công khai, chạy cổng nháp: `npm run check:draft -- .next-public`.

## Dừng / bật / log

```bash
systemctl --user stop bluebolt-web-public-proxy bluebolt-web-public       # tắt bản công khai (domain trả lỗi 502 từ openresty)
systemctl --user start bluebolt-web-public bluebolt-web-public-proxy      # bật lại
systemctl --user restart bluebolt-web-preview bluebolt-web-preview-proxy  # bản nháp nội bộ
journalctl --user -u bluebolt-web-public -n 50                            # log
```

- **Tạm khóa lại bản công khai bằng mật khẩu** (vd khi đang sửa lớn):
  1. Trong `.env.public`, đặt `PREVIEW_AUTH=basic` và thêm `PREVIEW_USER` / `PREVIEW_PASSWORD` (≥ 16 ký tự).
  2. Chạy `systemctl --user restart bluebolt-web-public-proxy`.
- **Đổi mật khẩu bản nháp:** sửa `PREVIEW_PASSWORD` trong `.env.preview` rồi chạy `systemctl --user restart bluebolt-web-preview-proxy`.

## Trước khi bật form trên tên miền này

- Đủ các điều kiện ở `docs/SRS-LEADS.md` mục 10.
- `LEAD_ALLOWED_ORIGINS` đã có `https://services.bluebolt.software`.
- **Phải sửa chuỗi IP:** khách → openresty → proxy.mjs → Next, nên phần tử cuối của `X-Forwarded-For` là IP của openresty. Nếu giữ
  nguyên, rate-limit gom mọi khách vào một bucket. Cần cấu hình số hop tin cậy, hoặc cho openresty gửi `X-Real-IP` và app đọc
  header đó (`docs/LEADS-RUNBOOK.md` mục 9).
