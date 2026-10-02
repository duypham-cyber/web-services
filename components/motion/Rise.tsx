import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';

type RiseProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /** Thứ tự trong nhóm → trễ index × 60 ms (stagger-card). */
  index?: number;
  children: ReactNode;
};

/**
 * `rise` (docs/03 mục 12.2): trượt lên 24px desktop / 12px mobile + hiện dần, 520 ms ease-entry, khi vào khung nhìn.
 * Chỉ là thuộc tính data — MotionRuntime (một IntersectionObserver cho cả trang) xử lý, không thêm JS mỗi khối.
 * KHÔNG bọc: H1, phần tử LCP, nội dung màn hình đầu của trang con, giá, hotline, pháp lý, form, thông báo lỗi.
 */
export function Rise({ as: Tag = 'div', index, style, children, ...rest }: RiseProps) {
  const merged = index === undefined ? style : ({ ...style, '--i': index } as CSSProperties);
  return (
    <Tag data-motion-item="rise" style={merged} {...rest}>
      {children}
    </Tag>
  );
}
