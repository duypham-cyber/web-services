import type { CSSProperties } from 'react';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/Badge';
import { archipelagos, getRegion, provinces, type RegionId } from '@/content/provinces';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';
import { formatDate, formatStatValue } from '@/lib/format';
import { MapInteractions, type MapCard } from './MapInteractions';
import styles from './VietnamMap.module.css';
import { MAP_ARCHIPELAGOS, MAP_GRATICULE, MAP_PROVINCES, MAP_VIEWBOX } from './vn34-map.generated';

/**
 * CHỮ KÝ PROPS CỐ ĐỊNH (nền móng) — trang chủ và /mang-luoi cùng dùng.
 * Luật bắt buộc (docs/04 NFR-MAP-01): Hoàng Sa và Trường Sa LUÔN nằm trọn trong khung, có nhãn ≥ 11px,
 * tương phản ≥ 4,5:1, không phần tử nào che — ở mọi breakpoint 360–1920. Kiểm: tests/map/sovereignty.spec.ts.
 * Nhãn lấy từ content/provinces.ts (archipelagos). Số thợ lấy từ provinces[].technicianCount (null = "chưa có số").
 */
export type VietnamMapProps = {
  locale: Locale;
  /** home = section 2.5D trên trang chủ (A+: KHÔNG WebGL) · network = trang /mang-luoi */
  variant?: 'home' | 'network';
  /** Tên truy cập (role="img" aria-label), từ messages network.mapTitle. */
  title: string;
  className?: string;
};

const SWATCH: Record<RegionId, string> = {
  north: styles.swatchNorth ?? '',
  central: styles.swatchCentral ?? '',
  south: styles.swatchSouth ?? '',
};

/** Bán kính ghim theo số thợ (đơn vị viewBox): căn bậc hai, kẹp 4–10. */
const pinRadius = (count: number, max: number) => 4 + 6 * Math.sqrt(count / Math.max(1, max));

/**
 * Bản đồ 34 tỉnh: SVG đã chiếu sẵn lúc build (scripts/make-map.mjs → vn34-map.generated.ts), server render đầy đủ
 * (không JS vẫn thấy bản đồ, hai quần đảo và nhãn). Tỉnh tô theo vùng; lớp nền <use> tạo khối nổi 2.5D; map-rise
 * Bắc → Nam bằng CSS khi vào khung nhìn (reduced-motion: trạng thái cuối). Ghim thợ cam CHỈ khi technicianCount có số;
 * bản xem trước (DRAFT_PREVIEW) hiện chấm nháp. Tương tác (thẻ khi rê/chạm) là đảo client nhỏ MapInteractions.
 */
