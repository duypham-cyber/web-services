#!/usr/bin/env node
/**
 * leads-notify-retry.mjs — gửi lại thông báo lead còn treo (outbox), contracts/lead-b2b.md mục 3.5.
 *
 *   node scripts/leads-notify-retry.mjs                    # một lượt: nhận dòng tới hạn theo lô 20, gửi, ghi kết quả
 *   node scripts/leads-notify-retry.mjs --requeue-dead     # runbook dead letter: đưa dòng 'dead' về 'pending' (attempts=0)
 *   node scripts/leads-notify-retry.mjs --requeue-dead --lead <uuid>
 *
 * - Chạy mỗi 5 phút: bbsw/bản xem trước dùng timer systemd user (deploy/leads/bluebolt-web-leads-retry.timer);
 *   production: cron trên host hoặc service `lead-notifier` dùng cùng image (devops chọn, docs/LEADS-RUNBOOK.md).
 * - An toàn khi chạy chồng nhau: nhận việc bằng lease + FOR UPDATE SKIP LOCKED (lib/leads/outbox.ts).
 * - Backoff 8 lần (~22 giờ) rồi 'dead' + log error lead_notify_dead. Dòng pending cũ hơn 30 phút → log error lead_notify_backlog.
 * - Kết nối: DATABASE_URL (role bb_app). Kênh gửi: SMTP_HOST, hoặc tệp .eml (LEAD_MAIL_TRANSPORT=file, chỉ dev/bản xem trước).
 * - Log: một dòng JSON mỗi sự kiện, KHÔNG có nội dung lead hay địa chỉ nhận. Mã thoát 1 khi không kết nối được DB.
 */
import { importTs, loadLocalEnv, ROOT } from '../lib/leads/script-runtime.mjs';

loadLocalEnv();
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
};

const [{ getPool }, { createLeadLogger, errorInfo }, outbox, { createMailTransport, mailFrom }] = await Promise.all([
  importTs('lib/leads/db.ts'),
  importTs('lib/leads/logger.ts'),
  importTs('lib/leads/outbox.ts'),
  importTs('lib/leads/notify/transport.ts'),
]);

const logger = createLeadLogger(undefined, 'LeadsRetry');
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  logger.error('lead_notify_error', { errorCode: 'DATABASE_URL_MISSING', missing: ['DATABASE_URL'] });
  process.exit(1);
}

const pool = getPool(url, {
  max: 2,
  allowExitOnIdle: true,
  onError: (err) => logger.error('lead_notify_error', { errorCode: 'DB_POOL', error: errorInfo(err) }),
});

let exitCode = 0;
try {
  if (flag('--requeue-dead')) {
    const leadId = option('--lead');
    if (leadId !== undefined && !/^[0-9a-f-]{36}$/i.test(leadId)) throw new Error('--lead phải là UUID');
    const n = await outbox.requeueDead(pool, leadId);
    logger.info('lead_ops', { reason: 'requeue_dead', count: n, ...(leadId ? { leadId } : {}) });
  }
  const transport = createMailTransport(process.env, ROOT);
  const ctx = { db: pool, transport, recipients: outbox.recipientsFromEnv(process.env), from: mailFrom(process.env), logger };
  const result = await outbox.runRetryPass(ctx);
  const backlog = await outbox.checkBacklog(pool, logger);
  logger.info('lead_notify_run', {
    claimed: result.claimed,
    sent: result.sent,
    failed: result.failed,
    dead: result.dead,
    count: backlog,
    reason: transport ? transport.kind : 'no_transport',
  });
} catch (err) {
  logger.error('lead_notify_error', { errorCode: 'RUN_FAILED', error: errorInfo(err) });
  exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
process.exit(exitCode);
