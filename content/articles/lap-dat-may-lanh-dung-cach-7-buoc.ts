import type { ArticleContent } from './types';

/**
 * Nguồn: https://lapdattoanquoc.vn/news/lap-dat-may-lanh-dung-cach-7-buoc (+ bản /en), tải lại 02/10/2026.
 * Giữ nguyên cấu trúc 7 bước; chỉ sửa giọng văn (docs/03 mục 11.5).
 */
export const lapDatMayLanhDungCach7Buoc = {
  key: 'lap-dat-may-lanh-dung-cach-7-buoc',
  seoTitle: {
    vi: 'Lắp máy lạnh đúng cách: 7 kinh nghiệm | Bluebolt Services',
    en: 'Installing an air conditioner the right way: 7 steps',
  },
  description: {
    vi: 'Bảy kinh nghiệm lắp máy lạnh đúng cách: chọn vị trí, đi ống đồng, hút chân không, điện riêng, thoát nước, chạy thử và chọn đơn vị lắp đặt.',
    en: 'Seven practices for a correct air conditioner install: placement, copper piping, vacuuming, wiring, drainage, test runs and choosing an installer.',
  },
  lead: {
    vi: 'Việc lắp đặt máy lạnh không chỉ là “treo máy và cắm điện”. Lắp sai kỹ thuật khiến thiết bị hao điện, kém lạnh, nhanh hỏng và có thể mất bảo hành từ hãng.',
    en: "Installing an air conditioner takes more than mounting the unit and plugging it in. Poor workmanship means higher power bills, weak cooling, early failures and possibly a void manufacturer's warranty.",
  },
  publishedAt: '2026-04-12',
  updatedAt: '2026-10-02',
  // Ảnh đầu bài của site cũ là ảnh AI (dấu ✦ Gemini, thợ mặc áo "BLUEBOLT" giả) → đã gỡ (docs/03 mục 11.4). Tạm dùng ảnh
  // minh họa sạch (không logo, không chữ), có nhãn, theo D-31 (content/photos.ts) tới khi có ảnh thật từ buổi chụp
  // (docs/03 mục 15 dòng 10). og:image cũ /images/news/lap-dat-may-lanh-7-buoc.jpg → 301 (content/redirects.ts).
  hero: {
    src: '/images/photos/tho-lap-dieu-hoa-16x9.jpg',
    width: 1456,
    height: 819,
    alt: {
      vi: 'Thợ kỹ thuật mặc áo xanh lắp dàn lạnh điều hòa treo tường trong căn hộ',
      en: 'A technician in a blue polo shirt mounting a wall-mounted air conditioner in an apartment',
    },
    illustrative: true,
  },
  ogImage: { src: '/images/news/og/lap-dat-may-lanh-dung-cach-7-buoc.jpg', width: 1200, height: 630 },
  intro: [
    {
      type: 'p',
      text: {
        vi: 'Nếu lắp sai kỹ thuật, máy lạnh có thể hao điện, kém lạnh, nhanh hỏng và thậm chí mất bảo hành từ hãng. Dưới đây là những kinh nghiệm quan trọng giúp bạn lắp đặt máy lạnh đúng cách ngay từ đầu.',
        en: "A poorly installed air conditioner can use more power, cool weakly, wear out quickly and even lose the manufacturer's warranty. Below are the key practices that help you get the installation right from day one.",
      },
    },
  ],
  sections: [
    {
      title: {
        vi: '7 kinh nghiệm lắp đặt máy lạnh đúng cách',
        en: '7 practices for installing an air conditioner correctly',
      },
      blocks: [
        {
          type: 'steps',
          items: [
            {
              title: { vi: 'Chọn vị trí lắp đặt phù hợp', en: 'Choose the right location' },
              blocks: [
                {
                  type: 'p',
                  text: {
                    vi: 'Vị trí lắp đặt ảnh hưởng trực tiếp đến hiệu quả làm lạnh và tuổi thọ máy.',
                    en: 'Where you install the unit directly affects cooling performance and service life.',
                  },
                },
                {
                  type: 'list',
                  label: { vi: 'Dàn lạnh nên', en: 'Indoor unit' },
                  items: [
                    {
                      vi: 'Đặt ở vị trí trung tâm phòng để luồng gió tỏa đều',
                      en: 'Place it centrally so the airflow spreads evenly through the room',
                    },
                    {
                      vi: 'Tránh thổi trực tiếp vào giường ngủ hoặc bàn làm việc',
                      en: 'Avoid blowing air straight at a bed or a desk',
                    },
                    { vi: 'Treo cao cách trần khoảng 10–15 cm', en: 'Mount it about 10–15 cm below the ceiling' },
                  ],
                },
                {
                  type: 'list',
                  label: { vi: 'Dàn nóng nên', en: 'Outdoor unit' },
                  items: [
                    { vi: 'Đặt nơi thoáng, có mái che', en: 'Put it somewhere well ventilated and sheltered' },
                    { vi: 'Tránh ánh nắng trực tiếp', en: 'Keep it out of direct sunlight' },
                    {
                      vi: 'Đảm bảo khoảng cách tản nhiệt, ít nhất 30 cm xung quanh',
                      en: 'Leave at least 30 cm of clearance on all sides for heat dissipation',
                    },
                  ],
                },
              ],
            },
            {
              title: {
                vi: 'Đảm bảo chiều dài và cách đi ống đồng chuẩn',
                en: 'Get the copper pipe length and routing right',
              },
              blocks: [
                {
                  type: 'p',
                  text: {
                    vi: 'Ống đồng là “mạch máu” của hệ thống máy lạnh.',
                    en: 'The copper piping is the lifeline of the whole system.',
                  },
                },
                {
                  type: 'list',
                  label: { vi: 'Lưu ý', en: 'Keep in mind' },
                  items: [
                    {
                      vi: 'Chiều dài tối thiểu thường từ 3 mét (tùy hãng)',
                      en: 'The minimum length is usually 3 metres (it varies by brand)',
                    },
                    {
                      vi: 'Không nên đi ống quá ngắn hoặc quá gấp khúc',
                      en: 'Avoid runs that are too short or have sharp bends',
                    },
                    { vi: 'Hạn chế nối ống để tránh rò rỉ gas', en: 'Keep joints to a minimum to prevent refrigerant leaks' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  text: {
                    vi: 'Đi ống đúng kỹ thuật giúp máy làm lạnh nhanh hơn và tiết kiệm điện hơn.',
                    en: 'Correctly routed piping helps the unit cool faster and use less power.',
                  },
                },
              ],
            },
            {
              title: {
                vi: 'Hút chân không — bước bắt buộc nhưng hay bị bỏ qua',
                en: 'Vacuum the system — a required step that is often skipped',
              },
              blocks: [
                {
                  type: 'p',
                  text: {
                    vi: 'Đây là bước cực kỳ quan trọng nhưng nhiều đơn vị lắp đặt bỏ qua để tiết kiệm thời gian.',
                    en: 'This step is critical, yet many installers skip it to save time.',
                  },
                },
                {
                  type: 'list',
                  label: { vi: 'Hút chân không giúp', en: 'Vacuuming the lines' },
                  items: [
                    { vi: 'Loại bỏ không khí và hơi ẩm trong ống', en: 'Removes air and moisture from the pipes' },
                    { vi: 'Tránh đóng tuyết, nghẹt gas', en: 'Prevents icing and refrigerant blockages' },
                    { vi: 'Tăng tuổi thọ máy nén', en: 'Extends the life of the compressor' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  text: {
                    vi: 'Nếu không hút chân không, máy có thể giảm hiệu suất và nhanh hỏng sau 6–12 tháng.',
                    en: 'Without a vacuum, the unit can lose efficiency and fail within 6–12 months.',
                  },
                },
              ],
            },
            {
              title: { vi: 'Lắp đặt hệ thống điện an toàn', en: 'Install a safe electrical supply' },
              blocks: [
                {
                  type: 'p',
                  text: {
                    vi: 'Máy lạnh là thiết bị công suất lớn nên cần hệ thống điện riêng biệt.',
                    en: 'An air conditioner draws a lot of power, so it needs its own circuit.',
                  },
                },
                {
                  type: 'list',
                  label: { vi: 'Cần đảm bảo', en: 'Make sure there is' },
                  items: [
                    { vi: 'Có CB (aptomat) riêng cho máy', en: 'A dedicated circuit breaker for the unit' },
                    { vi: 'Dây điện đúng tiết diện', en: 'Wiring of the correct cross-section' },
                    { vi: 'Nguồn điện ổn định', en: 'A stable power supply' },
                  ],
                },
                {
                  type: 'p',
                  text: {
                    vi: 'Điều này giúp tránh chập cháy và bảo vệ thiết bị lâu dài.',
                    en: 'This prevents short circuits and fires and protects the equipment over the long term.',
                  },
                },
              ],
            },
            {
              title: { vi: 'Kiểm tra thoát nước và chống rò rỉ', en: 'Check the drainage and prevent leaks' },
              blocks: [
                {
                  type: 'p',
                  text: {
                    vi: 'Ống thoát nước nếu lắp sai sẽ gây nhiều hậu quả khó chịu.',
                    en: 'A badly fitted drain line causes problems that are hard to live with.',
                  },
                },
                {
                  type: 'list',
                  label: { vi: 'Hậu quả thường gặp', en: 'Common consequences' },
                  items: [
                    { vi: 'Chảy nước trong nhà', en: 'Water dripping indoors' },
                    { vi: 'Ẩm mốc tường', en: 'Damp, mouldy walls' },
                    { vi: 'Mùi khó chịu', en: 'Unpleasant smells' },
                  ],
                },
                {
                  type: 'list',
                  label: { vi: 'Lưu ý', en: 'Keep in mind' },
                  items: [
                    { vi: 'Độ dốc ống thoát nước phải hợp lý', en: 'The drain pipe needs a proper slope' },
                    { vi: 'Không gấp khúc hoặc bị nghẹt', en: 'It must not be kinked or blocked' },
                  ],
                },
              ],
            },
            {
              title: {
                vi: 'Chạy thử và nghiệm thu kỹ trước khi hoàn tất',
                en: 'Test and inspect thoroughly before sign-off',
              },
              blocks: [
                {
                  type: 'p',
                  text: {
                    vi: 'Sau khi lắp đặt, cần kiểm tra đầy đủ trước khi thanh toán.',
                    en: 'After installation, run a full check before you pay.',
                  },
                },
                {
                  type: 'list',
                  label: { vi: 'Kiểm tra', en: 'Check whether' },
                  items: [
                    { vi: 'Máy có làm lạnh nhanh không', en: 'The unit cools quickly' },
                    { vi: 'Có tiếng ồn bất thường không', en: 'There is any unusual noise' },
                    { vi: 'Có rò nước hoặc rò gas không', en: 'There is any water or refrigerant leak' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  text: {
                    vi: 'Đừng vội thanh toán khi chưa chạy thử đầy đủ.',
                    en: 'Do not pay until the full test run is done.',
                  },
                },
              ],
            },
            {
              title: { vi: 'Lựa chọn đơn vị lắp đặt uy tín', en: 'Choose a reputable installer' },
              blocks: [
                {
                  type: 'p',
                  text: {
                    vi: 'Dù máy tốt đến đâu, lắp đặt sai vẫn gây hỏng hóc.',
                    en: 'However good the unit, a poor installation will still cause faults.',
                  },
                },
                {
                  type: 'list',
                  label: { vi: 'Một đơn vị chuyên nghiệp sẽ', en: 'A professional installer will' },
                  items: [
                    { vi: 'Báo giá minh bạch trước khi làm', en: 'Give a clear quote before starting' },
                    { vi: 'Có quy trình kỹ thuật chuẩn', en: 'Follow a standard technical procedure' },
                    { vi: 'Bảo hành rõ ràng', en: 'Offer a clear warranty' },
                  ],
                },
                {
                  type: 'p',
                  text: {
                    vi: 'Đây là yếu tố quyết định phần lớn trải nghiệm sử dụng máy lạnh.',
                    en: 'This choice shapes most of your experience with the air conditioner.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: { vi: 'Gợi ý từ Bluebolt Services', en: 'Recommendations from Bluebolt Services' },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Bluebolt Services lắp đặt máy lạnh theo quy trình chuẩn',
            en: 'Bluebolt Services installs air conditioners following a standard procedure',
          },
          items: [
            { vi: 'Khảo sát kỹ trước khi lắp', en: 'A thorough site survey before installation' },
            { vi: 'Hút chân không đầy đủ', en: 'A complete vacuum of the lines' },
            { claim: 'knowledge.pricing-no-surprise-costs' },
            { claim: 'knowledge.warranty-workmanship-12-months' },
          ],
        },
      ],
    },
  ],
  editNotes: [
    'Bỏ đoạn mở đầu trùng gần nguyên văn với câu dẫn; tiêu đề viết hoa → sentence case; bỏ emoji 🚀, 💡.',
    'Bước 7: "quyết định 80% trải nghiệm" → "quyết định phần lớn trải nghiệm" (số không có nguồn).',
    'Mục gợi ý: "không phát sinh" và "bảo hành 12 tháng" chuyển thành claim nháp; bỏ câu kêu gọi gọi hotline (thay bằng khối CTA chung).',
    'Gỡ ảnh đầu bài (ảnh AI có dấu Gemini, thợ mặc áo in "BLUEBOLT") và infographic in sẵn khẩu hiệu tự khen + áo "BLUEBOLT SERVICES" (docs/03 mục 11.4, 11.5). Chờ ảnh thật; mục lục và 7 bước bằng chữ đủ ý.',
  ],
} as const satisfies ArticleContent;
