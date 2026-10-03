/**
 * POST /api/contact — endpoint của site cũ, đã thay bằng POST /api/v1/leads.
 * D-11 (anh Duy duyệt mặc định, D-26): trả 410 JSON tối thiểu 90 ngày sau cutover, không ghi DB, không thông báo,
 * không chuyển tiếp 308 (body cũ không có consent theo mục đích — contracts/lead-b2b.md mục 3.2).
 */
import { randomUUID } from 'node:crypto';
import { createLeadLogger } from '@/lib/leads/logger';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request): Promise<Response> {
  const incoming = request.headers.get('x-correlation-id')?.trim() ?? '';
  const correlationId = UUID.test(incoming) ? incoming.toLowerCase() : randomUUID();
  createLeadLogger().info('lead_endpoint_gone', { correlationId });
  const body = {
    success: false,
    error: { code: 'ENDPOINT_GONE', message: 'Use POST /api/v1/leads', details: [], correlationId },
  };
  return new Response(JSON.stringify(body), {
    status: 410,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-correlation-id': correlationId,
    },
  });
}
