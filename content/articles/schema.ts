import { z } from 'zod';
import { articles } from '../articles';
import { ALL_CLAIMS } from '../claims';
import { ARTICLE_CONTENT, articleTexts, plainText } from './all';
import type { ArticleContent } from './types';

/**
 * Kiểm thân bài /kien-thuc bằng Zod + luật giọng văn (docs/03 mục 11.5). Gọi ở server (trang bài, trang hub) nên
 * dữ liệu sai làm `next build` FAIL; tests/seo/seo-content.spec.ts gọi cùng hàm. KHÔNG import file này ở client.
 */
const VI_DIACRITICS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const EMOJI = /\p{Extended_Pictographic}/u;

const localized = z
  .object({
    vi: z.string().trim().min(1),
    en: z
      .string()
      .trim()
      .min(1)
      .refine((s) => !VI_DIACRITICS.test(s), 'bản EN không được có ký tự tiếng Việt có dấu'),
  })
  .strict();

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const claimId = z.string().refine((id) => ALL_CLAIMS.some((c) => c.id === id), 'claim không tồn tại');

const image = z
  .object({
    src: z.string().regex(/^\/images\/[A-Za-z0-9/_.-]+\.(jpg|jpeg|png|webp|avif)$/),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: localized,
    locales: z.array(z.enum(['vi', 'en'])).min(1).optional(),
    fit: z.enum(['cover', 'contain']).optional(),
  })
  .strict();

const listItem = z.union([localized, z.object({ claim: claimId }).strict()]);

const leafBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), text: localized }).strict(),
  z
    .object({
      type: z.literal('list'),
      ordered: z.boolean().optional(),
      label: localized.optional(),
      items: z.array(listItem).min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('defs'),
      ordered: z.boolean().optional(),
      items: z.array(z.object({ term: localized, text: localized }).strict()).min(1),
    })
    .strict(),
  z.object({ type: z.literal('figure'), image, caption: localized.optional() }).strict(),
  z
    .object({
      type: z.literal('gallery'),
      items: z.array(z.object({ image, label: localized }).strict()).min(2),
      caption: localized.optional(),
    })
    .strict(),
  z.object({ type: z.literal('callout'), tone: z.enum(['tip', 'warning']), text: localized }).strict(),
  z.object({ type: z.literal('quote'), text: localized }).strict(),
  z.object({ type: z.literal('claim'), id: claimId }).strict(),
]);

const step = z.object({ title: localized, blocks: z.array(leafBlock).min(1) }).strict();
const block = z.union([leafBlock, z.object({ type: z.literal('steps'), items: z.array(step).min(2) }).strict()]);

const articleContentSchema = z
  .object({
    key: z.string(),
    seoTitle: localized.refine((t) => t.vi.length <= 60 && t.en.length <= 60, 'seoTitle ≤ 60 ký tự'),
    description: localized.refine(
      (d) => [d.vi, d.en].every((s) => s.length >= 70 && s.length <= 155),
      'description 70–155 ký tự',
    ),
    lead: localized,
    publishedAt: isoDate,
    updatedAt: isoDate,
    hero: image.nullable(),
    ogImage: z
      .object({
        src: z.string().regex(/^\/images\/[A-Za-z0-9/_.-]+\.(jpg|jpeg|png)$/),
        width: z.literal(1200),
        height: z.literal(630),
      })
      .strict()
      .nullable(),
    intro: z.array(block),
    sections: z.array(z.object({ title: localized, blocks: z.array(block), gate: claimId.optional() }).strict()).min(1),
    editNotes: z.array(z.string().min(1)),
  })
  .strict()
  .superRefine((a, ctx) => {
    if (a.updatedAt < a.publishedAt) ctx.addIssue({ code: 'custom', message: 'updatedAt phải ≥ publishedAt' });
    a.sections.forEach((s, i) => {
      if (!s.gate && s.blocks.length === 0) ctx.addIssue({ code: 'custom', message: `mục ${i + 1} trống` });
    });
  });

/** Luật giọng văn (docs/03 mục 11.5) cho mọi đoạn chữ của bài, cả VI và EN. */
function voiceProblems(content: ArticleContent): string[] {
  const problems: string[] = [];
  for (const locale of ['vi', 'en'] as const) {
    for (const raw of articleTexts(content, locale)) {
      const text = plainText(raw);
      if (EMOJI.test(text)) problems.push(`[${locale}] có emoji: "${text.slice(0, 60)}"`);
      if (/[?!]{2,}|!/.test(text)) problems.push(`[${locale}] có "!" hoặc "?!": "${text.slice(0, 60)}"`);
      if (/\bBBSV\b/.test(text)) problems.push(`[${locale}] viết tắt nội bộ BBSV`);
      // Chữ VIẾT HOA giữa câu (2 từ ≥ 4 chữ cái viết hoa liền nhau; từ viết tắt ngắn như AI, IoT, CB, BTU vẫn được)
      if (/(?:^|\s)\p{Lu}{4,}\s+\p{Lu}{4,}(?=$|[\s.,:;])/u.test(text)) {
        problems.push(`[${locale}] VIẾT HOA giữa câu: "${text.slice(0, 60)}"`);
      }
    }
  }
  return problems;
}

/** Kiểm toàn bộ thân bài; ném lỗi liệt kê mọi vấn đề. */
export function validateArticles(): void {
  const problems: string[] = [];
  const registryKeys = new Set<string>(articles.map((a) => a.key));
  for (const [key, content] of Object.entries(ARTICLE_CONTENT)) {
    if (!registryKeys.has(key)) problems.push(`${key}: không có trong content/articles.ts`);
    if (content.key !== key) problems.push(`${key}: key trong nội dung là "${content.key}"`);
    const r = articleContentSchema.safeParse(content);
    if (!r.success) problems.push(`${key}: ${z.prettifyError(r.error)}`);
    problems.push(...voiceProblems(content).map((p) => `${key}: ${p}`));
  }
  for (const a of articles) {
    if (!(a.key in ARTICLE_CONTENT)) problems.push(`${a.key}: chưa có thân bài trong content/articles/all.ts`);
  }
  if (problems.length > 0) throw new Error(`content/articles không hợp lệ:\n- ${problems.join('\n- ')}`);
}

let validated = false;

/** Gọi nhiều lần chỉ kiểm 1 lần mỗi tiến trình. */
export function assertArticlesValid(): void {
  if (validated) return;
  validateArticles();
  validated = true;
}
