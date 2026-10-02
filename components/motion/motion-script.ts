/**
 * Script nhỏ chạy ĐẦU <head> (trước khi vẽ) — kiến trúc học từ MotionEngine của MD (docs/03 mục 12.2 luật 6):
 *   - reduced-motion hoặc Save-Data → không làm gì: nội dung hiện ngay, không chuyển động.
 *   - còn lại → html[data-motion=pending]; MotionRuntime (sau hydrate) đổi sang "ready".
 *   - an toàn: sau 4 s vẫn "pending" (JS lỗi/chậm) → "off" → mọi nội dung hiện ra.
 * Không JS → không có thuộc tính → nội dung luôn hiện.
 * Khi bật CSP (docs/04 mục 2.7) phải thêm hash của chuỗi này vào script-src.
 */
export const MOTION_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,w=window;if(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var c=navigator.connection;if(c&&c.saveData)return;d.setAttribute('data-motion','pending');setTimeout(function(){if(d.getAttribute('data-motion')==='pending')d.setAttribute('data-motion','off')},4000)}catch(e){}})();`;
