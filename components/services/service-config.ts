import {
  AirVent,
  Bot,
  CalendarCheck,
  CookingPot,
  Droplets,
  House,
  Refrigerator,
  Tv,
  WashingMachine,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { IllustrationKey } from '@/components/solutions/kit/illustrations';
import type { FaqSpec } from '@/components/solutions/kit/faq-entries';
import type { ClaimId } from '@/content/claims';
import type { ServiceKey } from '@/content/services';

/**
 * Cấu trúc trình bày của 4 trang dịch vụ (chữ ở messages/<locale>/services.json → items.<key>).
 * content/services.ts giữ slug/tiêu đề (schema chặt của nền móng) — các trường trình bày để ở đây.
 */
export type ServicePresentation = {
  icon: LucideIcon;
  illustration: IllustrationKey;
  /** Câu khẳng định ngắn ở hero (production ẩn khi chưa duyệt). */
  heroClaims: readonly ClaimId[];
  /** Cấu hình FAQ theo id trong messages items.<key>.faq (link "more", claim bổ sung). */
  faq: readonly FaqSpec[];
};

const WARRANTY_FAQ: FaqSpec = {
  id: 'warranty',
  href: '/chinh-sach-bao-hanh',
  claims: ['warranty.new-installation-term', 'warranty.register-within-7-days'],
};

export const SERVICE_PRESENTATION: Record<ServiceKey, ServicePresentation> = {
  'lap-dat-dieu-hoa': {
    icon: AirVent,
    illustration: 'ac-split',
    heroClaims: ['quality.brand-standard', 'b2b.warranty.installation-faults'],
    faq: [
      { id: 'vacuum' },
      { id: 'pipe' },
      { id: 'materials', href: '/bang-gia', claims: ['b2b.billing.materials-no-invoice'] },
      { id: 'prepare' },
      WARRANTY_FAQ,
    ],
  },
  'lap-dat-dien-may': {
    icon: WashingMachine,
    illustration: 'appliances',
    heroClaims: ['quality.brand-standard', 'b2b.warranty.installation-faults'],
    faq: [{ id: 'grounding' }, { id: 'bolts' }, { id: 'tv' }, WARRANTY_FAQ],
  },
  'bao-tri-dinh-ky': {
    icon: CalendarCheck,
    illustration: 'maintenance',
    heroClaims: ['coverage.provinces-34'],
    faq: [
      { id: 'frequency' },
      { id: 'gas', claims: ['b2b.pricing.no-surprise-costs'] },
      { id: 'chains', href: '/mang-luoi', claims: ['coverage.provinces-34'] },
      { id: 'warranty', href: '/chinh-sach-bao-hanh', claims: ['warranty.register-within-7-days'] },
    ],
  },
  'lap-dat-robot-hut-bui': {
    icon: Bot,
    illustration: 'robot',
    heroClaims: ['b2b.warranty.installation-faults'],
    faq: [{ id: 'wifi' }, { id: 'account' }, WARRANTY_FAQ],
  },
};

/** Icon theo khóa thiết bị trong messages items.<key>.devices (thiếu → icon của dịch vụ). */
export const DEVICE_ICONS: Record<string, LucideIcon> = {
  wall: AirVent,
  ceiling: AirVent,
  ac: AirVent,
  laundry: WashingMachine,
  fridge: Refrigerator,
  tv: Tv,
  kitchen: CookingPot,
  water: Droplets,
  robot: Bot,
  smart: House,
  other: Wrench,
};

/** Câu khẳng định ở khối "Đã gồm / chưa gồm" và "Bảo hành" (giống nhau cho 4 dịch vụ). */
export const SCOPE_CLAIMS = ['b2b.scope.standard-site-conditions', 'b2b.pricing.no-surprise-costs', 'b2b.billing.materials-no-invoice'] as const;
export const WARRANTY_CLAIMS = [
  'b2b.warranty.installation-faults',
  'b2b.warranty.responsibility-split',
  'b2b.warranty.exclusions',
  'warranty.register-within-7-days',
] as const;
