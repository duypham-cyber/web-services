import { ArrowDown, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties, ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, type AppHref } from '@/components/ui/Button';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { archipelagos, provinces, type RegionId } from '@/content/provinces';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { formatStatValue } from '@/lib/format';
import { formatRegionCount, regionCounts, statViews, type RegionCount, type StatView } from '@/lib/stats';
import { MAP_CAMERA, SAFE_MARGIN_PX, type CameraLayout, type SceneId } from '@/motion/map-camera';
import posterMeta from '@/public/images/hero/hero-poster.json' with { type: 'json' };
import styles from './FilmHero.module.css';
import { MapHeroStage } from './MapHeroStage';

/**
 * CHỮ KÝ PROPS CỐ ĐỊNH — app/[locale]/page.tsx (agent B2B) truyền vào; agent phim chỉ thay RUỘT.
 */
export type FilmHeroProps = {
  locale: Locale;
  /** Dòng nhỏ trên H1. null = ẩn (vd claim phạm vi "34 tỉnh" chưa duyệt). draft = hiện kèm nhãn Nháp. */
  eyebrow: { text: string; draft: boolean } | null;
  /** H1 DUY NHẤT của trang chủ (tagline T1), server render, KHÔNG BAO GIỜ bắt đầu ở opacity 0 (LCP). */
  title: string;
  lead: string;
  /** CTA chính (nút cam): "Nhận báo giá cho doanh nghiệp". */
  primaryCta: { label: string; href: AppHref };
  /** CTA phụ: "Đăng ký làm đối tác thợ". */
  secondaryCta: { label: string; href: AppHref };
  /** "Bỏ qua phần giới thiệu ↓" — <a href="#…"> thật, phần tử focus đầu tiên sau header (NFR-A11Y-03). */
  skipLabel: string;
  /** id section đích sau phim. Mặc định "ba-cua-vao" (section "Ba cửa vào", dùng H2). */
  skipTargetId?: string;
};

type Region = 'north' | 'central' | 'south';
type LabelPoint = [number, number];

/** Neo thẻ số thợ theo miền (cảnh toàn quốc, desktop) vào tâm một tỉnh + độ lệch px (như bản mẫu). Thứ tự = regionCounts(). */
const CHIP_ANCHORS: { region: RegionId; code: string; dx: number; dy: number }[] = [
  { region: 'north', code: '14', dx: -72, dy: -10 },
  { region: 'central', code: '51', dx: -104, dy: 34 },
  { region: 'south', code: '56', dx: 46, dy: -48 },
  { region: 'south', code: '96', dx: 36, dy: 54 },
];
/** Tỉnh có nhãn trên poster (cảnh toàn quốc): Hà Nội, Đà Nẵng (mobile chỉ Hà Nội) — như bản mẫu. */
const STATIC_CITIES = { desktop: ['01', '48'], mobile: ['01'] } as const;
/**
 * Lớp chấm chạy trên poster T-STILL (mobile luôn ở T-STILL — runtime/boot.ts): đường cung nào có chấm sáng chạy từ TP.HCM.
 * Chọn trải đều ba miền; mobile ít hơn cho đỡ rối. Đường cung đã chiếu sẵn theo khung poster (hero-poster.json → routes).
 */
const ROUTE_CODES = {
  desktop: ['01', '04', '11', '15', '22', '31', '40', '44', '46', '48', '51', '56', '66', '91', '92', '96'],
  mobile: ['01', '04', '11', '22', '40', '46', '48', '52', '56', '66', '92', '96'],
} as const;
const HQ_CODE = '79';

/** Biến CSS đặt poster theo đúng viewWindow() của motion/map-camera.ts (FilmHero.module.css → .posterBox). */
function layoutVars(prefix: 'd' | 'm', l: CameraLayout): Record<string, string> {
  return {
    [`--${prefix}-A`]: String(l.refAspect),
    [`--${prefix}-ax`]: String(l.anchor[0]),
    [`--${prefix}-ay`]: String(l.anchor[1]),
    [`--${prefix}-bx0`]: String(l.safe.x[0]),
    [`--${prefix}-bx1`]: String(l.safe.x[1]),
    [`--${prefix}-by0`]: String(l.safe.y[0]),
    [`--${prefix}-by1`]: String(l.safe.y[1]),
    [`--${prefix}-ti`]: String(l.textInset ?? 0),
    [`--${prefix}-top`]: `${l.topInset ?? 0}px`,
  };
}

/** Căn nhãn theo vị trí ngang (% khung poster): sát mép phải → nhãn mọc sang trái, sát mép trái → sang phải. */
function alignFor(x: number): 'start' | 'end' | undefined {
  if (x > 62) return 'end';
  if (x < 22) return 'start';
  return undefined;
}

