/**
 * Cảnh 3D hero bản đồ (Mẫu 02 "Bản đồ sống 34 tỉnh", contracts/hero-map.md). Điểm vào DUY NHẤT của chunk 3D:
 * chỉ import ĐỘNG (`await import('@/components/film/map3d')`) sau ý định đầu tiên hoặc load + 2 s rảnh — không bao giờ
 * import tĩnh từ component của trang (three không được vào JS tải đầu, budgets.json firstLoadForbidden).
 */
export { createMapScene, DEFAULT_SEED, SHOT_TIME } from './scene';
export { HERO_MAP_URL, loadHeroMap } from './data';
export type {
  ArchipelagoId,
  MapScene,
  MapSceneOptions,
  MapSceneStats,
  MapTier,
  ProjectedArchipelago,
  ProjectedFrame,
  ProjectedPoint,
  RawHeroMap,
} from './types';
