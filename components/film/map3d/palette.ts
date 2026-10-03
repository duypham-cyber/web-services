import { Color } from 'three';

/**
 * Màu của cảnh. Màu THƯƠNG HIỆU đọc từ token (styles/tokens.css, `@theme static` xuất ra :root) lúc dựng cảnh, nên đổi
 * token là cảnh đổi theo; giá trị dự phòng = đúng token hiện tại (tests/hero kiểm khớp tokens.css).
 * Màu NƯỚC/MÂY/ĐẤT là bảng minh hoạ riêng của cảnh 3D (ánh sáng + tô bóng), lấy theo Mẫu 02 anh Duy đã chọn — không
 * dùng cho UI HTML (contracts/hero-map.md mục 6).
 */
export const TOKEN_FALLBACK = {
  'blue-600': '#004aad',
  'blue-300': '#7faaf0',
  'blue-100': '#e8f1fc',
  'blue-50': '#f2f8fc',
  'navy-900': '#0a1f44',
  'orange-500': '#ef8426',
  'orange-200': '#ffb778',
  white: '#ffffff',
} as const;

export type TokenName = keyof typeof TOKEN_FALLBACK;

export function readToken(name: TokenName): string {
  if (typeof document !== 'undefined') {
    const v = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  }
  return TOKEN_FALLBACK[name];
}

export function scenePalette() {
  const blue = new Color(readToken('blue-600'));
  const orange = new Color(readToken('orange-500'));
  const navy = new Color(readToken('navy-900'));
  return {
    /** Viền bờ, chấm đảo, elip quần đảo: blue-600. */
    outline: blue,
    /** Ranh giới tỉnh trên mặt đất: blue-300. */
    border: new Color(readToken('blue-300')),
    /** Ghim, đường cung: orange-500 (cam chỉ làm "nền"/khối, không làm chữ). */
    pin: orange,
    arcA: new Color('#ff8a2a'),
    arcB: orange,
    arcHead: new Color('#fff4e2'),
    /** Nền trời/sương: gần blue-50. */
    sky: new Color('#eef5ff'),
    landTop: new Color('#fbf8f2'),
    landSide: new Color('#edf1f7'),
    landTint: new Color('#fffaf2'),
    seaDeep: new Color('#2467cf'),
    seaMid: new Color('#3b8ae6'),
    seaShallow: new Color('#93d6f3'),
    seaMist: new Color('#eef5ff'),
    seaDeepNight: new Color('#071d4f'),
    seaMidNight: new Color('#0f3a86'),
    /** Sương đêm: navy-900 pha sâu hơn một chút. */
    seaMistNight: navy.clone().lerp(new Color('#06163a'), 0.35),
    shadow: new Color('#08245e'),
  };
}

export type ScenePalette = ReturnType<typeof scenePalette>;
