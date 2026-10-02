import type { Service } from './schemas';

/**
 * 4 nhóm dịch vụ = tham số của route /dich-vu/[slug] (docs/03 mục 10.1). Slug EN riêng (docs/03 mục 10.2).
 * Chủ sở hữu: agent trang B2B. Đổi slug = đổi URL công khai → phải thêm dòng 301 trong content/redirects.ts.
 * Nội dung chi tiết (phạm vi, thiết bị, đã gồm/chưa gồm, FAQ) do agent B2B thêm vào messages/<locale>/services.json.
 */
export const services = [
  {
    key: 'lap-dat-dieu-hoa',
    slug: { vi: 'lap-dat-dieu-hoa', en: 'air-conditioner-installation' },
    title: { vi: 'Lắp đặt điều hòa', en: 'Air conditioner installation' },
    priority: 'P0',
  },
  {
    key: 'lap-dat-dien-may',
    slug: { vi: 'lap-dat-dien-may', en: 'appliance-installation' },
    title: { vi: 'Lắp đặt điện máy', en: 'Appliance installation' },
    priority: 'P1',
  },
  {
    key: 'bao-tri-dinh-ky',
    slug: { vi: 'bao-tri-dinh-ky', en: 'scheduled-maintenance' },
    title: { vi: 'Bảo trì định kỳ', en: 'Scheduled maintenance' },
    priority: 'P1',
  },
  {
    key: 'lap-dat-robot-hut-bui',
    slug: { vi: 'lap-dat-robot-hut-bui', en: 'robot-vacuum-installation' },
    title: { vi: 'Lắp đặt robot hút bụi', en: 'Robot vacuum installation' },
    priority: 'P2',
  },
] as const satisfies readonly Service[];

export type ServiceKey = (typeof services)[number]['key'];
