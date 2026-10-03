/**
 * Gọi POST /api/v1/leads và quy mọi kết quả về một dạng (contracts/lead-b2b.md mục 3.1).
 * FE KHÔNG hiện `error.message` (tiếng Anh cho developer): chỉ dùng `error.code` + `details[].code` để chọn câu VI/EN.
 */
import { LEAD_DETAIL_CODES, LEAD_ERROR_CODES, type LeadDetailCode } from '@/lib/leads/rules';
import { uuidV4 } from './client-utils';

/** Mã lỗi FE có thể gặp: mã của API + hai mã phía trình duyệt (contract mục 3.7). */
export type LeadClientErrorCode = (typeof LEAD_ERROR_CODES)[number] | 'NETWORK_ERROR' | 'CLIENT_VALIDATION';

export type LeadDetail = { field: string; code: LeadDetailCode };

export type SubmitOutcome =
  | { ok: true; reference: string; replayed: boolean }
  | {
      ok: false;
      status: number;
      code: LeadClientErrorCode;
      details: LeadDetail[];
      retryAfterSec: number | null;
      correlationId: string;
    };

const ERROR_SET: ReadonlySet<string> = new Set(LEAD_ERROR_CODES);
const DETAIL_SET: ReadonlySet<string> = new Set(LEAD_DETAIL_CODES);

/** Lỗi không phải JSON của API (vd openresty trả trang HTML): đoán theo mã HTTP. */
function codeFromStatus(status: number): LeadClientErrorCode {
  if (status === 413) return 'PAYLOAD_TOO_LARGE';
  if (status === 429) return 'RATE_LIMITED';
  return 'INTERNAL_ERROR';
}

function parseDetails(raw: unknown): LeadDetail[] {
  if (!Array.isArray(raw)) return [];
  const out: LeadDetail[] = [];
  for (const d of raw) {
    if (!d || typeof d !== 'object') continue;
    const { field, code } = d as { field?: unknown; code?: unknown };
    if (typeof field === 'string' && typeof code === 'string' && DETAIL_SET.has(code)) {
      out.push({ field, code: code as LeadDetailCode });
    }
  }
  return out;
}

export async function postLead(endpoint: string, body: unknown, idempotencyKey: string): Promise<SubmitOutcome> {
  const sentCid = uuidV4();
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'idempotency-key': idempotencyKey,
        'x-correlation-id': sentCid,
      },
      body: JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    return { ok: false, status: 0, code: 'NETWORK_ERROR', details: [], retryAfterSec: null, correlationId: sentCid };
  }

  const cid = res.headers.get('x-correlation-id') ?? sentCid;
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  const data = (json as { success?: unknown; data?: { reference?: unknown } } | null) ?? null;
  if (res.status === 201 && data?.success === true && typeof data.data?.reference === 'string') {
    return { ok: true, reference: data.data.reference, replayed: res.headers.get('idempotent-replayed') === 'true' };
  }

  const error = (json as { error?: { code?: unknown; details?: unknown; correlationId?: unknown } } | null)?.error;
  const apiCode = typeof error?.code === 'string' && ERROR_SET.has(error.code) ? (error.code as LeadClientErrorCode) : null;
  const retry = Number(res.headers.get('retry-after'));
  return {
    ok: false,
    status: res.status,
    code: apiCode ?? codeFromStatus(res.status),
    details: parseDetails(error?.details),
    retryAfterSec: Number.isFinite(retry) && retry > 0 ? retry : null,
    correlationId: typeof error?.correlationId === 'string' ? error.correlationId : cid,
  };
}
