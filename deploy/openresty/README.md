# deploy/openresty — chuyển hướng 1 hop, 410, HTTPS cho lapdattoanquoc.vn

| File | Nội dung | Sửa ở đâu |
|---|---|---|
| `lapdattoanquoc.conf` | map URL cũ → mới (301), 410, `/` cuối, http→https, www→apex, rate-limit form lead, proxy tới app | **Sinh tự động** từ `content/redirects.ts`: `node scripts/gen-openresty-map.mjs` |
| `snippets/bb-security-headers.conf` | HSTS (nâng dần), nosniff, Referrer-Policy | Sửa tay (nâng `max-age` theo lịch) |
| `snippets/bb-proxy-headers.conf` | Host, X-Real-IP, X-Forwarded-*; bỏ header trùng của app | Sửa tay |
| `../../redirect-inventory.csv` | Danh sách kiểm (34 URL sitemap cũ + ảnh og:image cũ) | **Sinh tự động** cùng lệnh trên |

Đã sửa 2 lỗi của mẫu `docs/04` mục 2.7 theo `contracts/lead-b2b.md` mục 3.8: `rate=1r/m` + `burst=4` thay cho `5r/10m`
(không hợp lệ), và `location = /api/v1/leads` có đủ `proxy_set_header` (X-Real-IP) để app thấy IP thật.

## Áp lên server (cần quyền server — chưa có, rủi ro R1)

1. `openresty -V 2>&1 | head -1` — nginx core ≥ 1.25.1 thì giữ nguyên; bản cũ hơn: `node scripts/gen-openresty-map.mjs --legacy-http2`.
2. Chép `lapdattoanquoc.conf` vào thư mục được include TRONG `http{}` (vd `/etc/openresty/conf.d/`), chép `snippets/` sang
   thư mục `snippets/` cạnh `nginx.conf` chính. Nếu `nginx.conf` chính đã có `map_hash_bucket_size` thì xóa dòng đó ở file sinh.
3. Chứng chỉ ở `/etc/ssl/lapdattoanquoc.vn/{fullchain,privkey}.pem` phải có SAN `www.lapdattoanquoc.vn` (www hiện trả 502).
4. App Next standalone chạy `127.0.0.1:3000`, đúng hostname theo `docs/DECISIONS.md` D-09; smoke test:
   `curl -sI http://127.0.0.1:3000/doi-tac-tho` phải trả 200 (không 307).
5. `openresty -t && openresty -s reload`.
6. Kiểm: `BASE_URL=https://lapdattoanquoc.vn node scripts/check-redirects.mjs` → 0 lỗi (4 biến thể × có/không `/` cuối,
   1 hop, giữ query, đích trả 200, ảnh og:image cũ 200/301). `curl -sI --http2 https://lapdattoanquoc.vn/` → `HTTP/2 200`,
   có `strict-transport-security`, không có `x-powered-by`.

## Thử ở máy local (đã chạy 02/10/2026: 46 dòng · 362 request · 0 lỗi, nginx 1.29.8)

Đổi `listen` sang `127.0.0.1:18080` / `127.0.0.1:18443 ssl`, upstream sang dev server, chứng chỉ tự ký, chạy
`nginx:alpine` với `--network host` (chỉ loopback), rồi:

```bash
BASE_URL=https://lapdattoanquoc.vn node scripts/check-redirects.mjs --connect-to=127.0.0.1 \
  --http-port=18080 --https-port=18443 --insecure
```

## Staging

Server block riêng có Basic Auth cho CẢ tên miền (prefetch của Next không bật hộp đăng nhập), thêm
`add_header X-Robots-Tag "noindex, nofollow" always;` và build app với `STAGING=1` (robots.txt `Disallow: /`).
