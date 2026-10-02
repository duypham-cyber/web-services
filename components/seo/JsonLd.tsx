import { serializeJsonLd, type JsonLdObject } from '@/lib/jsonld';

/**
 * <script type="application/ld+json"> render ở server (docs Next: guides/json-ld — thẻ <script> thường, không next/script).
 * Dữ liệu dựng bằng helper ở lib/jsonld.ts: organizationJsonLd, serviceJsonLd, breadcrumbJsonLd, articleJsonLd.
 *
 *   <JsonLd data={serviceJsonLd({ routeKey: 'services.lap-dat-dieu-hoa', locale })} />
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
