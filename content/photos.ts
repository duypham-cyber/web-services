/**
 * ẢNH MINH HỌA thay khung giữ chỗ (D-31, docs/PHOTOS.md). Đây là ảnh AI (Canva, FLUX.1-schnell) hoặc ảnh stock có giấy phép
 * miễn phí cho thương mại, KHÔNG phải thợ, văn phòng hay công trình thật của Bluebolt. Vì vậy mọi ảnh `illustrative` luôn
 * kèm nhãn "Ảnh minh họa" (components/media/Photo.tsx), và không dùng ở mục công trình/case study (docs/03 mục 11.4).
 *
 * Thay bằng ảnh chụp thật: chép bản gốc vào assets/photos/, sửa mục tương ứng ở đây (`illustrative: false`, `source`), rồi
 * chạy `node scripts/build-photos.mjs`. Trang và component không phải sửa.
 *
 * Xuất sẵn AVIF + WebP ở photoWidths() vào public/images/photos/<id>-<w>.<ext>. Trang chủ, trang B2B và trang partner
 * render <picture> thuần, không kéo next/image vào JS tải đầu. Ảnh đầu bài Kiến thức đi qua next/image nên chỉ cần bản
 * JPEG 16:9 (`wide`).
 */
export type PhotoSource =
  | { readonly kind: 'ai'; readonly tool: string; readonly license: string }
  | {
      readonly kind: 'stock';
      readonly site: 'Pexels' | 'Unsplash' | 'Pixabay';
      readonly author: string;
      readonly url: string;
      readonly license: string;
    };

export type PhotoAsset = {
  readonly id: string;
  /** File gốc trong assets/photos/ (không phục vụ trực tiếp). */
  readonly master: string;
  readonly width: number;
  readonly height: number;
  /** Mô tả đúng cái nhìn thấy, không gọi là thợ/văn phòng của Bluebolt. */
  readonly alt: { readonly vi: string; readonly en: string };
  /** object-position khi khung cắt ảnh. Mặc định giữa. */
  readonly position?: string;
  /** Ảnh AI/stock → nhãn "Ảnh minh họa". Ảnh chụp thật của Bluebolt → false. */
  readonly illustrative: boolean;
  readonly source: PhotoSource;
  /** Bản 16:9 cho ảnh đầu bài (next/image): file trong public/, tâm cắt theo chiều dọc 0–1 (mặc định 0,5). */
  readonly wide?: { readonly src: string; readonly width: number; readonly height: number; readonly focusY?: number };
};

const CANVA = { kind: 'ai', tool: 'Canva AI (generate-image), tài khoản Canva của dự án', license: 'Canva AI Product Terms' } as const;
const FLUX = {
  kind: 'ai',
  tool: 'FLUX.1 [schnell] (Black Forest Labs) qua Space Hugging Face black-forest-labs/FLUX.1-schnell',
  license: 'Apache-2.0',
} as const;

