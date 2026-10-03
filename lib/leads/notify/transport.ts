/**
 * Kênh gửi email thông báo (kênh (a) của D-01, anh Duy duyệt ở D-20/D-26). CHỈ SERVER.
 *
 * - `SMTP_HOST` có giá trị → nodemailer SMTP (SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM).
 * - Không có SMTP và `LEAD_MAIL_TRANSPORT=file` → ghi mỗi email thành một tệp .eml trong LEAD_MAIL_DIR (mặc định
 *   .cache/lead-mail, gitignore, quyền 700/600). CHỈ dev và bản xem trước: bị từ chối khi NODE_ENV=production mà không có
 *   DRAFT_PREVIEW=1 (site thật).
 * - Không có kênh nào (production thiếu SMTP) → trả null: outbox KHÔNG đánh dấu sent, ghi last_error_code
 *   MAIL_TRANSPORT_MISSING, log error, thử lại theo lịch.
 * - Địa chỉ giữ chỗ `…@invalid` / `….invalid` (chưa có địa chỉ thật, D-02): SMTP từ chối gửi (RECIPIENT_PLACEHOLDER);
 *   tệp .eml vẫn được ghi để xem trước.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import nodemailer from 'nodemailer';

export type MailMessage = { from: string; to: string; replyTo?: string; subject: string; text: string; html: string };

export type MailTransport = {
  kind: 'smtp' | 'file';
  send(message: MailMessage, fileTag: string): Promise<void>;
};

export class MailError extends Error {
  // Không dùng parameter property (script Node nạp file này bằng type stripping, chỉ hỗ trợ cú pháp xóa được)
  code: string;
  constructor(code: string) {
    super(code);
    this.name = 'MailError';
    this.code = code;
  }
}

type Env = Record<string, string | undefined>;

export const DEFAULT_MAIL_DIR = '.cache/lead-mail';
const DEFAULT_FROM = 'Bluebolt Website <no-reply@lapdattoanquoc.vn>';

export function mailFrom(env: Env = process.env): string {
  return env.SMTP_FROM?.trim() || DEFAULT_FROM;
}

export function isPlaceholderAddress(address: string): boolean {
  const domain = address.slice(address.lastIndexOf('@') + 1).toLowerCase();
  return domain === 'invalid' || domain.endsWith('.invalid');
}

/** Mã lỗi kỹ thuật cho last_error_code / log: chỉ [A-Z0-9_], ≤ 64 ký tự, KHÔNG chứa nội dung lead hay địa chỉ. */
export function mailErrorCode(err: unknown, prefix: 'SMTP' | 'FILE'): string {
  if (err instanceof MailError) return err.code;
  const e = err as { code?: unknown; responseCode?: unknown } | null;
  const raw = typeof e?.code === 'string' ? e.code : typeof e?.responseCode === 'number' ? String(e.responseCode) : 'ERROR';
  return `${prefix}_${raw.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`.slice(0, 64);
}

function smtpTransport(env: Env): MailTransport {
  const port = Number(env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return {
    kind: 'smtp',
    async send(message) {
      if (isPlaceholderAddress(message.to)) throw new MailError('RECIPIENT_PLACEHOLDER');
      try {
        await transporter.sendMail(message);
      } catch (err) {
        throw new MailError(mailErrorCode(err, 'SMTP'));
      }
    },
  };
}

function fileTransport(dir: string): MailTransport {
  const composer = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  return {
    kind: 'file',
    async send(message, fileTag) {
      try {
        const info = await composer.sendMail(message);
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, '');
        const name = `${stamp}-${fileTag.replace(/[^A-Za-z0-9_-]/g, '_')}-${randomBytes(3).toString('hex')}.eml`;
        writeFileSync(join(dir, name), info.message as Buffer, { mode: 0o600 });
      } catch (err) {
        throw new MailError(mailErrorCode(err, 'FILE'));
      }
    },
  };
}

/** Chọn kênh theo môi trường. null = không có kênh hợp lệ (production thiếu SMTP). */
export function createMailTransport(env: Env = process.env, cwd: string = process.cwd()): MailTransport | null {
  if (env.SMTP_HOST?.trim()) return smtpTransport(env);
  const liveProduction = env.NODE_ENV === 'production' && env.DRAFT_PREVIEW !== '1';
  if (env.LEAD_MAIL_TRANSPORT === 'file' && !liveProduction) {
    const dir = env.LEAD_MAIL_DIR?.trim() || DEFAULT_MAIL_DIR;
    return fileTransport(isAbsolute(dir) ? dir : resolve(cwd, dir));
  }
  return null;
}
