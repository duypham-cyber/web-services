import { describe, expect, it } from 'vitest';
import { ALL_CLAIMS } from '@/content/claims';
import { claim } from '@/lib/claims';

describe('lib/claims.ts — câu khẳng định chưa duyệt không lên production', () => {
  it('claim nháp → null khi không phải bản xem trước', () => {
    for (const c of ALL_CLAIMS) {
      if ((c.status as string) !== 'approved') expect(claim(c.id, 'vi', { draftPreview: false })).toBeNull();
    }
  });

  it('claim nháp → có chữ + cờ draft khi DRAFT_PREVIEW', () => {
    const c = claim('coverage.provinces-34', 'en', { draftPreview: true });
    expect(c).toEqual({ text: 'Installation network across all 34 provinces', draft: true });
  });
});