function pos([x, y]: LabelPoint): CSSProperties {
  return { left: `${x}%`, top: `${y}%` };
}

/** Điểm nhãn trong hero-poster.json ([x%, y%]). */
const pt = (v: readonly number[] | undefined): LabelPoint | null => (v && v.length >= 2 ? [v[0]!, v[1]!] : null);

function statText(view: StatView, locale: Locale): string {
  return `${formatStatValue(view.value, view.format, locale)}${view.plus ? '+' : ''}`;
}

/**
 * HERO TRANG CHỦ — Mẫu 02 "Bản đồ sống 34 tỉnh" (D-26, contracts/hero-map.md). Server Component.
 *
 * HTML server = trạng thái T-STILL đọc được đầy đủ: poster <picture> + nhãn HTML tĩnh (vị trí từ hero-poster.json), khối chữ
 * (link bỏ qua đứng ĐẦU DOM, eyebrow, H1, lead, 2 CTA, KPI), rồi 4 panel tour theo dòng chảy (H2). Không inline opacity.
 * <MapHeroStage/> (client, ≤ 3 KB gz) chọn tầng sau hydrate; T-FULL/T-LITE → thêm class .film-armed lên track: track cao
 * 320vh (mobile 280svh), khung dính position: sticky, panel ẩn/hiện theo tiến độ bằng biến CSS + data-attribute; chunk
 * three.js (components/film/map3d) chỉ import động sau ý định đầu tiên hoặc load + 2 s rảnh.
 * Header: data-film-zone="light" (chữ navy trên nền sáng); runtime đặt data-night khi cảnh chuyển đêm → chữ trắng.
 */
