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
