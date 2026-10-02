/**
 * Ghép class có điều kiện: cn('a', cond && 'b', undefined) → "a b".
 * KHÔNG tự gộp class Tailwind xung đột (không dùng tailwind-merge): primitive chỉ nhận className cho bố cục
 * (margin, width, grid...), không dùng className để đè màu/cỡ chữ — dùng prop variant/size/tone.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
