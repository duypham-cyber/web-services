import { AirVent, Bot, TrendingUp, WashingMachine, Wind, Workflow, type LucideIcon } from 'lucide-react';
import type { ArticleKey } from '@/content/articles';

/** Icon cho khung giữ chỗ khi bài chưa có ảnh thật (MediaFrame). Một icon/bài, nét Lucide 1,5px (docs/03 mục 11.3). */
export const ARTICLE_ICONS: Record<ArticleKey, LucideIcon> = {
  'lap-dat-may-lanh-dung-cach-7-buoc': AirVent,
  '10-nguyen-nhan-may-lanh-khong-lanh': Wind,
  'rui-ro-lap-dat-may-giat-khong-dung-cach': WashingMachine,
  'chuyen-doi-so-trong-lap-dat-toan-quoc': Workflow,
  'tuong-lai-nganh-dien-lanh-2026': TrendingUp,
  'robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai': Bot,
};
