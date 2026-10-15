# bluebolt-web

Website mới của **Bluebolt Services** (CÔNG TY CỔ PHẦN CÔNG NGHỆ TIA CHỚP XANH), thay cho https://lapdattoanquoc.vn.
Hướng thiết kế "Bluebolt Cinematic", phương án phim **A+** (anh Duy chọn ngày 02/10/2026).

- Quy tắc làm việc cho người và agent: [`CLAUDE.md`](CLAUDE.md)
- Tài liệu gốc: [`docs/03-DINH-HUONG-THIET-KE-3D.md`](docs/03-DINH-HUONG-THIET-KE-3D.md), [`docs/04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md`](docs/04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md)
- Nhật ký quyết định: [`docs/DECISIONS.md`](docs/DECISIONS.md)

## Chạy nhanh

```bash
nvm use                      # Node 22 (.nvmrc)
npm ci                       # chỉ người dựng nền móng; agent dùng scripts/safe-npm.sh
npm run dev                  # http://127.0.0.1:3091 (không bind 0.0.0.0)
npm run typecheck && npm run lint && npm run test
scripts/safe-build.sh        # build production có khóa flock, distDir riêng
```

Trên máy bbsw đã có dev server dùng chung (systemd user unit `bluebolt-web-dev.service`, cổng 3091,
`DRAFT_PREVIEW=1`). Không tự chạy thêm `next dev` thứ hai.

## Cài lên server khác

Cần Linux có Node 22 (≥ 22.12, chưa hỗ trợ 23 — xem `.nvmrc`), khoảng 3 GB RAM trống lúc build. Site chạy được mà không cần
database: form liên hệ/đăng ký thợ tắt mặc định (bật theo [`docs/LEADS-RUNBOOK.md`](docs/LEADS-RUNBOOK.md)).

```bash
git clone https://github.com/duypham-cyber/web-services.git && cd web-services
nvm install && nvm use
npm ci
cp .env.example .env.local        # sửa SITE_URL theo tên miền của bạn
scripts/safe-build.sh .next-prod  # build production, in dung lượng JS từng trang, chặn cú pháp Safari cũ không đọc được
NEXT_DIST_DIR=.next-prod PORT=3000 npm run start   # nghe http://localhost:3000
```

- Biến môi trường đọc **lúc build** (trang tĩnh): sửa `.env.local` thì build lại. Bản cho khách xem: `DRAFT_PREVIEW` để trống;
  bản nháp nội bộ: `DRAFT_PREVIEW=1` (hiện nội dung chưa duyệt kèm nhãn "Nháp"). `STAGING=1` chặn Google lập chỉ mục.
- Kiểm bản build không lọt nội dung nháp: `npm run check:draft -- .next-prod`.
- `next start` chỉ nghe `localhost`; đưa ra ngoài bằng reverse proxy (nginx/openresty) lo TLS:

  ```nginx
  location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

- Chạy nền: dùng systemd (mẫu chạy thật trên máy của đội gốc ở [`deploy/preview/`](deploy/preview/), gồm unit systemd và script
  `update.sh` build ra thư mục mới rồi mới đổi, site chỉ dừng vài giây). Đường dẫn, cổng trong các file đó là của máy gốc — sửa
  lại cho server của bạn.
- Cập nhật: `git pull && npm ci && scripts/safe-build.sh .next-prod-new`, dừng dịch vụ, đổi tên `.next-prod-new` →
  `.next-prod`, chạy lại.
- Trình duyệt hỗ trợ: Chrome/Edge/Firefox ≥ 111, Safari ≥ 15.4 (D-35 trong [`docs/DECISIONS.md`](docs/DECISIONS.md)).
