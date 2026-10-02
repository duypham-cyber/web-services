'use client';

import { MOTION_BOOT_SCRIPT } from './motion-script';

/**
 * Chèn script khởi động motion vào <head> CHỈ khi render ở server (chạy trước lần vẽ đầu, không nháy nội dung).
 * Ở client trả về null: React 19 bỏ qua thẻ <script> thừa khi hydrate, và không báo lỗi "script tag" khi phải
 * render lại cả layout ở client (trang 404 của Next 16.3.8 — docs/DECISIONS.md D-10).
 */
export function MotionBootScript() {
  if (typeof window !== 'undefined') return null;
  return <script id="bb-motion-boot" dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />;
}
