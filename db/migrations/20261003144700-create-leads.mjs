/**
 * Migration: bảng `leads` + `lead_notifications` (outbox) — contracts/lead-b2b.md SECTION 2 (APPROVED 03/10/2026, D-26).
 * Contract đặt tên `.ts`; file là `.mjs` để scripts/db-migrate.mjs chạy thẳng bằng Node, không cần bước biên dịch.
 *
 * Chạy: node scripts/db-migrate.mjs up | down | status  (thêm --test cho database test). Role chạy: chủ schema (bb_owner).
 * KHÔNG chạy `down` trên production khi bảng đã có lead (mất dữ liệu) — runner từ chối nếu `leads` còn dòng, trừ khi --force.
 *
 * Quyền mức bảng cấp ngay trong migration, chỉ khi role đã tồn tại (dev: scripts/db-dev-setup.mjs; production: script init
 * với mật khẩu từ secret):
 *   bb_app : INSERT, SELECT trên leads (SELECT cho replay idempotency và dựng nội dung thông báo);
 *            INSERT, SELECT, UPDATE trên lead_notifications. KHÔNG UPDATE/DELETE trên leads.
 *   bb_ops : SELECT, DELETE trên leads (yêu cầu chủ thể dữ liệu, dọn theo thời hạn lưu); SELECT trên lead_notifications.
 *            Xóa lead tự xóa dòng lead_notifications (ON DELETE CASCADE chạy bằng quyền chủ bảng).
 */

export const description = 'create leads and lead_notifications tables';

export const up = /* sql */ `
-- NEW TABLE 1: leads — mọi loại lead, payload theo type
CREATE TABLE leads (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  type              VARCHAR(32)  NOT NULL
                    CHECK (type IN ('lead_b2b', 'lead_technician')),
                    -- 'warranty_registration' thêm bằng migration riêng khi contract P1 APPROVED
  payload           JSONB        NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
                    -- đúng shape đã qua Zod + chuẩn hóa (contract mục 2.1). KHÔNG chứa IP, token, consent
  payload_version   SMALLINT     NOT NULL DEFAULT 1 CHECK (payload_version >= 1),
  consent_version   VARCHAR(32)  NOT NULL,              -- khóa trong content/consent.ts
  consent_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(), -- giờ server lúc nhận, không lấy giờ client
  consent_purposes  TEXT[]       NOT NULL CHECK (cardinality(consent_purposes) >= 1),
                    -- mã mục đích ĐÃ đồng ý; mục đích bị từ chối = danh sách của version trừ mảng này
  ip_hash           CHAR(64)     NOT NULL CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
                    -- HMAC-SHA256(ip, LEAD_IP_HASH_SECRET), hex. KHÔNG lưu IP thô ở bất kỳ đâu
  utm               JSONB        NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(utm) = 'object'),
  locale            VARCHAR(5)   NOT NULL DEFAULT 'vi' CHECK (locale IN ('vi', 'en')),
  page_path         VARCHAR(512) NOT NULL DEFAULT '/',  -- chỉ pathname, không query, không hash
  film_tier         VARCHAR(8)   NULL
                    CHECK (film_tier IN ('T-FULL', 'T-LITE', 'T-SEQ', 'T-STILL')),
  status            VARCHAR(16)  NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'qualified', 'spam', 'closed')),
  meta              JSONB        NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(meta) = 'object'),
                    -- cờ do server tính, không PII: {captcha, emailFreeDomain, sanitized[]}
  idempotency_key   UUID         NULL,                  -- header Idempotency-Key (UUID do client sinh)
  correlation_id    VARCHAR(64)  NOT NULL,              -- nối lead với log
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_type_created_at ON leads (type, created_at DESC);
CREATE UNIQUE INDEX uq_leads_idempotency_key ON leads (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- NEW TABLE 2: lead_notifications — hàng đợi gửi thông báo (outbox), để gửi lỗi không mất lead
CREATE TABLE lead_notifications (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID         NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel          VARCHAR(16)  NOT NULL CHECK (channel IN ('email', 'crm', 'lark', 'zalo_oa')),
  target           VARCHAR(64)  NOT NULL,   -- KHÓA cấu hình đích ('b2b_sales', 'technician_hr'), KHÔNG lưu địa chỉ
  status           VARCHAR(16)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'sent', 'dead')),
  attempts         SMALLINT     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),  -- cũng là "lease" khi đang gửi (contract mục 3.5)
  last_error_code  VARCHAR(64)  NULL,       -- mã lỗi kỹ thuật (vd 'SMTP_ECONNECTION'), không chứa nội dung lead
  sent_at          TIMESTAMPTZ  NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lead_notifications_lead_channel_target UNIQUE (lead_id, channel, target)
);

CREATE INDEX idx_lead_notifications_due ON lead_notifications (next_attempt_at)
  WHERE status = 'pending';

-- updated_at tự cập nhật
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lead_notifications_updated_at BEFORE UPDATE ON lead_notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- QUYỀN DB (chỉ khi role đã có; mật khẩu tạo ngoài migration, không commit)
REVOKE ALL ON leads, lead_notifications FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'bb_app') THEN
    GRANT INSERT, SELECT ON leads TO bb_app;
    GRANT INSERT, SELECT, UPDATE ON lead_notifications TO bb_app;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'bb_ops') THEN
    GRANT SELECT, DELETE ON leads TO bb_ops;
    GRANT SELECT ON lead_notifications TO bb_ops;
  END IF;
END $$;
`;

export const down = /* sql */ `
DROP TABLE IF EXISTS lead_notifications;
DROP TABLE IF EXISTS leads;
DROP FUNCTION IF EXISTS set_updated_at();
`;

/** Runner chạy câu này trước `down`: > 0 dòng thì từ chối (trừ khi --force) để không xóa nhầm lead thật. */
export const downGuard = /* sql */ `SELECT count(*)::int AS n FROM leads`;
