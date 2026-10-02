import { Fragment } from 'react';

/**
 * Chữ trong thân bài: chỉ hỗ trợ **đậm** (content/articles/types.ts). Không HTML, không link nội tuyến.
 * Chữ đậm dùng họ font 700 đã preload (app/globals.css → strong).
 */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="text-(--surface-heading)">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