export async function FilmHero({
  locale,
  eyebrow,
  title,
  lead,
  primaryCta,
  secondaryCta,
  skipLabel,
  skipTargetId = 'ba-cua-vao',
}: FilmHeroProps) {
  const t = await getTranslations({ locale, namespace: 'film' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const preview = isDraftPreview();

  const nameOf = new Map(provinces.map((p) => [p.code, p.name[locale]]));
  const archName = new Map(archipelagos.map((a) => [a.id, a.label[locale]]));
  const counts = regionCounts();
  const countsOf = (region: Region): RegionCount[] => counts.filter((c) => c.region === region);
  const kpis = statViews(['K1', 'K2', 'K6']);
  const confirm = statViews(['K6'])[0];
  const network = statViews(['K2', 'K1']);
  const draftTag = <DraftBadge />;

  const { desktop: dPoster, mobile: mPoster } = posterMeta;
  const stageStyle = {
    ...layoutVars('d', MAP_CAMERA.layouts.desktop),
    ...layoutVars('m', MAP_CAMERA.layouts.mobile),
    '--safe-m': `${SAFE_MARGIN_PX}px`,
    '--d-edge-top': dPoster.edge.top,
    '--d-edge-bottom': dPoster.edge.bottom,
    '--m-edge-top': mPoster.edge.top,
    '--m-edge-bottom': mPoster.edge.bottom,
  } as CSSProperties;

  // ------------------------------------------------------------ nhãn bản đồ (trang trí, aria-hidden)
  const archLabel = (id: 'hoang-sa' | 'truong-sa') => (
    <span className={styles.pillArch}>
      <i aria-hidden="true" />
      {archName.get(id)}
    </span>
  );
  const hqLabel = (
    <span className={styles.pillHq}>
      <b>{nameOf.get(HQ_CODE)}</b>
      <span>{t('map.hqRole')}</span>
    </span>
  );
  const chip = (row: RegionCount, i: number) => {
    const a = CHIP_ANCHORS[i];
    if (!a) return null;
    const len = Math.round(Math.hypot(a.dx, a.dy));
    const angle = Math.round((Math.atan2(a.dy, a.dx) * 180) / Math.PI);
    return {
      code: a.code,
      node: (
        <>
          <span className={styles.chipLead} style={{ width: len, transform: `rotate(${angle}deg)` }} />
          <span className={styles.chipDot} />
          <span className={styles.chip} data-side={a.dx < 0 ? 'left' : 'right'} style={{ left: a.dx, top: a.dy }}>
            <small>{row.label[locale]}</small>
            <b>
              <em>{formatRegionCount(row, locale)}</em> {t('tour.techniciansShort')}
            </b>
          </span>
        </>
      ),
    };
  };
  const chips = counts.map(chip).filter((c) => c !== null);

  type StaticLayout = typeof dPoster | typeof mPoster;
  /**
   * Chấm sáng chạy dọc đường cung điều phối + nhịp sóng ở TP.HCM, vẽ bằng SVG trên poster (toạ độ = px của ảnh poster nên
   * khớp từng điểm ảnh với đường cung in trong ảnh ở mọi khổ màn). Chỉ CSS: chạy 3 lượt rồi dừng, không chạy khi
   * reduced-motion / Save-Data / không JS (html[data-motion] khác "ready"), ẩn khi cảnh 3D sống (canvas có chấm thật).
   */
  const routesLayer = (layout: 'desktop' | 'mobile', meta: StaticLayout) => {
    const W = meta.width;
    const H = meta.height;
    const codes: readonly string[] = ROUTE_CODES[layout];
    const routes = meta.routes.filter((r) => codes.includes(r.code));
    const hq = pt(meta.labels.hq);
    const px = (v: number, total: number) => Math.round((v * total) / 10) / 10;
    return (
      <svg className={styles.routes} data-routes={layout} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        {routes.map((r, i) => {
          const d = r.d.map(([x, y], j) => `${j ? 'L' : 'M'}${px(x!, W)} ${px(y!, H)}`).join('');
          // đường dài chạy chậm hơn (giống tốc độ chấm của cảnh 3D), lệch pha để không chạy cùng lúc
          const dur = Math.min(4.6, Math.max(2.2, 1.6 + 0.12 / r.speed));
          const delay = 0.4 + ((i * 0.53) % 2.6);
          return (
            <path
              key={r.code}
              className={styles.route}
              d={d}
              pathLength={100}
              style={{ '--d': `${dur.toFixed(2)}s`, '--delay': `${delay.toFixed(2)}s` } as CSSProperties}
            />
          );
        })}
        {hq
          ? [0, 1].map((k) => (
              <circle
                key={k}
                className={styles.hqPulse}
                cx={px(hq[0], W)}
                cy={px(hq[1], H)}
                r={layout === 'desktop' ? 14 : 11}
                style={{ '--delay': `${0.3 + k * 1.1}s` } as CSSProperties}
              />
            ))
          : null}
      </svg>
    );
  };
  const staticLayer = (layout: 'desktop' | 'mobile', meta: StaticLayout) => {
    const L = meta.labels;
    const prov = (code: string) => pt((L.provinces as Record<string, number[] | undefined>)[code]);
    const sea = pt(L.sea);
    const hq = pt(L.hq);
    const arch = (id: 'hoang-sa' | 'truong-sa') => {
      const p = pt(L.archipelagos[id].label);
      return p ? (
        <span className={styles.lbl} data-kind="arch" data-align={alignFor(p[0])} style={pos(p)}>
          {archLabel(id)}
        </span>
      ) : null;
    };
    return (
      <div className={styles.labelsStatic} data-layout={layout} aria-hidden="true">
        {sea ? (
          <span className={styles.lbl} data-kind="sea" style={pos(sea)}>
            <span className={styles.pillSea}>{t('map.sea')}</span>
          </span>
        ) : null}
        {STATIC_CITIES[layout].map((code) => {
          const p = prov(code);
          return p ? (
            <span key={code} className={styles.lbl} data-kind="city" data-align={alignFor(p[0])} style={pos(p)}>
              <span className={styles.pillCity}>{nameOf.get(code)}</span>
            </span>
          ) : null;
        })}
        {hq ? (
          <span className={styles.lbl} data-kind="hq" style={pos(hq)}>
            {hqLabel}
          </span>
        ) : null}
        {layout === 'desktop'
          ? chips.map((c) => {
              const p = prov(c.code);
              return p ? (
                <span key={`chip-${c.code}`} className={styles.lbl} data-kind="chip" style={pos(p)}>
                  {c.node}
                </span>
              ) : null;
            })
          : null}
        {arch('hoang-sa')}
        {arch('truong-sa')}
      </div>
    );
  };

  // ------------------------------------------------------------ panel tour (H2)
  const regionPanels: { id: Region; body: ReactNode }[] = [
    { id: 'north', body: t('tour.north.body') },
    {
      id: 'central',
      body: confirm
        ? t('tour.central.bodyConfirm', { confirm: formatStatValue(confirm.value, confirm.format, locale, tc('units.minutes')) })
        : t('tour.central.body'),
    },
    { id: 'south', body: t('tour.south.body') },
  ];
  const orderSteps: Record<Region, { key: 'created' | 'confirmed' | 'dispatch' | 'install' | 'signoff'; state: 'ok' | 'now' }[]> = {
    north: [
      { key: 'created', state: 'ok' },
      { key: 'confirmed', state: 'ok' },
      { key: 'dispatch', state: 'now' },
    ],
    central: [
      { key: 'created', state: 'ok' },
      { key: 'confirmed', state: 'ok' },
      { key: 'install', state: 'now' },
    ],
    south: [
      { key: 'created', state: 'ok' },
      { key: 'confirmed', state: 'ok' },
      { key: 'signoff', state: 'ok' },
    ],
  };

  const scenes: SceneId[] = MAP_CAMERA.scenes;

  return (
    <section
      data-film-zone="light"
      data-hero-map=""
      data-tone="light"
      aria-labelledby="hero-title"
      className={`${styles.track} -mt-(--header-h)`}
      style={stageStyle}
    >
      <div className={styles.frame}>
        <div className={styles.screen}>
          <div className={styles.stage} data-hero-stage="">
            <div className={styles.posterBox} data-hero-poster="">
              <picture>
                <source media="(orientation: portrait)" type="image/avif" srcSet={`${mPoster.files.avif}?v=${mPoster.hash}`} width={mPoster.width} height={mPoster.height} />
                <source media="(orientation: portrait)" type="image/webp" srcSet={`${mPoster.files.webp}?v=${mPoster.hash}`} width={mPoster.width} height={mPoster.height} />
                <source type="image/avif" srcSet={`${dPoster.files.avif}?v=${dPoster.hash}`} width={dPoster.width} height={dPoster.height} />
                <img
                  className={styles.posterImg}
                  src={`${dPoster.files.webp}?v=${dPoster.hash}`}
                  width={dPoster.width}
                  height={dPoster.height}
                  alt=""
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
              {routesLayer('desktop', dPoster)}
              {routesLayer('mobile', mPoster)}
              {staticLayer('desktop', dPoster)}
              {staticLayer('mobile', mPoster)}
            </div>
            <MapHeroStage
              className={styles.canvasHost ?? ''}
              weights={scenes.map((s) => MAP_CAMERA.weights[s])}
              night={MAP_CAMERA.night}
              allowQuery={process.env.NODE_ENV !== 'production' || preview}
            />
            <div className={styles.veil} aria-hidden="true" />
            <div className={styles.nightTint} aria-hidden="true" />
            <div className={styles.nightVeil} aria-hidden="true" />
            {/* Nhãn bám cảnh 3D: runtime chiếu từ scene.project() mỗi khung vẽ (ẩn tới khi cảnh sống) */}
            <div className={styles.labelsLive} data-hero-labels="" aria-hidden="true">
              <span className={styles.lbl} data-kind="sea" data-label="sea">
                <span className={styles.pillSea}>{t('map.sea')}</span>
              </span>
              {provinces
                .filter((p) => p.code !== HQ_CODE)
                .map((p) => (
                  <span
                    key={p.code}
                    className={styles.lbl}
                    data-kind="city"
                    data-label={`p:${p.code}`}
                    data-region={p.region}
                    data-major={p.isCentralCity ? '' : undefined}
                  >
                    <span className={styles.pillCity}>{p.name[locale]}</span>
                  </span>
                ))}
              <span className={styles.lbl} data-kind="hq" data-label="hq">
                {hqLabel}
              </span>
              {chips.map((c) => (
                <span key={`chip-${c.code}`} className={styles.lbl} data-kind="chip" data-label={`chip:${c.code}`}>
                  {c.node}
                </span>
              ))}
              <span className={styles.lbl} data-kind="arch" data-label="arch:hoang-sa">
                {archLabel('hoang-sa')}
              </span>
              <span className={styles.lbl} data-kind="arch" data-label="arch:truong-sa">
                {archLabel('truong-sa')}
              </span>
            </div>
            <figure
              className={styles.minimap}
              data-hero-minimap=""
              data-arch-hs={archName.get('hoang-sa')}
              data-arch-ts={archName.get('truong-sa')}
              aria-hidden="true"
            >
              <svg viewBox="0 0 200 250" />
              <figcaption>
                <span>{t('map.minimapCaption')}</span>
                {(['north', 'central', 'south'] as const).map((r) => (
                  <b key={r} data-region={r}>
                    {t(`map.regions.${r}`)}
                  </b>
                ))}
              </figcaption>
            </figure>
          </div>

          <div className={styles.copyWrap}>
            <div className={styles.copy} data-hero-copy="">
              {/* DOM: link bỏ qua đứng ĐẦU (focus đầu tiên sau header); hiển thị cuối khối chữ */}
              <a href={`#${skipTargetId}`} className={styles.skip}>
                {skipLabel.replace(/\s*↓\s*$/, '')}
                <ArrowDown aria-hidden="true" size={16} strokeWidth={1.75} />
              </a>
              {eyebrow ? (
                <p className={`${styles.eyebrow} eyebrow`}>
                  <span className={styles.pulse} aria-hidden="true" />
                  <span>{eyebrow.text}</span>
                  {eyebrow.draft ? <Badge variant="draft">{tc('status.draft')}</Badge> : null}
                </p>
              ) : null}
              <h1 id="hero-title" className={`${styles.title} font-display`}>
                {title}
              </h1>
              <p className={styles.lead}>{lead}</p>
              <div className={styles.ctas}>
                <Button href={primaryCta.href} variant="primary" size="md">
                  {primaryCta.label}
                </Button>
                <Button href={secondaryCta.href} variant="ghost" size="md">
                  {secondaryCta.label}
                </Button>
              </div>
              {kpis.length > 0 ? (
                <dl className={styles.kpis} aria-label={t('hero.kpiLabel')}>
                  {kpis.map((v) => (
                    <div key={v.stat.id}>
                      <dt>{v.stat.label[locale]}</dt>
                      <dd>
                        {statText(v, locale)}
                        {v.format === 'minutes' ? <small> {tc('units.minutes')}</small> : null}
                        {v.kind === 'legacy' ? draftTag : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <p className={styles.legend}>{t('map.legend')}</p>
            </div>
          </div>
          <p className={styles.cue} aria-hidden="true">
            <span className={styles.cueMouse} />
            {t('hero.scrollCue')}
          </p>
        </div>

        <div className={styles.tour} data-hero-tour="" role="group" aria-label={t('hero.tourLabel')}>
          <div className={`${styles.tourInner} mx-auto box-content max-w-content px-gutter`}>
            {regionPanels.map((panel, i) => {
              const rows = countsOf(panel.id);
              return (
                <article key={panel.id} className={styles.panel} data-scene={panel.id} aria-labelledby={`tour-${panel.id}`}>
                  <p className={styles.kicker}>
                    <span>{t('tour.step', { n: String(i + 1).padStart(2, '0'), total: '03' })}</span>
                    {t(`tour.${panel.id}.kicker`)}
                  </p>
                  <h2 id={`tour-${panel.id}`} className={styles.panelTitle}>
                    {t(`tour.${panel.id}.title`)}
                  </h2>
                  {rows.length > 0 ? (
                    <p className={styles.stat}>
                      {rows.map((row, k) =>
                        k === 0 ? (
                          <span key={k}>
                            <strong>{formatRegionCount(row, locale)}</strong> {t('tour.technicians')}
                          </span>
                        ) : (
                          <span key={k}>
                            {' · '}
                            {row.label[locale]} <strong className={styles.statSm}>{formatRegionCount(row, locale)}</strong>
                          </span>
                        ),
                      )}
                    </p>
                  ) : null}
                  <p className={styles.text}>{panel.body}</p>
                  <div className={styles.order} data-order="">
                    <Badge variant="illustration">{t('tour.order.badge')}</Badge>
                    <p className={styles.orderTitle}>{t(`tour.order.${panel.id}.title`)}</p>
                    <p className={styles.orderMeta}>
                      <span>{t(`tour.order.${panel.id}.distance`)}</span>
                      <span>{t(`tour.order.${panel.id}.confirm`)}</span>
                    </p>
                    <ol className={styles.orderSteps}>
                      {orderSteps[panel.id].map((s) => (
                        <li key={s.key} data-state={s.state}>
                          {t(`tour.order.steps.${s.key}`)}
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              );
            })}
            <article className={`${styles.panel} ${styles.panelFinal}`} data-scene="network" data-tone="navy" aria-labelledby="tour-network">
              <p className={styles.kicker}>
                <span>{t('tour.network.kicker')}</span>
              </p>
              <h2 id="tour-network" className={styles.panelTitle}>
                {t('tour.network.title')}
              </h2>
              {network.length > 0 ? (
                <p className={styles.stat}>
                  {network.map((v, k) => (
                    <span key={v.stat.id}>
                      {k > 0 ? ' · ' : ''}
                      <strong className={k > 0 ? styles.statSm : undefined}>{statText(v, locale)}</strong>{' '}
                      {v.stat.id === 'K2' ? t('tour.provincesShort') : t('tour.techniciansShort')}
                      {v.kind === 'legacy' ? draftTag : null}
                    </span>
                  ))}
                </p>
              ) : null}
              <p className={styles.text}>{t('tour.network.body')}</p>
              <Button href="/mang-luoi" variant="on-dark" size="md" className={styles.panelCta} iconEnd={<ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} />}>
                {t('tour.network.cta')}
              </Button>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
