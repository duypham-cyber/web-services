/**
 * POST /api/v1/leads — nhận lead B2B và lead đối tác thợ.
 * Contract: contracts/lead-b2b.md (phần chung + B2B) và contracts/lead-technician.md — APPROVED 03/10/2026 (D-26).
 * Logic ở lib/leads/handler.ts. Chỉ export POST: GET/PUT/PATCH/DELETE nhận 405 của Next (contract mục 3.1, 6.2).
 */
import { after } from 'next/server';
import { createLeadDeps, handleLeadPost } from '@/lib/leads/handler';

export async function POST(request: Request): Promise<Response> {
  // Lần gửi thông báo đầu chạy sau khi response đã trả (contract mục 3.5); lỗi gửi không ảnh hưởng 201.
  return handleLeadPost(request, createLeadDeps({ schedule: (task) => after(task) }));
}
