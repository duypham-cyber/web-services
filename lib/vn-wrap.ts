/**
 * Giữ từ ghép tiếng Việt trên cùng một dòng ở tiêu đề (docs/03 mục 11.2).
 *
 * Tiếng Việt viết cách theo âm tiết nên mỗi dấu cách là một chỗ trình duyệt được ngắt dòng; với `text-wrap: balance`
 * (app/globals.css, h1–h4) tiêu đề hay bị ngắt giữa từ hai âm tiết: "thu | nhập", "lắp | đặt", "đơn | vị". Hàm này thay
 * dấu cách GIỮA các âm tiết của từ ghép đã biết bằng NBSP (U+00A0) — vẫn giữ `balance`, chỉ bớt chỗ ngắt sai.
 *  - Chỉ nối khi không có dấu câu xen giữa ("thu, nhập" giữ nguyên). Không phân biệt hoa thường, so ở dạng NFC.
 *  - Số + đơn vị ("5 bước", "30 phút", "34 tỉnh") cũng giữ cùng dòng.
 *  - EN: "after-sales" dùng gạch nối không ngắt (U+2011) để không vỡ thành "after- | sales".
 * Dùng cho chuỗi TIÊU ĐỀ (components/ui/Heading.tsx tự áp cho children là chuỗi; tiêu đề render bằng thẻ h thường thì
 * gọi trực tiếp). Không dùng cho đoạn văn, thuộc tính, JSON-LD, <title>. Không regex lookbehind (Safari 15).
 * Thêm từ: viết thường, một dấu cách giữa các âm tiết, dạng NFC.
 */
const COMPOUNDS: ReadonlySet<string> = new Set(
  [
    // dịch vụ, lắp đặt, thiết bị
    'lắp đặt', 'dịch vụ', 'bảo hành', 'bảo trì', 'bảo dưỡng', 'sửa chữa', 'thiết bị', 'điện máy', 'điện lạnh', 'điều hòa',
    'điều hoà', 'máy lạnh', 'máy giặt', 'máy sấy', 'tủ lạnh', 'treo tường', 'âm trần', 'bếp từ', 'hút mùi', 'lọc nước',
    'nóng lạnh', 'hút bụi', 'tự động hóa', 'tự động hoá', 'thông minh', 'vật tư', 'đường ống', 'ống đồng', 'chân không',
    'thoát nước', 'linh kiện', 'công trình', 'khảo sát', 'chạy thử', 'nghiệm thu', 'trọn gói', 'kỹ thuật', 'kỹ năng',
    // khách, đối tác, kinh doanh
    'khách hàng', 'khách lẻ', 'đối tác', 'doanh nghiệp', 'bán lẻ', 'bán hàng', 'sau bán', 'đơn hàng', 'đơn vị', 'đầu mối',
    'trung gian', 'thương mại', 'điện tử', 'sàn tmđt', 'ngành hàng', 'sản phẩm', 'sản lượng', 'thương hiệu', 'hợp đồng',
    'báo giá', 'khung giá', 'tham khảo', 'chi phí', 'phát sinh', 'thanh toán', 'hóa đơn', 'hoá đơn', 'đối soát',
    'tách bạch', 'thu nhập', 'tiền công',
    // vận hành, chất lượng
    'mạng lưới', 'toàn quốc', 'triển khai', 'vận hành', 'điều phối', 'quy trình', 'tiêu chuẩn', 'quy chuẩn', 'chất lượng',
    'kiểm soát', 'minh bạch', 'ổn định', 'trạng thái', 'thời gian', 'thời hạn', 'cam kết', 'xác nhận', 'tiếp nhận',
    'xác minh', 'khiếu nại', 'trách nhiệm', 'theo dõi', 'tiến độ', 'số liệu', 'dữ liệu', 'báo cáo', 'công nghệ',
    'chuyển đổi', 'phát triển', 'kinh nghiệm', 'trình độ', 'tác phong', 'an toàn', 'tuyển dụng', 'tuyển thợ',
    'ứng tuyển', 'vị trí', 'khu vực', 'địa phương', 'tỉnh thành', 'phục vụ', 'làm việc', 'văn phòng', 'định kỳ',
    // trang, nội dung
    'giải pháp', 'chính sách', 'điều khoản', 'bảo mật', 'sử dụng', 'hỗ trợ', 'chăm sóc', 'liên hệ', 'đăng ký',
    'kiến thức', 'hướng dẫn', 'câu hỏi', 'thường gặp', 'nguyên nhân', 'rủi ro', 'xu hướng', 'gia đình', 'hiện đại',
    'nội dung', 'thông tin', 'lưu ý', 'chuẩn bị', 'cập nhật', 'liên quan', 'trường hợp', 'quản lý', 'quần đảo',
    'hạ tầng', 'hệ thống', 'quyết định', 'trải nghiệm', 'tương lai', 'giá trị', 'bài viết',
    // tên riêng
    'bluebolt services', 'việt nam', 'hà nội', 'hồ chí minh', 'đà nẵng', 'cần thơ', 'hải phòng',
  ].map((w) => w.normalize('NFC')),
);
const MAX_WORDS = 3;
const NBSP = ' ';
const LEAD = /^[(["“‘'«]+/;
const TRAIL = /[)\]"”’'»,.;:!?…]+$/;
const NUMBER = /^\d[\d.,/–-]*$/;
const WORD = /^\p{L}/u;

const core = (word: string) => word.replace(LEAD, '').replace(TRAIL, '').normalize('NFC').toLocaleLowerCase('vi');

/** Các từ words[i..i+n-1] không có dấu câu ở chỗ nối (dấu câu ở hai đầu cụm thì được). */
function joinable(words: readonly string[], i: number, n: number): boolean {
  for (let k = i; k < i + n; k++) {
    const w = words[k] ?? '';
    if (k > i && LEAD.test(w)) return false;
    if (k < i + n - 1 && TRAIL.test(w)) return false;
  }
  return true;
}

export function keepCompounds(text: string): string {
  let out = text.replace(/\bafter-sales\b/gi, (m) => m.replace('-', '‑'));
  if (!out.includes(' ')) return out;
  const words = out.split(' ');
  const sep: string[] = Array.from({ length: words.length - 1 }, () => ' ');
  for (let i = 0; i < words.length - 1; i++) {
    for (let n = Math.min(MAX_WORDS, words.length - i); n >= 2; n--) {
      if (!joinable(words, i, n)) continue;
      const key = words.slice(i, i + n).map(core).join(' ');
      if (COMPOUNDS.has(key)) {
        for (let k = i; k < i + n - 1; k++) sep[k] = NBSP;
        break;
      }
    }
    // Số + đơn vị: "5 bước", "30 phút", "34 tỉnh"
    if (NUMBER.test(words[i] ?? '') && WORD.test(words[i + 1] ?? '')) sep[i] = NBSP;
  }
  out = words[0] ?? '';
  for (let k = 1; k < words.length; k++) out += (sep[k - 1] ?? ' ') + words[k];
  return out;
}
