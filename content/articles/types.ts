import type { ArticleKey } from '../articles';
import type { ClaimId } from '../claims';

/**
 * Kiểu dữ liệu thân bài /kien-thuc/[slug] (agent nội dung & SEO).
 *
 * - Mỗi chuỗi có bản VI và EN ({ vi, en }); EN là nháp chờ người biên tập bản ngữ (content/README.md quy tắc 5).
 * - Chữ đậm trong câu: **...** (components/knowledge/InlineText). Không có HTML, không link nội tuyến.
 * - Câu khẳng định về Bluebolt (bảo hành, thời gian phản hồi, kết quả vận hành, dịch vụ cho khách lẻ...) KHÔNG viết
 *   thẳng vào đây: dùng { type: 'claim', id } / { claim: id } / Section.gate → lib/claims.ts quyết định hiện hay ẩn.
 * - Ảnh: đường dẫn trong public/ (giữ tên ảnh của site cũ dưới /images/news/). Ảnh có chữ tiếng Việt in sẵn đặt
 *   `locales: ['vi']` để bản EN không hiện.
 * - File dữ liệu KHÔNG import zod (schema ở content/articles/schema.ts, kiểm lúc build trong trang bài).
 */
export type Localized = { readonly vi: string; readonly en: string };

/** Ngày dạng YYYY-MM-DD. */
export type IsoDate = `${number}-${number}-${number}`;

export type ImageAsset = {
  /** Đường dẫn trong public/, bắt đầu bằng "/images/". */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: Localized;
  /** Chỉ hiện ở các ngôn ngữ này (ảnh có chữ tiếng Việt in sẵn → ['vi']). Mặc định: mọi ngôn ngữ. */
  readonly locales?: readonly ('vi' | 'en')[];
  /** cover = cắt cho đầy khung (ảnh chụp) · contain = giữ trọn ảnh (infographic). Mặc định cover. */
  readonly fit?: 'cover' | 'contain';
  /** Ảnh minh họa AI/stock (content/photos.ts, D-31) → khung hiện nhãn "Ảnh minh họa". */
  readonly illustrative?: true;
};

/** Mục danh sách: chữ thường, hoặc một câu khẳng định đọc qua claim(). */
export type ListItem = Localized | { readonly claim: ClaimId };

export type Block =
  /** Đoạn văn. */
  | { readonly type: 'p'; readonly text: Localized }
  /** Danh sách. `label` = nhãn in đậm phía trên (vd "Dấu hiệu"). */
  | {
      readonly type: 'list';
      readonly ordered?: boolean;
      readonly label?: Localized;
      readonly items: readonly ListItem[];
    }
  /** Danh sách có tiêu đề ngắn cho từng mục (tổng quan 10 nguyên nhân, checklist 6 bước). */
  | {
      readonly type: 'defs';
      readonly ordered?: boolean;
      readonly items: readonly { readonly term: Localized; readonly text: Localized }[];
    }
  /** Ảnh có chú thích. */
  | { readonly type: 'figure'; readonly image: ImageAsset; readonly caption?: Localized }
  /** Nhóm ảnh nhỏ có nhãn. */
  | {
      readonly type: 'gallery';
      readonly items: readonly { readonly image: ImageAsset; readonly label: Localized }[];
      readonly caption?: Localized;
    }
  /** Hộp lưu ý (tip) hoặc cảnh báo (warning). */
  | { readonly type: 'callout'; readonly tone: 'tip' | 'warning'; readonly text: Localized }
  /** Câu trích/nhấn ý. */
  | { readonly type: 'quote'; readonly text: Localized }
  /** Các bước/mục đánh số lớn (marker xanh), mỗi mục là một H3 trong mục lục. */
  | { readonly type: 'steps'; readonly items: readonly Step[] }
  /** Một câu khẳng định thành đoạn văn: production ẩn nếu claim chưa duyệt; bản xem trước hiện kèm nhãn Nháp. */
  | { readonly type: 'claim'; readonly id: ClaimId };

export type Step = {
  readonly title: Localized;
  readonly blocks: readonly Block[];
};

export type Section = {
  /** Tiêu đề H2 (sentence case). Mã neo (#id) tự sinh từ tiêu đề theo từng ngôn ngữ. */
  readonly title: Localized;
  readonly blocks: readonly Block[];
  /**
   * Cả mục phụ thuộc một câu khẳng định: claim chưa duyệt → production ẩn cả mục (kể cả trong mục lục);
   * bản xem trước hiện tiêu đề kèm nhãn Nháp và đặt câu khẳng định làm đoạn đầu của mục.
   */
  readonly gate?: ClaimId;
};

export type ArticleContent = {
  readonly key: ArticleKey;
  /** <title> riêng của bài (≤ 60 ký tự, đã gồm thương hiệu nếu vừa). H1 lấy từ content/articles.ts (title). */
  readonly seoTitle: Localized;
  /** Meta description + đoạn trích trên thẻ bài (70–155 ký tự). */
  readonly description: Localized;
  /** Đoạn dẫn ngay dưới H1. */
  readonly lead: Localized;
  /** Ngày đăng trên site cũ (article:published_time). */
  readonly publishedAt: IsoDate;
  /** Ngày sửa nội dung gần nhất (sitemap lastmod, dateModified). */
  readonly updatedAt: IsoDate;
  /** Ảnh đầu bài. null → khung giữ chỗ (components/knowledge/MediaFrame). */
  readonly hero: ImageAsset | null;
  /** Ảnh Open Graph 1200×630 (scripts/gen-og-images.mjs). null → ảnh OG mặc định của site. */
  readonly ogImage: { readonly src: string; readonly width: 1200; readonly height: 630 } | null;
  /** Các khối trước mục H2 đầu tiên. */
  readonly intro: readonly Block[];
  readonly sections: readonly Section[];
  /** Ghi chú biên tập (nội bộ, không hiển thị): đã sửa gì so với bài cũ và vì sao. */
  readonly editNotes: readonly string[];
};
