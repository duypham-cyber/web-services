/**
 * Truy cập Postgres cho form lead (contracts/lead-b2b.md mục 2 + bước 7, 12). CHỈ SERVER. Chỉ truy vấn tham số hóa;
 * payload ghi bằng `$n::jsonb` (mục 6.3). Role của app: bb_app (INSERT/SELECT leads; INSERT/SELECT lead_notifications +
 * UPDATE chỉ 5 cột status, attempts, next_attempt_at, last_error_code, sent_at — migration 20261003184500). Câu UPDATE mới
 * trên lead_notifications chỉ được SET các cột này, nếu không sẽ "permission denied".
 */
import pg from 'pg';
import type { LeadType } from './rules';

export type Db = Pick<pg.Pool, 'query' | 'connect'>;

const POOLS_KEY = Symbol.for('bluebolt-web.leads.pg-pools');

type PoolOptions = { max?: number; allowExitOnIdle?: boolean; onError?: (err: Error) => void };

/** Một Pool cho mỗi chuỗi kết nối, giữ trên globalThis (HMR của dev không mở thêm kết nối). */
export function getPool(connectionString: string, options: PoolOptions = {}): pg.Pool {
  const g = globalThis as unknown as Record<symbol, Map<string, pg.Pool> | undefined>;
  const pools = (g[POOLS_KEY] ??= new Map());
  let pool = pools.get(connectionString);
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      max: options.max ?? 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 3_000,
      statement_timeout: 5_000,
      query_timeout: 6_000,
      application_name: 'bluebolt-web-leads',
      allowExitOnIdle: options.allowExitOnIdle ?? false,
    });
    // Client rảnh bị ngắt (DB restart…) phát 'error' trên pool: phải bắt, không thì tiến trình chết
    pool.on('error', (err: Error) => options.onError?.(err));
    pools.set(connectionString, pool);
  }
  return pool;
}

export type NewLead = {
  type: LeadType;
  payload: Record<string, unknown>;
  payloadVersion: number;
  consentVersion: string;
  consentPurposes: string[];
  ipHash: string;
  utm: Record<string, string>;
  locale: 'vi' | 'en';
  pagePath: string;
  filmTier: string | null;
  meta: Record<string, unknown>;
  idempotencyKey: string | null;
  correlationId: string;
};

export type NotificationRoute = { channel: 'email'; target: string };

export type StoredLeadRef = { id: string; type: LeadType; createdAt: Date };

const INSERT_LEAD = `
INSERT INTO leads (type, payload, payload_version, consent_version, consent_purposes, ip_hash, utm, locale, page_path,
                   film_tier, meta, idempotency_key, correlation_id)
VALUES ($1, $2::jsonb, $3, $4, $5::text[], $6, $7::jsonb, $8, $9, $10, $11::jsonb, $12::uuid, $13)
RETURNING id, type, created_at`;

const INSERT_NOTIFICATIONS = `
INSERT INTO lead_notifications (lead_id, channel, target)
SELECT $1::uuid, r.channel, r.target FROM unnest($2::text[], $3::text[]) AS r(channel, target)`;

/** Bước 12: một transaction ghi lead + các dòng outbox. Ném lỗi pg nguyên trạng (handler phân loại). */
export async function insertLeadWithNotifications(db: Db, lead: NewLead, routes: readonly NotificationRoute[]): Promise<StoredLeadRef> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: string; type: LeadType; created_at: Date }>(INSERT_LEAD, [
      lead.type,
      JSON.stringify(lead.payload),
      lead.payloadVersion,
      lead.consentVersion,
      lead.consentPurposes,
      lead.ipHash,
      JSON.stringify(lead.utm),
      lead.locale,
      lead.pagePath,
      lead.filmTier,
      JSON.stringify(lead.meta),
      lead.idempotencyKey,
      lead.correlationId,
    ]);
    const row = rows[0];
    if (!row) throw new Error('INSERT leads không trả về dòng nào');
    await client.query(INSERT_NOTIFICATIONS, [row.id, routes.map((r) => r.channel), routes.map((r) => r.target)]);
    await client.query('COMMIT');
    return { id: row.id, type: row.type, createdAt: row.created_at };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function findLeadByIdempotencyKey(db: Db, key: string): Promise<StoredLeadRef | null> {
  const { rows } = await db.query<{ id: string; type: LeadType; created_at: Date }>(
    'SELECT id, type, created_at FROM leads WHERE idempotency_key = $1::uuid',
    [key],
  );
  const row = rows[0];
  return row ? { id: row.id, type: row.type, createdAt: row.created_at } : null;
}

/** Lỗi trùng Idempotency-Key khi hai request cùng khóa chạy song song (unique index). */
export function isIdempotencyConflict(err: unknown): boolean {
  const e = err as { code?: string; constraint?: string } | null;
  return e?.code === '23505' && e.constraint === 'uq_leads_idempotency_key';
}
