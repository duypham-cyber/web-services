/**
 * Script nhỏ chạy ĐẦU <head> (trước khi vẽ) — kiến trúc học từ MotionEngine của MD (docs/03 mục 12.2 luật 6):
 *   - reduced-motion hoặc Save-Data → không làm gì: nội dung hiện ngay, không chuyển động.
 *   - còn lại → html[data-motion=pending]; MotionRuntime (sau hydrate) đổi sang "ready".
 *   - an toàn: sau 4 s vẫn "pending" (JS lỗi/chậm) → "off" → mọi nội dung hiện ra.
 *   - bundle không đọc được (SyntaxError trong /_next/static/, vd. trình duyệt quá cũ) lúc còn "pending" → "off" ngay, không
 *     chờ 4 s (D-35).
 * Không JS → không có thuộc tính → nội dung luôn hiện.
 * Khi bật CSP (docs/04 mục 2.7) phải thêm hash của chuỗi này vào script-src.
 */
export const MOTION_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,w=window;if(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var c=navigator.connection;if(c&&c.saveData)return;d.setAttribute('data-motion','pending');var off=function(){if(d.getAttribute('data-motion')==='pending')d.setAttribute('data-motion','off')};setTimeout(off,4000);w.addEventListener('error',function(e){if(/\\/_next\\/static\\//.test(e.filename||'')&&((e.error&&e.error.name==='SyntaxError')||/SyntaxError/.test(e.message||'')))off()})}catch(e){}})();`;
