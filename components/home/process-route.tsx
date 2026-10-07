import type { CSSProperties, ReactNode } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Heading } from '@/components/ui/Heading';
import type { SectionTone } from '@/components/ui/Section';
import type { ProcessStep } from '@/content/schemas';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import styles from './process-route.module.css';
import { ProcessStepper } from './ProcessStepper';

/**
 * Hình học đường cong ngang (đơn vị viewBox, Mẫu 02): mỗi trạm rộng STATION_W, tâm trạm k ở x = (k + 0,5) × STATION_W;
 * dải cao BAND_H, trạm chẵn nằm đáy sóng (y = 84), trạm lẻ nằm đỉnh sóng (y = 36). SVG kéo giãn theo bề rộng lưới
 * (preserveAspectRatio="none") nên tâm cột lưới trùng tâm trạm. --band / --y trong process-route.module.css khớp các số này.
 */
const STATION_W = 200;
const BAND_H = 120;
const CREST_Y = { high: 36, low: 84 } as const;
type Crest = keyof typeof CREST_Y;

const crestOf = (k: number): Crest => (k % 2 === 0 ? 'low' : 'high');

/** Đường cong qua tâm các trạm `from` … `to`: đoạn đầu C, các đoạn sau S (đối xứng tiếp tuyến) — y như Mẫu 02. */
function wavePath(from: number, to: number): string {
  const point = (k: number) => [k * STATION_W + STATION_W / 2, CREST_Y[crestOf(k)]] as const;
  const [x0, y0] = point(from);
  const half = STATION_W / 2;
  let d = `M${x0} ${y0}`;
  for (let k = from + 1; k <= to; k += 1) {
    const [x, y] = point(k);
    d += k === from + 1 ? ` C${x0 + half} ${y0} ${x - half} ${y} ${x} ${y}` : ` S${x - half} ${y} ${x} ${y}`;
  }
  return d;
}

type ProcessRouteProps = {
  locale: Locale;
  tone: SectionTone;
  /** Bước 00 (sự kiện kích hoạt) — điểm xuất phát nằm NGOÀI <ol>, hiển thị nhạt. */
  trigger?: ProcessStep;
  /** Các bước thật (01…), số trạm = số phần tử. */
  steps: readonly ProcessStep[];
  /** "Bước {n}" đã format, cho chữ ẩn đọc màn hình. */
  stepLabel: (id: string) => string;
  /** "sự kiện kích hoạt, chưa tính là một bước". */
  triggerLabel: string;
};

/**
 * Tuyến đường các trạm (Mẫu 02 "Bản đồ sống", D-26): Server Component. Nội dung đọc từ content/process.ts:
 * điểm xuất phát 00 → các trạm 01…N trong <ol> server render (tắt JS / Googlebot không cuộn vẫn đọc đủ).
 * SVG, đĩa số, vạch nối đều aria-hidden. Chuyển động và bố cục: process-route.module.css.
 */
export function ProcessRoute({ locale, tone, trigger, steps, stepLabel, triggerLabel }: ProcessRouteProps) {
  const offset = trigger ? 1 : 0;
  const stations = steps.length + offset;
  const last = stations - 1;
  const trailPath = wavePath(offset, last);
  const routeVars = {
    '--stations': stations,
    '--steps': steps.length,
    '--seg': steps.length > 1 ? 1 / (steps.length - 1) : 1,
  } as CSSProperties;

  return (
    <div className={styles.route} data-motion-item="route" style={routeVars}>
      <svg
        className={styles.wave}
        viewBox={`0 0 ${stations * STATION_W} ${BAND_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className={styles.road} d={trailPath} />
        <path className={styles.lane} d={wavePath(0, last)} />
        <path className={styles.trail} d={trailPath} pathLength={1} />
      </svg>

      {trigger ? (
        <div className={cn(styles.station, styles.origin)} data-crest={crestOf(0)} data-step-k={0}>
          <span className={cn(styles.disk, styles.diskOrigin, 'font-display text-body tabular')} aria-hidden="true">
            {trigger.id}
          </span>
          <div className={styles.body}>
            <p className="text-h3 text-(--surface-muted)">
              <span className="sr-only">{stepLabel(trigger.id)}: </span>
              {trigger.title[locale]}
            </p>
            <p className="mt-3">
              <span className={cn(styles.triggerTag, 'text-small font-medium text-(--surface-muted)')}>{triggerLabel}</span>
            </p>
            <p className="mt-3 text-body text-(--surface-muted) xl:text-small">{trigger.description[locale]}</p>
          </div>
        </div>
      ) : null}

      <ol className={cn(styles.stops, !trigger && styles.stopsFull)}>
        {steps.map((step, i) => {
          const f = steps.length > 1 ? i / (steps.length - 1) : 1;
          return (
            <li
              key={step.id}
              className={styles.station}
              data-crest={crestOf(i + offset)}
              data-step-k={i + offset}
              style={{ '--f': f } as CSSProperties}
            >
              {i < steps.length - 1 ? <span className={styles.rail} aria-hidden="true" /> : null}
              <span className={cn(styles.disk, 'font-display text-body tabular')} aria-hidden="true">
                <span className={styles.lit} />
                {step.id}
              </span>
              <div className={styles.body}>
                <Heading level={3}>
                  <span className="sr-only">{stepLabel(step.id)}: </span>
                  {step.title[locale]}
                </Heading>
                <p className="mt-3">
                  <Chip variant={tone === 'navy' ? 'on-dark' : 'neutral'}>{step.actor[locale]}</Chip>
                </p>
                <p className="mt-3 text-body text-(--surface-muted) xl:text-small">{step.description[locale]}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Trạm cuối giữ thêm bao nhiêu đoạn bước trước khi khối nhả ra (1 = bằng các bước khác); ProcessStepper đọc cùng số. */
const PIN_HOLD = 1;

/**
 * "Dừng và đi từng bước" (D-34): bọc đầu section + tuyến đường. Ở chế độ ghim (desktop có chuột, ≥ 1280 × 640 px, cho phép
 * chuyển động — process-route.module.css), khối đứng yên giữa phần khung nhìn dưới header từ bước 00; người xem cuộn qua
 * đường băng phía dưới, mỗi đoạn `--pin-step` là một bước (ProcessStepper ghi trạng thái), giữ trạm cuối thêm một đoạn rồi
 * khối trôi tiếp. Không đủ điều kiện: đường băng ẩn, khối cuộn như thường với hoạt ảnh cũ của tuyến.
 */
export function ProcessPin({ stations, trailStart, children }: { stations: number; trailStart: number; children: ReactNode }) {
  return (
    <div
      className={styles.pinTrack}
      data-step-track=""
      data-trail-start={trailStart}
      style={{ '--pin-steps': stations - 1, '--pin-hold': PIN_HOLD } as CSSProperties}
    >
      <div className={styles.pinStage} data-step-stage="">
        {children}
      </div>
      <div className={styles.pinRunway} data-step-runway="" aria-hidden="true" />
      <ProcessStepper hold={PIN_HOLD} />
    </div>
  );
}
