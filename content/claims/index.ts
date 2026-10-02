import type { Claim } from '../schemas';
import { coreClaims } from './core';
import { homeClaims } from './home';

/**
 * Gom mọi câu khẳng định. Mỗi khu vực có file riêng để agent sửa song song không đè nhau:
 *   content/claims/core.ts      — 34 tỉnh, chuẩn hãng, E-KYC, bảo hành, 24/7 (tech lead nền móng)
 *   content/claims/<khu-vuc>.ts — agent tự tạo khi cần (vd partners.ts cho thu nhập thợ), rồi thêm vào ALL_CLAIMS.
 * Mỗi file: `export const <ten>Claims = [...] as const satisfies readonly Claim[];`
 *
 * Đọc câu khẳng định CHỈ qua `claim(id, locale)` ở lib/claims.ts (không import trực tiếp text để render).
 */
export const ALL_CLAIMS = [...coreClaims, ...homeClaims] as const;

export type ClaimId = (typeof ALL_CLAIMS)[number]['id'];

export const claims: readonly Claim[] = ALL_CLAIMS;
