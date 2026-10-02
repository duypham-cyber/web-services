import type { Site } from './schemas';

/**
 * Pháp nhân và kênh liên hệ. Nguồn: research/raw/contact.txt, research/raw/home.txt (site cũ, 01/10/2026).
 * Chủ sở hữu: tech lead nền móng. Đổi số liệu ở đây = đổi ở mọi trang (header, footer, liên hệ, JSON-LD).
 */
export const site = {
  brandName: 'Bluebolt Services',
  url: 'https://lapdattoanquoc.vn',
  legalName: {
    // Tên pháp nhân KHÔNG dịch (docs/03 mục 1.4, CRO-12)
    upper: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TIA CHỚP XANH',
    titleCase: 'Công ty Cổ phần Công nghệ Tia Chớp Xanh',
  },
  taxCode: '0316875706',
  address: {
    text: {
      vi: '100 Nguyễn Văn Lượng, Phường Gò Vấp, TP. Hồ Chí Minh',
      en: '100 Nguyen Van Luong, Go Vap Ward, Ho Chi Minh City, Vietnam',
    },
    note:
      'Giả định, chờ anh Duy xác nhận: lấy nguyên văn từ site cũ (trang /contact và footer). Địa chỉ đã ở dạng sau sắp xếp ' +
      'đơn vị hành chính 01/07/2025 (không còn cấp quận). Cần đối chiếu với Giấy chứng nhận ĐKDN mới nhất trước launch.',
  },
  hotline: {
    // Một cách viết duy nhất (docs/03 mục 11.5)
    display: { vi: '0902 808 049', en: '+84 902 808 049' },
    tel: '+84902808049',
  },
  email: 'contact@bluebolt.services',
  zalo: {
    url: 'https://zalo.me/0902808049',
    status: 'draft',
    note:
      'Nháp: chưa xác nhận số hotline có tài khoản Zalo/Zalo OA chính thức (docs/03 mục 15 dòng 21). ' +
      'Ở production chỉ hiện khi đổi status thành approved.',
  },
  socials: [],
  sources: ['research/raw/contact.txt', 'research/raw/home.txt', 'docs/03 mục 1.4, 11.5, 13.4'],
} satisfies Site;

/** Năm hiển thị ở dòng ©, lấy lúc build. */
export const copyrightYear = new Date().getFullYear();
