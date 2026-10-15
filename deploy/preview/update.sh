#!/usr/bin/env bash
# Cập nhật hai bản chạy trên bbsw sau khi code đổi (docs/PREVIEW.md, D-30):
#   bash deploy/preview/update.sh           # cả hai
#   bash deploy/preview/update.sh public    # bản trưng bày công khai: production + STAGING (noindex), cổng 3092 → proxy 9515
#   bash deploy/preview/update.sh draft     # bản nháp nội bộ: DRAFT_PREVIEW + STAGING, cổng 3097 → proxy 9516 (mật khẩu)
# Mỗi bản build ra thư mục mới trước (bản cũ vẫn phục vụ trong lúc build), rồi dừng dịch vụ vài giây để đổi tên thư mục
# và bật lại. Không build đè lên thư mục đang chạy. SITE_URL (canonical, og, sitemap) đọc từ .env.public / .env.preview.
set -euo pipefail
cd "$(dirname "$0")/../.."
WHAT="${1:-all}"
case "$WHAT" in
  public | draft | all) ;;
  *)
    echo "Dùng: bash deploy/preview/update.sh [public|draft|all]" >&2
    exit 2
    ;;
esac

env_value() { # $1 = tệp env, $2 = tên biến
  grep -E "^$2=" "$1" 2>/dev/null | tail -1 | cut -d= -f2- || true
}

deploy() { # $1 = thư mục dist, $2 = unit next start, $3 = cổng next start, $4… = biến môi trường lúc build
  local dist=$1 unit=$2 port=$3
  shift 3
  env "$@" bash scripts/safe-build.sh "${dist}-new"
  systemctl --user stop "$unit"
  rm -rf "${dist}-old"
  if [ -d "$dist" ]; then mv "$dist" "${dist}-old"; fi
  mv "${dist}-new" "$dist"
  systemctl --user start "$unit"
  for _ in $(seq 1 60); do
    if ss -ltn | grep -q ":${port} "; then break; fi
    sleep 1
  done
  rm -rf "${dist}-old"
  systemctl --user is-active "$unit"
}

case "$WHAT" in
  public | all)
    deploy .next-public bluebolt-web-public 3092 STAGING=1 LEADS_FORM_ENABLED=false SITE_URL="$(env_value .env.public SITE_URL)"
    systemctl --user is-active bluebolt-web-public-proxy
    echo "[public] đã cập nhật — https://services.bluebolt.software (công khai, noindex)"
    ;;
esac
case "$WHAT" in
  draft | all)
    deploy .next-preview bluebolt-web-preview 3097 DRAFT_PREVIEW=1 STAGING=1 SITE_URL="$(env_value .env.preview SITE_URL)"
    systemctl --user is-active bluebolt-web-preview-proxy
    echo "[draft] đã cập nhật — cổng 9516 qua Tailscale/LAN của máy chủ, có mật khẩu"
    ;;
esac
