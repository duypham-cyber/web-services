/**
 * Migration: thu hẹp quyền UPDATE của bb_app trên `lead_notifications` xuống mức CỘT (review L8, contracts/lead-b2b.md mục 2
 * "bb_app chỉ DML cần thiết"). Migration 20261003144700 cấp UPDATE cả bảng; app và script retry chỉ cần sửa 5 cột trạng
 * thái gửi (lib/leads/outbox.ts: nhận việc, ghi sent/lỗi/dead, requeue dead letter):
 *   status, attempts, next_attempt_at, last_error_code, sent_at
 * → bb_app KHÔNG còn sửa được lead_id, channel, target, created_at, updated_at (updated_at vẫn tự cập nhật: trigger đổi NEW,
 *   quyền cột chỉ kiểm cột trong SET). `FOR UPDATE SKIP LOCKED` chỉ cần quyền UPDATE trên ít nhất một cột → vẫn chạy.
 *
 * Chạy: node scripts/db-migrate.mjs up | down (thêm --test cho database test). Role chạy: chủ bảng (bb_owner).
 * Chỉ đổi quyền, không đụng dữ liệu → `down` an toàn (trả lại UPDATE cả bảng như migration trước). Role bb_app chưa có
 * (production tạo role sau) → bỏ qua, như migration trước.
 */

export const description = 'narrow bb_app UPDATE on lead_notifications to delivery-state columns';

export const up = /* sql */ `
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'bb_app') THEN
    -- REVOKE mức bảng gỡ luôn quyền mức cột cũ (nếu có), rồi cấp lại đúng 5 cột
    REVOKE UPDATE ON lead_notifications FROM bb_app;
    GRANT UPDATE (status, attempts, next_attempt_at, last_error_code, sent_at) ON lead_notifications TO bb_app;
  END IF;
END $$;
`;

export const down = /* sql */ `
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'bb_app') THEN
    REVOKE UPDATE (status, attempts, next_attempt_at, last_error_code, sent_at) ON lead_notifications FROM bb_app;
    GRANT UPDATE ON lead_notifications TO bb_app;
  END IF;
END $$;
`;
