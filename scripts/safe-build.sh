#!/usr/bin/env bash
# safe-build.sh — build production AN TOÀN trên máy dùng chung (8,7 GB RAM, nhiều dự án).
#
#   scripts/safe-build.sh                     build vào .next-check-<pid>, in bảng route + JS tải đầu, GIỮ thư mục để preview
#   scripts/safe-build.sh .next-preview       build vào thư mục chỉ định (phải bắt đầu bằng ".next")
#   SAFE_BUILD_CLEAN=1 scripts/safe-build.sh  in tóm tắt xong thì XÓA thư mục build tạm
#   DRAFT_PREVIEW=1 scripts/safe-build.sh     bản xem trước: nội dung draft hiện kèm nhãn "Nháp" (cờ phải có LÚC BUILD)
#   DEV_PAGES=1 scripts/safe-build.sh         giữ trang /dev/* trong bản production
#
# Xem thử bản vừa build (cổng 3092, chỉ 127.0.0.1):
#   NEXT_DIST_DIR=<thư mục> PORT=3092 npm run start      (Next in cảnh báo "standalone" — bình thường)
#
# Cơ chế:
#   - flock /tmp/bluebolt-web-build.lock: KHÔNG BAO GIỜ có hai `next build` chạy cùng lúc.
#   - distDir riêng (NEXT_DIST_DIR) nên không đè .next của dev server dùng chung.
#   - tsconfig tạm tsconfig.build-<dist>.json (gitignore) qua NEXT_TSCONFIG_PATH: Next ghi thêm đường dẫn distDir
#     vào file tạm đó, KHÔNG làm bẩn tsconfig.json của repo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DIST="${1:-${NEXT_DIST_DIR:-.next-check-$$}}"
case "$DIST" in
  .next-*) ;;
  *) echo "[safe-build] distDir phải bắt đầu bằng \".next-\" (đã gitignore), nhận: $DIST" >&2; exit 2 ;;
esac
TSCONFIG="tsconfig.build-${DIST#.}.json"
LOCK="/tmp/bluebolt-web-build.lock"

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "[safe-build] Đang có build khác giữ $LOCK — chờ tới lượt..." >&2
  flock 9
fi

# Loại khỏi type-check: .next của dev server và mọi thư mục build tạm KHÁC (tránh trùng khai báo kiểu)
EXCLUDES='"node_modules","reference",".cache","out","test-results","playwright-report",".next"'
for d in .next-*/; do
  d="${d%/}"
  [ -d "$d" ] || continue
  [ "$d" = "$DIST" ] && continue
  EXCLUDES="$EXCLUDES,\"$d\""
done
cat > "$TSCONFIG" <<JSON
{
  "extends": "./tsconfig.json",
  "include": ["next-env.d.ts", "global.d.ts", "$DIST/types/**/*.ts", "$DIST/dev/types/**/*.ts", "**/*.mts", "**/*.ts", "**/*.tsx"],
  "exclude": [$EXCLUDES]
}
JSON

# next build viết lại next-env.d.ts theo distDir; khôi phục bản cũ sau khi build (file gitignore, dùng cho tsc/IDE)
ENV_BACKUP=""
if [ -f next-env.d.ts ]; then
  ENV_BACKUP="$(mktemp)"
  cp next-env.d.ts "$ENV_BACKUP"
fi

cleanup() {
  rm -f "$TSCONFIG"
  if [ -n "$ENV_BACKUP" ] && [ -f "$ENV_BACKUP" ]; then
    cp "$ENV_BACKUP" next-env.d.ts
    rm -f "$ENV_BACKUP"
  fi
}
trap cleanup EXIT

export NEXT_DIST_DIR="$DIST"
export NEXT_TSCONFIG_PATH="$TSCONFIG"
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=3072}"

echo "[safe-build] distDir=$DIST · DRAFT_PREVIEW=${DRAFT_PREVIEW:-0} · DEV_PAGES=${DEV_PAGES:-0} · NODE_OPTIONS=$NODE_OPTIONS" >&2
START=$(date +%s)
./node_modules/.bin/next build
END=$(date +%s)
echo "[safe-build] next build xong trong $((END - START)) s" >&2

# Tóm tắt route + JS tải đầu (Next 16 đã bỏ cột "First Load JS" khỏi output build)
node scripts/route-sizes.mjs "$DIST"

if [ "${SAFE_BUILD_CLEAN:-0}" = "1" ]; then
  rm -rf -- "$DIST"
  echo "[safe-build] đã xóa $DIST (SAFE_BUILD_CLEAN=1)" >&2
else
  echo "[safe-build] giữ $DIST — xem thử: NEXT_DIST_DIR=$DIST PORT=3092 npm run start · xóa khi xong: rm -rf $DIST" >&2
fi
