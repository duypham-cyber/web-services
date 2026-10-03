#!/usr/bin/env bash
# Cập nhật bản xem trước 9515 sau khi code đổi. Build ra thư mục mới trước (bản cũ vẫn phục vụ trong lúc build),
# rồi dừng dịch vụ vài giây để đổi tên thư mục và bật lại. Không build đè lên thư mục đang chạy.
#   bash deploy/preview/update.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

DRAFT_PREVIEW=1 bash scripts/safe-build.sh .next-preview-new

systemctl --user stop bluebolt-web-preview
rm -rf .next-preview-old
if [ -d .next-preview ]; then mv .next-preview .next-preview-old; fi
mv .next-preview-new .next-preview
systemctl --user start bluebolt-web-preview

for _ in $(seq 1 60); do
  if ss -ltn | grep -q ':3092 '; then break; fi
  sleep 1
done
rm -rf .next-preview-old
systemctl --user is-active bluebolt-web-preview bluebolt-web-preview-proxy
echo "[preview] đã cập nhật — http://<IP Tailscale của máy chủ>:9515 (Tailscale) · http://<IP LAN của máy chủ>:9515 (LAN)"
