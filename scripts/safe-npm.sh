#!/usr/bin/env bash
# safe-npm.sh — chạy npm có khóa flock để nhiều agent không cài/gỡ gói cùng lúc trên một cây làm việc.
#
#   scripts/safe-npm.sh ci                      # cài đúng package-lock.json
#   scripts/safe-npm.sh ls --all >/dev/null     # kiểm cây phụ thuộc
#   scripts/safe-npm.sh install <gói>@<bản>     # CHỈ khi tech lead cho phép: ghim chính xác, PR riêng chore(deps)
#
# Quy ước: agent KHÔNG gọi `npm install` trực tiếp. Mọi thay đổi package.json/package-lock.json đi qua script này.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK="/tmp/bluebolt-web-npm.lock"

cd "$ROOT"
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "[safe-npm] Đang có tiến trình npm khác giữ $LOCK — chờ tới lượt..." >&2
  flock 9
fi

# Không tải trình duyệt Playwright (dùng Chromium có sẵn trên máy, xem CLAUDE.local.md)
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export NEXT_TELEMETRY_DISABLED=1

echo "[safe-npm] npm $*" >&2
npm "$@"
