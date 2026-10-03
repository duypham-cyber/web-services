'use client';

import { useEffect, useRef } from 'react';
import { bootHero, type HeroBootConfig } from './runtime/boot';

type MapHeroStageProps = Omit<HeroBootConfig, 'host'> & { className: string };

/**
 * Bộ nạp hero bản đồ (client, phần của JS tải đầu — giữ ≤ 3 KB gz, contracts/hero-map.md AC-L-1). Chỉ render một khung
 * chứa (aria-hidden); runtime tạo <canvas aria-hidden> MỚI trong khung mỗi lần dựng cảnh (canvas đã forceContextLoss không
 * dùng lại được). Mọi việc khác (chọn tầng, .film-armed, tiến độ cuộn, import động chunk 3D) ở runtime/boot.ts, sau hydrate.
 * KHÔNG setState khi cuộn: tiến độ ghi vào biến và data-attribute/biến CSS.
 */
export function MapHeroStage({ className, weights, night, allowQuery }: MapHeroStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    return bootHero({ host, weights, night, allowQuery });
  }, [weights, night, allowQuery]);
  return <div ref={ref} className={className} aria-hidden="true" data-hero-canvas-host="" />;
}
