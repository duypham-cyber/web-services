# Bản xem trước (cổng 9515)

Bản build production có nội dung nháp (nhãn "Nháp", số site cũ — D-24), để anh Duy duyệt trang. Không phải production.

## Xem

| Đường | Link | Ghi chú |
|---|---|---|
| Tailscale | http://<IP Tailscale của máy chủ>:9515 | Dùng được ngay từ máy có Tailscale |
| LAN văn phòng | http://<IP LAN của máy chủ>:9515 | |
| Internet | `<IP công cộng của văn phòng>:9515` | **Chưa** — NAT router đang trỏ 9515 sang máy khác (dịch vụ "Mention"), xem D-21 |

- Tài khoản: user `bluebolt`, mật khẩu trong `.env.preview` ở gốc repo (gitignore, quyền 600). Không chép mật khẩu vào file commit.
- Toàn site có Basic Auth (kể cả `/_next/*`, ảnh) và header `X-Robots-Tag: noindex`.
- Xem qua HTTP bằng IP là ngữ cảnh không an toàn của trình duyệt: không có `crypto.randomUUID`, clipboard… Đã thử trang chủ,
  `/mang-luoi`, `/doi-tac-tho`, `/kien-thuc`, `/en`, `/en/network` ở 390 và 1440 px: không lỗi console (03/10/2026).

## Cách chạy

```
trình duyệt → 0.0.0.0:9515  deploy/preview/proxy.mjs (Basic Auth, Node thuần)   systemd: bluebolt-web-preview-proxy
            → localhost:3092 next start, NEXT_DIST_DIR=.next-preview              systemd: bluebolt-web-preview
```

- `next start` bind `localhost` (không phải 127.0.0.1, xem D-09). Bản build ở `.next-preview` (gitignore), build có `DRAFT_PREVIEW=1`.
- Unit ở `~/.config/systemd/user/bluebolt-web-preview{,-proxy}.service`, đã `enable` nên tự chạy lại sau khi máy khởi động.

## Cập nhật sau khi code đổi (một lệnh)

```bash
bash deploy/preview/update.sh
```

Build ra `.next-preview-new` qua `scripts/safe-build.sh` (bản cũ vẫn phục vụ trong lúc build), dừng dịch vụ vài giây để đổi tên
thư mục, rồi bật lại. Không build đè lên `.next-preview` đang chạy.

## Dừng / bật

```bash
systemctl --user stop bluebolt-web-preview-proxy bluebolt-web-preview      # dừng
systemctl --user start bluebolt-web-preview bluebolt-web-preview-proxy     # bật
journalctl --user -u bluebolt-web-preview -n 50                            # log
```

Đổi mật khẩu: sửa `PREVIEW_PASSWORD` trong `.env.preview` (≥ 16 ký tự) rồi `systemctl --user restart bluebolt-web-preview-proxy`.
