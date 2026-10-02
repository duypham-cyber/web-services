import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Dùng các API này thay cho next/link và next/navigation để link tự đúng ngôn ngữ và slug.
 *   <Link href="/doi-tac-tho">            → VI: /doi-tac-tho · EN: /en/technician-partners
 *   <Link href={{ pathname: '/dich-vu/[slug]', params: { slug } }}>   (slug theo ngôn ngữ hiện tại)
 * usePathname() trả về đường dẫn NỘI BỘ (khóa trong routing.pathnames), không phải URL thật.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