export const PHOTOS = {
  'tho-lap-dieu-hoa': {
    id: 'tho-lap-dieu-hoa',
    master: 'tho-lap-dieu-hoa.jpg',
    width: 1456,
    height: 1088,
    alt: {
      vi: 'Thợ kỹ thuật mặc áo xanh lắp dàn lạnh điều hòa treo tường trong căn hộ',
      en: 'A technician in a blue polo shirt mounting a wall-mounted air conditioner in an apartment',
    },
    position: '60% 35%',
    illustrative: true,
    source: CANVA,
    wide: { src: '/images/photos/tho-lap-dieu-hoa-16x9.jpg', width: 1456, height: 819, focusY: 0.3 },
  },
  'kho-hang-dien-may': {
    id: 'kho-hang-dien-may',
    master: 'kho-hang-dien-may.jpg',
    width: 1536,
    height: 1024,
    alt: {
      vi: 'Nhân viên kiểm đơn trên máy tính bảng giữa các thùng hàng điện máy, phía sau một người đẩy xe hàng',
      en: 'A coordinator checks orders on a tablet among boxed appliances while a colleague moves a box on a hand truck',
    },
    position: '45% 50%',
    illustrative: true,
    source: CANVA,
  },
  'tho-nhan-don-xe-may': {
    id: 'tho-nhan-don-xe-may',
    master: 'tho-nhan-don-xe-may.jpg',
    width: 1536,
    height: 1024,
    alt: {
      vi: 'Thợ kỹ thuật ngồi trên xe máy chở thùng đồ nghề và thang, xem đơn mới trên điện thoại',
      en: 'A technician on a motorbike carrying a tool case and a ladder checks a new job on his phone',
    },
    position: '45% 50%',
    illustrative: true,
    source: CANVA,
  },
  'tho-huong-dan-khach': {
    id: 'tho-huong-dan-khach',
    master: 'tho-huong-dan-khach.jpg',
    width: 1536,
    height: 1024,
    alt: {
      vi: 'Thợ kỹ thuật hướng dẫn một gia đình dùng điều khiển của máy điều hòa vừa lắp',
      en: 'A technician shows a family how to use the remote of a newly installed air conditioner',
    },
    position: '38% 50%',
    illustrative: true,
    source: CANVA,
  },
  'phong-dieu-phoi': {
    id: 'phong-dieu-phoi',
    master: 'phong-dieu-phoi.jpg',
    width: 1456,
    height: 1088,
    alt: {
      vi: 'Hai điều phối viên đeo tai nghe làm việc trước màn hình trong phòng điều phối',
      en: 'Two coordinators wearing headsets work at their screens in a dispatch room',
    },
    position: '40% 60%',
    illustrative: true,
    source: CANVA,
  },
  've-sinh-loc-may-lanh': {
    id: 've-sinh-loc-may-lanh',
    master: 've-sinh-loc-may-lanh.webp',
    width: 1664,
    height: 928,
    alt: {
      vi: 'Tay thợ rút tấm lưới lọc bám đầy bụi ra khỏi dàn lạnh điều hòa',
      en: 'Hands pulling a dust-covered filter out of an air conditioner indoor unit',
    },
    position: '45% 50%',
    illustrative: true,
    source: FLUX,
    wide: { src: '/images/photos/ve-sinh-loc-may-lanh-16x9.jpg', width: 1650, height: 928 },
  },
  'lap-dat-dien-may': {
    id: 'lap-dat-dien-may',
    master: 'lap-dat-dien-may.jpg',
    width: 1600,
    height: 1200,
    alt: {
      vi: 'Tivi màn hình phẳng gắn trên giá treo xoay, trên vách ốp vân đá trắng của phòng khách',
      en: 'A flat-screen TV on a swivel wall bracket against a white marble-effect living-room wall',
    },
    illustrative: true,
    source: {
      kind: 'stock',
      site: 'Pexels',
      author: 'Max Vakhtbovych',
      url: 'https://www.pexels.com/photo/interior-of-modern-living-room-with-tv-on-wall-6636297/',
      license: 'Pexels License',
    },
  },
  'robot-hut-bui': {
    id: 'robot-hut-bui',
    master: 'robot-hut-bui.jpg',
    width: 1600,
    height: 1200,
    alt: {
      vi: 'Robot hút bụi màu trắng trên sàn gỗ lát xương cá trong một căn phòng sáng',
      en: 'A white robot vacuum on a herringbone wooden floor in a bright room',
    },
    position: '60% 70%',
    illustrative: true,
    source: {
      kind: 'stock',
      site: 'Pexels',
      author: 'Ron Lach',
      url: 'https://www.pexels.com/photo/desk-area-and-cleaning-robot-on-floor-10567498/',
      license: 'Pexels License',
    },
  },
  'doi-soat-cuoi-ngay': {
    id: 'doi-soat-cuoi-ngay',
    master: 'doi-soat-cuoi-ngay.jpg',
    width: 1600,
    height: 1200,
    alt: {
      vi: 'Một nhân viên đeo kính làm việc với máy tính để bàn trong văn phòng buổi tối, phía sau là đèn bàn ánh vàng',
      en: 'A woman in glasses works at a desktop computer in an office in the evening, with a warm desk lamp behind her',
    },
    position: '50% 30%',
    illustrative: true,
    source: {
      kind: 'stock',
      site: 'Pexels',
      author: 'Vitaly Gariev',
      url: 'https://www.pexels.com/photo/focused-professional-working-at-computer-desk-39853305/',
      license: 'Pexels License',
    },
  },
  'van-phong': {
    id: 'van-phong',
    master: 'van-phong.jpg',
    width: 1600,
    height: 1200,
    alt: {
      vi: 'Những chậu cây xanh trên tủ gỗ, phía sau là một văn phòng mở sáng sủa được làm mờ',
      en: 'Potted plants on a wooden cabinet in front of a bright open-plan office, softly blurred',
    },
    illustrative: true,
    source: {
      kind: 'stock',
      site: 'Pexels',
      author: 'Mikhail Nilov',
      url: 'https://www.pexels.com/photo/potted-plants-in-an-office-8297857/',
      license: 'Pexels License',
    },
  },
  'dan-nong-mat-tien': {
    id: 'dan-nong-mat-tien',
    master: 'dan-nong-mat-tien.jpg',
    width: 1920,
    height: 1080,
    alt: {
      vi: 'Các cục nóng điều hòa đặt trong lồng lam kim loại bên dưới cửa sổ của một tòa nhà ốp gạch màu đất nung',
      en: 'Outdoor air-conditioner units in louvred metal cages below the windows of a terracotta-tiled apartment building',
    },
    illustrative: true,
    source: {
      kind: 'stock',
      site: 'Unsplash',
      author: 'ali syaaban',
      url: 'https://unsplash.com/photos/brown-and-white-concrete-buildings-during-daytime-kKRStYVnmGA',
      license: 'Unsplash License',
    },
    wide: { src: '/images/photos/dan-nong-mat-tien-16x9.jpg', width: 1920, height: 1080 },
  },
} as const satisfies Record<string, PhotoAsset>;

export type PhotoId = keyof typeof PHOTOS;

/** Các bề rộng đã xuất cho một ảnh: 640, 1024 và bề rộng gốc. */
export function photoWidths(photo: PhotoAsset): number[] {
  return [...new Set([640, 1024, photo.width])].filter((w) => w <= photo.width).sort((a, b) => a - b);
}

/** Đường dẫn công khai của một bản đã xuất. */
export function photoSrc(photo: PhotoAsset, width: number, ext: 'avif' | 'webp'): string {
  return `/images/photos/${photo.id}-${width}.${ext}`;
}
