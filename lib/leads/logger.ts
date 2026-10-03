/**
 * Log JSON một dòng cho form lead (rules/logging.md + contracts/lead-b2b.md mục 6.6). CHỈ SERVER.
 *
 * Kiểu `LeadLogFields` là danh sách trường ĐƯỢC PHÉP — truyền trường khác là lỗi typecheck. KHÔNG BAO GIỜ log: họ tên,
 * SĐT, email, công ty, chức danh, ghi chú, IP thô, ip_hash, turnstileToken, body request, nội dung thông báo, địa chỉ hộp
 * thư nhận. `province`, `primarySkill` (form thợ) được phép theo lead-technician.md mục 6 nhưng hiện không cần nên không log.
 *
 * Sentry: chưa có DSN — `reportError()` là chỗ gắn sau này (sendDefaultPii: false; beforeSend xóa request.data và header
 * x-real-ip/x-forwarded-for của mọi event thuộc /api/v1/leads).
 */

export type LeadLogEvent =
  | 'lead_received'
  | 'lead_rejected'
  | 'lead_disabled'
  | 'lead_config_error'
  | 'lead_honeypot'
  | 'lead_rate_limited'
  | 'lead_replayed'
  | 'lead_captcha_unverified'
  | 'lead_captcha_misconfigured'
  | 'lead_db_error'
  | 'lead_notify_sent'
  | 'lead_notify_failed'
  | 'lead_notify_dead'
  | 'lead_notify_backlog'
  | 'lead_notify_run'
  | 'lead_notify_error'
  | 'lead_endpoint_gone'
  | 'lead_ops';

export type LeadLogFields = {
  correlationId?: string;
  leadId?: string;
  type?: string | null;
  intent?: string;
  locale?: string;
  filmTier?: string | null;
  utmSource?: string | null;
  captcha?: string;
  code?: string;
  /** Chỉ TÊN trường lỗi, không giá trị. */
  fields?: string[];
  reason?: string;
  turnstileError?: string;
  channel?: string;
  target?: string;
  attempts?: number;
  errorCode?: string;
  /** Tên biến môi trường thiếu/sai (không giá trị). */
  missing?: string[];
  count?: number;
  oldestMinutes?: number;
  claimed?: number;
  sent?: number;
  failed?: number;
  dead?: number;
  error?: { message: string; stack?: string };
};

export type LogLevel = 'info' | 'warn' | 'error';
export type LogWriter = (line: string, level: LogLevel) => void;

export type LeadLogger = {
  info(event: LeadLogEvent, fields?: LeadLogFields): void;
  warn(event: LeadLogEvent, fields?: LeadLogFields): void;
  error(event: LeadLogEvent, fields?: LeadLogFields): void;
};

const defaultWriter: LogWriter = (line, level) => {
  // Không dùng console.log (rules/logging.md): ghi thẳng stdout/stderr một dòng JSON
  (level === 'error' ? process.stderr : process.stdout).write(`${line}\n`);
};

export function createLeadLogger(write: LogWriter = defaultWriter, context = 'Leads'): LeadLogger {
  const emit = (level: LogLevel, event: LeadLogEvent, fields: LeadLogFields = {}) => {
    write(JSON.stringify({ time: new Date().toISOString(), level, context, event, ...fields }), level);
    if (level === 'error') reportError(event, fields);
  };
  return {
    info: (event, fields) => emit('info', event, fields),
    warn: (event, fields) => emit('warn', event, fields),
    error: (event, fields) => emit('error', event, fields),
  };
}

/** Chỗ gắn Sentry khi có SENTRY_DSN (chưa cài). Chỉ nhận trường đã lọc ở trên. */
function reportError(_event: LeadLogEvent, _fields: LeadLogFields): void {
  // Chưa có Sentry: không làm gì.
}

/** Lỗi → { message, stack } để log server (không bao giờ đưa vào response). Không lấy `detail` của pg (có thể chứa dữ liệu dòng). */
export function errorInfo(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  return { message: String(err) };
}
