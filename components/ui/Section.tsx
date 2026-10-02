import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container, type ContainerSize } from './Container';

export type SectionTone = 'light' | 'blue-50' | 'navy';

type SectionProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  as?: 'section' | 'div' | 'aside' | 'header' | 'footer';
  /** light = nền trắng · blue-50 = nền xanh rất nhạt · navy = dải tối (chữ trắng, focus ring cam nhạt) */
  tone?: SectionTone;
  /** default = padding dọc clamp(64px, 10vw, 128px) · compact = 48/64px · none = không padding */
  spacing?: 'default' | 'compact' | 'none';
  /** Bọc nội dung trong Container (mặc định "content" 1280px). false = tự lo bố cục bên trong. */
  container?: ContainerSize | false;
  containerClassName?: string;
  children: ReactNode;
};

const TONE_BG: Record<SectionTone, string> = {
  light: 'bg-white',
  'blue-50': 'bg-blue-50',
  navy: 'bg-navy-900',
};

const SPACING: Record<NonNullable<SectionProps['spacing']>, string> = {
  default: 'py-section',
  compact: 'py-12 md:py-16',
  none: '',
};

/**
 * Khối nội dung theo chiều dọc của trang. Đặt `data-tone` để chữ, link, eyebrow, focus ring tự đổi theo nền.
 * Phần tử trang trí position:absolute phải nằm trong wrapper overflow-clip (luật chống tràn ngang, docs/03 11.3).
 *
 *   <Section tone="blue-50" id="quy-trinh" aria-labelledby="quy-trinh-title"> ... </Section>
 */
export function Section({
  as: Tag = 'section',
  tone = 'light',
  spacing = 'default',
  container = 'content',
  containerClassName,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <Tag data-tone={tone} className={cn(TONE_BG[tone], SPACING[spacing], className)} {...rest}>
      {container === false ? children : <Container size={container} className={containerClassName}>{children}</Container>}
    </Tag>
  );
}
