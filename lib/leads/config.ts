/**
 * Cấu hình form lead đọc từ biến môi trường (contracts/lead-b2b.md mục 3.9 + docs/LEADS-RUNBOOK.md).
 * CHỈ SERVER. Đọc lúc gọi (không đóng băng lúc build) để API thấy đúng môi trường của tiến trình đang chạy.
 * Test truyền object env riêng.
 */
import { isTurnstileTestSecret } from './turnstile';

export type ClientIpSource = 'xff-last' | 'x-real-ip';

export type LeadsConfig = {
  /** LEADS_FORM_ENABLED === 'true' (công tắc tắt khẩn cấp, Rule 9). */
  formEnabled: boolean;
  /** DRAFT_PREVIEW=1: bản xem trước — câu đồng ý nháp vẫn dùng được. */
  draftPreview: boolean;
  /** NODE_ENV=production và không phải bản xem trước = site thật. */
  liveProduction: boolean;
  databaseUrl: string | null;
  ipHashSecret: string | null;
  clientIpSource: ClientIpSource;
  allowedOrigins: string[];
  rateLimitMax: number;
  rateLimitWindowSec: number;
  turnstileSecret: string | null;
  turnstileAllowedHostnames: string[];
  turnstileTimeoutMs: number;
  /** Lỗi cấu hình (TÊN biến, không giá trị). Có lỗi → API trả 503 LEADS_DISABLED + log error. */
  problems: string[];
};

type Env = Record<string, string | undefined>;

const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const positiveInt = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

export function readLeadsConfig(env: Env = process.env): LeadsConfig {
  const draftPreview = env.DRAFT_PREVIEW === '1';
  const liveProduction = env.NODE_ENV === 'production' && !draftPreview;
  const turnstileSecret = env.TURNSTILE_SECRET_KEY?.trim() || null;
  const testSecret = turnstileSecret !== null && isTurnstileTestSecret(turnstileSecret);
  const config: LeadsConfig = {
    formEnabled: env.LEADS_FORM_ENABLED === 'true',
    draftPreview,
    liveProduction,
    databaseUrl: env.DATABASE_URL?.trim() || null,
    ipHashSecret: env.LEAD_IP_HASH_SECRET?.trim() || null,
    clientIpSource: env.LEAD_CLIENT_IP_SOURCE === 'x-real-ip' ? 'x-real-ip' : 'xff-last',
    allowedOrigins: list(env.LEAD_ALLOWED_ORIGINS),
    rateLimitMax: positiveInt(env.LEAD_RATE_LIMIT_MAX, 5),
    rateLimitWindowSec: positiveInt(env.LEAD_RATE_LIMIT_WINDOW_SEC, 600),
    turnstileSecret,
    turnstileAllowedHostnames: list(env.TURNSTILE_ALLOWED_HOSTNAMES).map((h) => h.toLowerCase()),
    turnstileTimeoutMs: positiveInt(env.TURNSTILE_TIMEOUT_MS, 3000),
    problems: [],
  };

  if (!config.databaseUrl) config.problems.push('DATABASE_URL');
  if (!config.ipHashSecret || config.ipHashSecret.length < 32) config.problems.push('LEAD_IP_HASH_SECRET');
  if (config.allowedOrigins.length === 0) config.problems.push('LEAD_ALLOWED_ORIGINS');
  if (!turnstileSecret) config.problems.push('TURNSTILE_SECRET_KEY');
  // Khóa test của Cloudflare luôn qua → trên site thật là mở cửa cho bot. Chỉ chấp nhận ở dev/bản xem trước.
  if (testSecret && liveProduction) config.problems.push('TURNSTILE_SECRET_KEY (test key on production)');
  if (!testSecret && config.turnstileAllowedHostnames.length === 0) config.problems.push('TURNSTILE_ALLOWED_HOSTNAMES');
  return config;
}
