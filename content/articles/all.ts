import { articles, type ArticleKey } from '../articles';
import type { ClaimId } from '../claims';
import { nguyenNhanMayLanhKhongLanh } from './10-nguyen-nhan-may-lanh-khong-lanh';
import { chuyenDoiSoTrongLapDat } from './chuyen-doi-so-trong-lap-dat-toan-quoc';
import { lapDatMayLanhDungCach7Buoc } from './lap-dat-may-lanh-dung-cach-7-buoc';
import { robotTuDongHoaGiaDinh } from './robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai';
import { ruiRoLapDatMayGiat } from './rui-ro-lap-dat-may-giat-khong-dung-cach';
import { tuongLaiNganhDienLanh2026 } from './tuong-lai-nganh-dien-lanh-2026';
import type { ArticleContent, Block, ImageAsset, ListItem, Localized, Section, Step } from './types';

/**
 * Thân bài của 6 bài /kien-thuc (registry: content/articles.ts). Chỉ import tương đối, không zod, không '@/'
 * → dùng được ở server, script và Playwright. Kiểm dữ liệu: content/articles/schema.ts (assertArticlesValid).
 */
export const ARTICLE_CONTENT: Readonly<Record<ArticleKey, ArticleContent>> = {
  'lap-dat-may-lanh-dung-cach-7-buoc': lapDatMayLanhDungCach7Buoc,
  '10-nguyen-nhan-may-lanh-khong-lanh': nguyenNhanMayLanhKhongLanh,
  'rui-ro-lap-dat-may-giat-khong-dung-cach': ruiRoLapDatMayGiat,
  'chuyen-doi-so-trong-lap-dat-toan-quoc': chuyenDoiSoTrongLapDat,
  'tuong-lai-nganh-dien-lanh-2026': tuongLaiNganhDienLanh2026,
  'robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai': robotTuDongHoaGiaDinh,
};

export type Locale = 'vi' | 'en';
export type { ArticleContent, Block, ImageAsset, ListItem, Localized, Section, Step };

/** Thứ tự nhóm trên trang /kien-thuc. */
export const ARTICLE_CATEGORIES = ['installation-guide', 'technical-knowledge', 'b2b'] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export type ArticleEntry = (typeof articles)[number] & { content: ArticleContent };

/** Registry + thân bài, sắp theo ngày đăng mới nhất trước. */
export function listArticles(): ArticleEntry[] {
  return articles
    .map((a) => ({ ...a, content: ARTICLE_CONTENT[a.key] }))
    .sort((a, b) => b.content.publishedAt.localeCompare(a.content.publishedAt));
}

export function findArticleBySlug(locale: Locale, slug: string): ArticleEntry | undefined {
  return listArticles().find((a) => a.slug[locale] === slug);
}

export function getArticle(key: ArticleKey): ArticleEntry {
  const found = listArticles().find((a) => a.key === key);
  if (!found) throw new Error(`content/articles: không có bài "${key}"`);
  return found;
}

/** Bài liên quan: cùng nhóm trước, rồi bài mới nhất; không gồm chính bài đó. */
export function relatedArticles(key: ArticleKey, limit = 3): ArticleEntry[] {
  const all = listArticles();
  const self = all.find((a) => a.key === key);
  const others = all.filter((a) => a.key !== key);
  const same = others.filter((a) => a.category === self?.category);
  const rest = others.filter((a) => a.category !== self?.category);
  return [...same, ...rest].slice(0, limit);
}

// ---------------------------------------------------------------------------------------------
// Chữ thuần, mã neo, thời gian đọc
// ---------------------------------------------------------------------------------------------

/** Bỏ đánh dấu **đậm** để lấy chữ thuần (meta, JSON-LD, đếm từ). */
export function plainText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1');
}

/** "Hút chân không — bước bắt buộc" → "hut-chan-khong-buoc-bat-buoc" (không dấu, đ → d, ≤ 64 ký tự). */
export function slugifyHeading(text: string): string {
  const base = plainText(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length <= 64) return base || 'muc';
  const cut = base.slice(0, 64);
  return cut.slice(0, Math.max(cut.lastIndexOf('-'), 24)).replace(/-+$/g, '');
}

