import { findLegacyAsset, legacyAssets } from '@/content/redirects';

/**
 * Ảnh og:image cũ của site trước (content/redirects.ts → legacyAssets) ở tầng Next — AC-301-3:
 *   kind "redirect" → 301 (Location tương đối, giữ query) sang ảnh mới · kind "gone" → 410 noindex.
 * File tĩnh trong public/images/ được phục vụ TRƯỚC route này, nên ảnh "keep" và mọi ảnh đang dùng không bị ảnh hưởng;
 * đường dẫn /images/* khác không có file → 404. Production: openresty trả 301/410 trước khi tới app (1 hop).
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return legacyAssets
    .filter((a) => a.kind !== 'keep' && a.from.startsWith('/images/'))
    .map((a) => ({ asset: a.from.slice('/images/'.length).split('/') }));
}

async function handle(request: Request, { params }: { params: Promise<{ asset: string[] }> }) {
  const { asset } = await params;
  const row = findLegacyAsset(`/images/${asset.join('/')}`);
  if (row?.kind === 'redirect' && row.to) {
    const { search } = new URL(request.url);
    return new Response(null, { status: 301, headers: { Location: `${row.to}${search}` } });
  }
  if (row?.kind === 'gone') {
    return new Response('410 Gone', {
      status: 410,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' },
    });
  }
  return new Response('404 Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export { handle as GET, handle as HEAD };
