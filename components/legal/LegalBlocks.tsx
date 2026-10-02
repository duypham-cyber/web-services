import { TableScroll } from '@/components/ui/TableScroll';
import type { LegalBlock } from '@/content/legal';
import type { Locale } from '@/i18n/routing';

/**
 * Render khối nội dung pháp lý (đoạn, danh sách, bảng) bên trong <Prose> (.prose-bb lo kiểu chữ).
 * KHÔNG animate nội dung pháp lý (docs/03 mục 12.2, luật cứng 3).
 */
export function LegalBlocks({ blocks, locale }: { blocks: readonly LegalBlock[]; locale: Locale }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === 'p') return <p key={i}>{block.text[locale]}</p>;
        if (block.kind === 'list') {
          return (
            <ul key={i}>
              {block.items.map((item) => (
                <li key={item.vi}>{item[locale]}</li>
              ))}
            </ul>
          );
        }
        return (
          <TableScroll key={i} label={block.caption[locale]}>
            <table className="m-0 min-w-[18rem]">
              <caption className="sr-only">{block.caption[locale]}</caption>
              <thead className="bg-blue-50">
                <tr>
                  {block.head.map((cell) => (
                    <th key={cell.vi} scope="col">
                      {cell[locale]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row[0]?.vi}>
                    {row.map((cell, j) =>
                      j === 0 ? (
                        <th key={cell.vi} scope="row" className="font-medium">
                          {cell[locale]}
                        </th>
                      ) : (
                        <td key={cell.vi} className="tabular">
                          {cell[locale]}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        );
      })}
    </>
  );
}