export function isClaimItem(item: ListItem): item is { readonly claim: ClaimId } {
  return 'claim' in item;
}

/** Ảnh có hiện ở ngôn ngữ này không (ảnh có chữ tiếng Việt in sẵn chỉ hiện ở bản VI). */
export function imageVisible(image: ImageAsset, locale: Locale): boolean {
  return !image.locales || image.locales.includes(locale);
}

function blockTexts(block: Block, locale: Locale): string[] {
  switch (block.type) {
    case 'p':
    case 'callout':
    case 'quote':
      return [block.text[locale]];
    case 'list':
      return [
        ...(block.label ? [block.label[locale]] : []),
        ...block.items.flatMap((i) => (isClaimItem(i) ? [] : [i[locale]])),
      ];
    case 'defs':
      return block.items.flatMap((i) => [i.term[locale], i.text[locale]]);
    case 'figure':
      return imageVisible(block.image, locale) && block.caption ? [block.caption[locale]] : [];
    case 'gallery':
      return [...block.items.map((i) => i.label[locale]), ...(block.caption ? [block.caption[locale]] : [])];
    case 'steps':
      return block.items.flatMap((s) => [s.title[locale], ...s.blocks.flatMap((b) => blockTexts(b, locale))]);
    case 'claim':
      return [];
  }
}

/** Mọi đoạn chữ (không gồm câu khẳng định) của bài theo ngôn ngữ — để đếm từ và kiểm chính tả/giọng văn. */
export function articleTexts(content: ArticleContent, locale: Locale): string[] {
  return [
    content.lead[locale],
    ...content.intro.flatMap((b) => blockTexts(b, locale)),
    ...content.sections.flatMap((s) => [s.title[locale], ...s.blocks.flatMap((b) => blockTexts(b, locale))]),
  ].map(plainText);
}

/** Phút đọc: ~200 từ/phút (VI, tính theo âm tiết) · ~230 từ/phút (EN). Tối thiểu 1. */
export function readingMinutes(content: ArticleContent, locale: Locale): number {
  const words = articleTexts(content, locale)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / (locale === 'vi' ? 200 : 230)));
}

// ---------------------------------------------------------------------------------------------
// Dàn ý (mục lục + mã neo) — một nguồn cho mục lục và thân bài để #id luôn khớp
// ---------------------------------------------------------------------------------------------

export type OutlineStep = { id: string; title: string; step: Step };
export type OutlineSection = {
  id: string;
  title: string;
  section: Section;
  /** true = cả mục phụ thuộc claim nháp (chỉ thấy ở bản xem trước). */
  draft: boolean;
  steps: OutlineStep[];
};

/**
 * Dàn ý của bài theo ngôn ngữ. `claimState(id)` cho biết claim hiện ra sao: 'approved' | 'draft' | 'hidden'
 * (lấy từ lib/claims.ts ở trang). Mục có gate 'hidden' bị bỏ khỏi dàn ý (và khỏi trang).
 */
export function articleOutline(
  content: ArticleContent,
  locale: Locale,
  claimState: (id: ClaimId) => 'approved' | 'draft' | 'hidden',
): OutlineSection[] {
  const used = new Set<string>();
  const uniqueId = (title: string) => {
    const base = slugifyHeading(title);
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
  const result: OutlineSection[] = [];
  for (const section of content.sections) {
    const state = section.gate ? claimState(section.gate) : 'approved';
    if (state === 'hidden') continue;
    const title = plainText(section.title[locale]);
    const id = uniqueId(title);
    const steps: OutlineStep[] = section.blocks
      .filter((b): b is Extract<Block, { type: 'steps' }> => b.type === 'steps')
      .flatMap((b) => b.items)
      .map((step) => {
        const stepTitle = plainText(step.title[locale]);
        return { id: uniqueId(stepTitle), title: stepTitle, step };
      });
    result.push({ id, title, section, draft: state === 'draft', steps });
  }
  return result;
}