export async function VietnamMap({ locale, variant = 'home', title, className }: VietnamMapProps) {
  const t = await getTranslations({ locale, namespace: 'network' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const preview = isDraftPreview();
  const { width: W, height: H } = MAP_VIEWBOX;
  const landId = `bbmap-${variant}-land`;
  const byCode = new Map(provinces.map((p) => [p.code, p]));

  // Ghim: chỉ tỉnh có số thợ > 0. Chưa tỉnh nào có số + bản xem trước → chấm nháp ở tâm mọi tỉnh.
  const counts = MAP_PROVINCES.map((s) => byCode.get(s.code)?.technicianCount ?? null);
  const maxCount = Math.max(0, ...counts.map((c) => c ?? 0));
  const hasCounts = counts.some((c) => c !== null);
  const showDraftPins = preview && !hasCounts;

  // Chuỗi thẻ (đã dịch, đã định dạng) cho đảo client — client không nhận messages namespace "network"
  const cards: Record<string, MapCard> = {};
  for (const shape of MAP_PROVINCES) {
    const p = byCode.get(shape.code);
    if (!p) continue;
    const region = getRegion(p.region);
    const value =
      p.technicianCount === null
        ? t('map.noCount')
        : t('map.techniciansValue', { count: formatStatValue(p.technicianCount, 'integer', locale) }) +
          (p.updatedAt ? ` · ${t('map.updated', { date: formatDate(p.updatedAt, locale) })}` : '');
    cards[p.code] = {
      title: p.name[locale],
      meta: p.isCentralCity ? t('map.centralCity') : t('map.province'),
      region: { id: region.id, name: region.name[locale] },
      stat: { label: t('map.technicians'), value },
      x: shape.cx / W,
      y: shape.cy / H,
    };
  }
  for (const shape of MAP_ARCHIPELAGOS) {
    const arch = archipelagos.find((a) => a.id === shape.id);
    const parent = byCode.get(shape.parentCode);
    if (!arch || !parent) continue;
    const partOf = parent.isCentralCity
      ? t('map.partOfCity', { name: parent.name[locale] })
      : t('map.partOfProvince', { name: parent.name[locale] });
    const parentRegion = getRegion(parent.region);
    cards[shape.id] = {
      title: arch.label[locale],
      meta: partOf,
      region: { id: parentRegion.id, name: parentRegion.name[locale] },
      // Neo ở mép trái cụm đảo → thẻ ưu tiên đặt bên trái, không đè đảo
      x: shape.bbox[0] / W,
      y: (shape.bbox[1] + shape.bbox[3]) / 2 / H,
    };
  }

  const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;

  return (
    <div className={cn(styles.root, className)} data-map-root="" data-map-variant={variant}>
      <figure role="img" aria-label={title} className={styles.frame} data-map-frame="" data-motion-item="map-rise">
        <svg
          className={styles.svg}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
          data-map-svg=""
        >
          <g className={styles.grid}>
            {MAP_GRATICULE.lon.map((x) => (
              <line key={`lon-${x}`} x1={x} y1={0} x2={x} y2={H} />
            ))}
            {MAP_GRATICULE.lat.map((y) => (
              <line key={`lat-${y}`} x1={0} y1={y} x2={W} y2={y} />
            ))}
          </g>

          {/* Lớp nền: bản sao đất liền tô đặc (bóng mờ + khối nổi + vành 3:1 với biển), không thêm byte path */}
          <use href={`#${landId}`} className={styles.shadow} transform="translate(0 9)" />
          <use href={`#${landId}`} className={styles.slab} transform="translate(0 3.5)" />

          <g id={landId}>
            {MAP_PROVINCES.map((shape) => (
              <path
                key={shape.code}
                className={styles.prov}
                d={shape.d}
                data-code={shape.code}
                // vùng đọc trực tiếp từ content/provinces.ts (nguồn duy nhất), không từ file sinh
                data-region={byCode.get(shape.code)?.region ?? shape.region}
                data-card-key={shape.code}
                style={{ '--rise': shape.rise } as CSSProperties}
              />
            ))}
          </g>

          {hasCounts || showDraftPins ? (
            <g className={styles.pins} data-map-pins={showDraftPins ? 'draft' : 'live'}>
              {MAP_PROVINCES.map((shape, i) => {
                const count = counts[i] ?? null;
                if (showDraftPins) {
                  return <circle key={shape.code} className={styles.pinDraft} cx={shape.cx} cy={shape.cy} r={4} />;
                }
                if (count === null || count <= 0) return null;
                return (
                  <circle key={shape.code} className={styles.pin} cx={shape.cx} cy={shape.cy} r={pinRadius(count, maxCount)} />
                );
              })}
            </g>
          ) : null}

          {/* Quần đảo: luôn hiện, không tham gia map-rise. Chấm nhấn để thấy được ở mọi cỡ khung. */}
          {MAP_ARCHIPELAGOS.map((shape) => (
            <g key={shape.id} className={styles.arch} data-arch={shape.id} data-code={shape.parentCode}>
              <path className={styles.archShape} d={shape.d} data-arch-visual="" />
              {shape.dots.map(([x, y]) => (
                <circle key={`${x}-${y}`} className={styles.archDot} cx={x} cy={y} r={3.2} data-arch-visual="" />
              ))}
              {shape.dots.map(([x, y]) => (
                <circle key={`hit-${x}-${y}`} className={styles.archHit} cx={x} cy={y} r={10} data-card-key={shape.id} />
              ))}
            </g>
          ))}
        </svg>

        {MAP_ARCHIPELAGOS.map((shape) => {
          const arch = archipelagos.find((a) => a.id === shape.id);
          if (!arch) return null;
          return (
            <span
              key={shape.id}
              className={cn(styles.label, shape.label.place === 'above' ? styles.labelAbove : styles.labelBelow)}
              style={{ left: pct(shape.label.x, W), top: pct(shape.label.y, H) }}
              data-arch-label={shape.id}
            >
              {arch.label[locale]}
            </span>
          );
        })}

        <div className={styles.legend} data-map-legend="">
          {(['north', 'central', 'south'] as const).map((id) => (
            <span key={id} className={styles.legendItem}>
              <span className={cn(styles.swatch, SWATCH[id])} />
              {getRegion(id).name[locale]}
            </span>
          ))}
          {hasCounts ? (
            <span className={styles.legendItem}>
              <span className={cn(styles.swatch, styles.swatchPin)} />
              {t('map.pinsLegend')}
            </span>
          ) : null}
          {showDraftPins ? (
            <span className={styles.legendItem}>
              <span className={cn(styles.swatch, styles.swatchPin)} />
              {t('map.pinsLegend')}
              <Badge variant="draft">{tc('status.draft')}</Badge>
            </span>
          ) : null}
        </div>
      </figure>
      <MapInteractions cards={cards} hint={t('map.hint')} />
    </div>
  );
}
