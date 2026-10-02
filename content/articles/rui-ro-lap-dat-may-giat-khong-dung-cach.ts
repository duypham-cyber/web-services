import type { ArticleContent, Localized } from './types';

/**
 * Nguồn: https://lapdattoanquoc.vn/news/rui-ro-lap-dat-may-giat-khong-dung-cach (+ bản /en), tải lại 02/10/2026.
 */
const SIGNS: Localized = { vi: 'Dấu hiệu', en: 'Signs' };
const CAUSES: Localized = { vi: 'Nguyên nhân thường gặp', en: 'Common causes' };
const FIXES: Localized = { vi: 'Cách khắc phục', en: 'How to fix it' };

export const ruiRoLapDatMayGiat = {
  key: 'rui-ro-lap-dat-may-giat-khong-dung-cach',
  seoTitle: {
    vi: 'Rủi ro khi lắp máy giặt sai cách và cách phòng tránh',
    en: 'Washing machine installation risks and how to avoid them',
  },
  description: {
    vi: 'Bảy rủi ro khi lắp máy giặt sai cách: rò nước, rung lắc, hỏng động cơ, chập điện, tắc ống xả, giặt kém, mất bảo hành. Kèm checklist lắp đặt 6 bước.',
    en: 'Seven risks of a poorly installed washing machine, from leaks, vibration and electrical faults to a void warranty, plus a 6-step installation checklist.',
  },
  lead: {
    vi: 'Lắp đặt máy giặt sai kỹ thuật có thể gây rò rỉ nước, rung ồn quá mức, hỏng động cơ, chập cháy điện và mất bảo hành. Dưới đây là 7 rủi ro phổ biến và cách phòng tránh.',
    en: 'A badly installed washing machine can leak, shake and roar, burn out its motor, cause electrical faults and lose its warranty. Here are seven common risks and how to avoid them.',
  },
  publishedAt: '2026-04-26',
  updatedAt: '2026-10-02',
  // Ảnh đầu bài cũ là stock "phụ nữ phương Tây bên máy giặt" (docs/03 mục 11.4) → gỡ, chờ ảnh thiết bị không người,
  // không logo, hoặc ảnh thật. File cũ vẫn ở public/ (og:image cũ, content/redirects.ts "keep").
  hero: null,
  ogImage: null,
  intro: [
    {
      type: 'p',
      text: {
        vi: 'Máy giặt là thiết bị có công suất lớn, sử dụng đồng thời nước và điện trong môi trường ẩm, nên lắp đặt đúng kỹ thuật là yếu tố sống còn. Một sai lầm nhỏ trong khâu lắp đặt có thể dẫn đến rò rỉ nước, rung ồn quá mức, thậm chí chập cháy điện hoặc mất bảo hành từ hãng.',
        en: "A washing machine is a high-power appliance that combines water and electricity in a damp space, so a correct installation is essential. One small mistake can lead to leaks, excessive vibration and noise, an electrical fire or a lost manufacturer's warranty.",
      },
    },
    {
      type: 'p',
      text: {
        vi: 'Bluebolt Services tổng hợp 7 rủi ro phổ biến nhất khi lắp máy giặt sai cách, kèm dấu hiệu nhận biết, nguyên nhân và cách khắc phục.',
        en: 'Bluebolt Services has put together the seven most common risks of installing a washing machine incorrectly, with the warning signs, causes and fixes for each.',
      },
    },
  ],
  sections: [
    {
      title: { vi: '7 rủi ro khi lắp máy giặt sai cách', en: '7 risks of installing a washing machine incorrectly' },
      blocks: [
        {
          type: 'steps',
          items: [
            {
              title: { vi: 'Rò rỉ nước, ngập sàn nhà', en: 'Water leaks and flooded floors' },
              blocks: [
                {
                  type: 'list',
                  label: SIGNS,
                  items: [
                    {
                      vi: 'Có vũng nước quanh máy sau mỗi chu trình giặt',
                      en: 'Puddles around the machine after every cycle',
                    },
                    {
                      vi: 'Tường, sàn xung quanh máy bị ẩm mốc',
                      en: 'Damp or mouldy walls and floor around the machine',
                    },
                    { vi: 'Mùi nước cống từ ống thoát', en: 'A sewer smell coming from the drain' },
                  ],
                },
                {
                  type: 'list',
                  label: CAUSES,
                  items: [
                    {
                      vi: 'Đầu nối ống cấp, ống xả nước chưa siết chặt',
                      en: 'Inlet or drain hose connections that are not tight',
                    },
                    {
                      vi: 'Ống xả không đúng độ dốc, bị gấp khúc',
                      en: 'A drain hose without the right slope, or one that is kinked',
                    },
                    {
                      vi: 'Ron cao su xuống cấp hoặc lắp lệch',
                      en: 'Worn or misaligned rubber seals',
                    },
                  ],
                },
                {
                  type: 'list',
                  label: FIXES,
                  items: [
                    {
                      vi: 'Kiểm tra và siết lại các đầu nối, dùng băng tan đúng cách',
                      en: 'Check and tighten every connection, using thread seal tape correctly',
                    },
                    {
                      vi: 'Đảm bảo ống xả có độ dốc tối thiểu 1 cm/m, không gấp khúc',
                      en: 'Give the drain hose a slope of at least 1 cm per metre, with no kinks',
                    },
                    {
                      vi: 'Thay ron mới khi lắp đặt, không tái sử dụng ron cũ',
                      en: 'Fit new seals during installation and never reuse old ones',
                    },
                  ],
                },
              ],
            },
            {
              title: { vi: 'Rung lắc và gây ồn quá mức', en: 'Excessive vibration and noise' },
              blocks: [
                {
                  type: 'list',
                  label: SIGNS,
                  items: [
                    {
                      vi: 'Máy “nhảy” khi vắt, phát ra tiếng kêu lớn',
                      en: 'The machine jumps during the spin cycle and bangs loudly',
                    },
                    { vi: 'Sàn nhà bị rung khi máy hoạt động', en: 'The floor shakes while it runs' },
                    { vi: 'Máy bị di chuyển khỏi vị trí ban đầu', en: 'The machine creeps out of position' },
                  ],
                },
                {
                  type: 'list',
                  label: CAUSES,
                  items: [
                    {
                      vi: 'Chưa tháo bu-lông cố định lồng giặt khi vận chuyển',
                      en: 'The transit bolts that lock the drum were never removed',
                    },
                    {
                      vi: 'Máy đặt trên sàn không phẳng hoặc nghiêng',
                      en: 'The machine stands on an uneven or sloping floor',
                    },
                    { vi: 'Không cân bằng 4 chân máy', en: 'The four feet are not levelled' },
                  ],
                },
                {
                  type: 'list',
                  label: FIXES,
                  items: [
                    {
                      vi: 'Tháo toàn bộ bu-lông vận chuyển **trước** khi cắm điện',
                      en: 'Remove every transit bolt **before** plugging the machine in',
                    },
                    {
                      vi: 'Dùng thước thủy kiểm tra và cân chỉnh 4 chân máy',
                      en: 'Use a spirit level to check and adjust all four feet',
                    },
                    {
                      vi: 'Đặt máy trên nền bê tông cứng, tránh sàn gỗ rỗng',
                      en: 'Stand the machine on solid concrete rather than a hollow wooden floor',
                    },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  text: {
                    vi: 'Bỏ qua bước tháo bu-lông vận chuyển có thể làm hỏng vĩnh viễn lò xo treo lồng giặt.',
                    en: 'Skipping the transit bolts can permanently damage the springs that suspend the drum.',
                  },
                },
              ],
            },
            {
              title: { vi: 'Hỏng máy nén hoặc động cơ sớm', en: 'Early motor or compressor failure' },
              blocks: [
                {
                  type: 'list',
                  label: SIGNS,
                  items: [
                    { vi: 'Máy chạy yếu sau vài tháng đầu', en: 'The machine weakens after the first few months' },
                    { vi: 'Tiếng kêu lạ từ động cơ', en: 'Odd noises from the motor' },
                    { vi: 'Quá tải, ngắt giữa chu trình', en: 'Overload errors or stops mid-cycle' },
                  ],
                },
                {
                  type: 'list',
                  label: CAUSES,
                  items: [
                    { vi: 'Áp lực nước cấp quá thấp hoặc quá cao', en: 'Water pressure that is too low or too high' },
                    { vi: 'Lắp máy ở nơi quá nóng, kín khí', en: 'A hot or poorly ventilated location' },
                    { vi: 'Rung lắc kéo dài làm hỏng bạc đạn', en: 'Long-term vibration wearing out the bearings' },
                  ],
                },
                {
                  type: 'list',
                  label: FIXES,
                  items: [
                    {
                      vi: 'Lắp van giảm áp nếu áp lực nước trên 8 bar',
                      en: 'Fit a pressure-reducing valve if the supply exceeds 8 bar',
                    },
                    {
                      vi: 'Chừa khoảng cách 5–10 cm xung quanh máy để thoát nhiệt',
                      en: 'Leave 5–10 cm of space around the machine so heat can escape',
                    },
                    {
                      vi: 'Khắc phục triệt để rung lắc ngay từ đầu',
                      en: 'Fix any vibration problem properly from the start',
                    },
                  ],
                },
              ],
            },
            {
              title: { vi: 'Nguy cơ chập cháy điện', en: 'Risk of short circuits and fire' },
              blocks: [
                {
                  type: 'list',
                  label: SIGNS,
                  items: [
                    { vi: 'Cảm giác tê tay khi chạm vỏ máy', en: 'A tingling feeling when you touch the casing' },
                    { vi: 'Aptomat ngắt thường xuyên', en: 'The circuit breaker trips often' },
                    { vi: 'Mùi khét nhẹ từ ổ cắm', en: 'A faint burning smell from the socket' },
                  ],
                },
                {
                  type: 'list',
                  label: CAUSES,
                  items: [
                    { vi: 'Không có dây nối đất (tiếp địa)', en: 'No earth wire' },
                    {
                      vi: 'Ổ cắm chung với nhiều thiết bị công suất lớn',
                      en: 'A socket shared with other high-power appliances',
                    },
                    { vi: 'Dây điện không đủ tiết diện', en: 'Wiring with too small a cross-section' },
                  ],
                },
                {
                  type: 'list',
                  label: FIXES,
                  items: [
                    {
                      vi: 'Bắt buộc nối đất cho máy giặt, đặc biệt máy có sấy',
                      en: 'Always earth the machine, especially washer-dryers',
                    },
                    {
                      vi: 'Cắm máy giặt vào ổ riêng có aptomat (CB) chuyên dụng',
                      en: 'Plug it into its own socket on a dedicated circuit breaker',
                    },
                    {
                      vi: 'Dùng dây điện tối thiểu 1,5–2,5 mm² tùy công suất',
                      en: 'Use cable of at least 1.5–2.5 mm² depending on the power rating',
                    },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  text: {
                    vi: 'Máy giặt tiếp xúc trực tiếp với nước: không có dây tiếp địa là nguy cơ điện giật chết người.',
                    en: 'A washing machine is in direct contact with water: without an earth wire, the risk of a fatal shock is real.',
                  },
                },
              ],
            },
            {
              title: { vi: 'Tắc nghẽn ống xả nước', en: 'A blocked drain hose' },
              blocks: [
                {
                  type: 'list',
                  label: SIGNS,
                  items: [
                    { vi: 'Nước xả chậm hoặc không xả hết', en: 'Water drains slowly or not at all' },
                    { vi: 'Máy báo lỗi “drain” hoặc “E03”', en: 'The display shows a drain or E03 error' },
                    { vi: 'Có nước đọng trong lồng giặt', en: 'Water stays in the drum' },
                  ],
                },
                {
                  type: 'list',
                  label: CAUSES,
                  items: [
                    {
                      vi: 'Ống xả lắp quá thấp (dưới đáy máy)',
                      en: 'The drain hose sits too low (below the base of the machine)',
                    },
                    {
                      vi: 'Chiều dài ống xả vượt quy định (thường trên 2 m)',
                      en: 'The hose is longer than specified (usually over 2 m)',
                    },
                    {
                      vi: 'Bị gấp khúc, bám cặn xà phòng và sợi vải',
                      en: 'Kinks, or a build-up of detergent residue and lint',
                    },
                  ],
                },
                {
                  type: 'list',
                  label: FIXES,
                  items: [
                    {
                      vi: 'Đặt đầu ống xả ở độ cao 60–90 cm so với sàn',
                      en: 'Position the end of the drain hose 60–90 cm above the floor',
                    },
                    {
                      vi: 'Cắt bớt ống xả nếu quá dài, tránh nối thêm tùy tiện',
                      en: 'Shorten an over-long hose rather than adding extensions',
                    },
                    {
                      vi: 'Vệ sinh lưới lọc và ống xả 3–6 tháng/lần',
                      en: 'Clean the filter and drain hose every 3–6 months',
                    },
                  ],
                },
              ],
            },
            {
              title: { vi: 'Mất hiệu suất giặt', en: 'Poor washing performance' },
              blocks: [
                {
                  type: 'list',
                  label: SIGNS,
                  items: [
                    { vi: 'Quần áo không sạch sau khi giặt', en: 'Clothes come out not quite clean' },
                    { vi: 'Mất nhiều thời gian hơn cho một chu trình', en: 'Each cycle takes longer than usual' },
                    { vi: 'Hao nước và điện hơn bình thường', en: 'Higher water and power use than normal' },
                  ],
                },
                {
                  type: 'list',
                  label: CAUSES,
                  items: [
                    {
                      vi: 'Máy không cân bằng, cảm biến tự giảm tốc độ vắt',
                      en: 'The machine is not level, so its sensors cut the spin speed',
                    },
                    {
                      vi: 'Áp lực nước yếu khiến chu trình kéo dài',
                      en: 'Low water pressure stretches out the cycle',
                    },
                    {
                      vi: 'Sai khối lượng giặt: quá tải hoặc quá ít',
                      en: 'The wrong load size: too much or too little',
                    },
                  ],
                },
                {
                  type: 'list',
                  label: FIXES,
                  items: [
                    {
                      vi: 'Cân chỉnh chân máy và vị trí đặt cho cân bằng',
                      en: 'Level the feet and reposition the machine',
                    },
                    {
                      vi: 'Lắp bơm tăng áp nếu nguồn nước nhà yếu',
                      en: 'Fit a booster pump if the household water pressure is low',
                    },
                    {
                      vi: 'Tuân thủ khối lượng giặt khuyến nghị của hãng',
                      en: "Follow the manufacturer's recommended load",
                    },
                  ],
                },
              ],
            },
            {
              title: { vi: 'Mất bảo hành từ hãng', en: "Losing the manufacturer's warranty" },
              blocks: [
                {
                  type: 'list',
                  label: SIGNS,
                  items: [
                    { vi: 'Hãng từ chối bảo hành khi có sự cố', en: 'The brand refuses a warranty claim' },
                    {
                      vi: 'Yêu cầu sửa chữa trả phí dù máy còn trong thời gian bảo hành',
                      en: 'You are asked to pay for repairs while still under warranty',
                    },
                  ],
                },
                {
                  type: 'list',
                  label: CAUSES,
                  items: [
                    {
                      vi: 'Lắp đặt bởi đơn vị không được hãng chứng nhận',
                      en: 'An installer that the brand has not certified',
                    },
                    {
                      vi: 'Tự lắp đặt, không có biên bản nghiệm thu',
                      en: 'A DIY installation with no sign-off record',
                    },
                    { vi: 'Dùng phụ kiện thay thế không chính hãng', en: 'Non-genuine replacement parts' },
                  ],
                },
                {
                  type: 'list',
                  label: FIXES,
                  items: [
                    {
                      vi: 'Chọn đơn vị lắp đặt được hãng ủy quyền hoặc có kinh nghiệm tương đương',
                      en: 'Choose an installer authorised by the brand, or one with equivalent experience',
                    },
                    {
                      vi: 'Yêu cầu biên bản nghiệm thu có chữ ký kỹ thuật viên',
                      en: 'Ask for a sign-off record signed by the technician',
                    },
                    {
                      vi: 'Lưu phiếu bảo hành và hóa đơn trong suốt thời gian bảo hành',
                      en: 'Keep the warranty card and invoice for the whole warranty period',
                    },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  text: {
                    vi: 'Nhiều hãng kiểm tra dấu hiệu lắp đặt không đúng chuẩn để từ chối bảo hành. Tiết kiệm chi phí lắp ban đầu có thể phải trả giá rất đắt sau này.',
                    en: 'Many brands look for signs of a non-standard installation before refusing a claim. Saving on installation up front can cost far more later.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: {
        vi: 'Cách lắp máy giặt đúng: checklist 6 bước',
        en: 'How to install a washing machine correctly: a 6-step checklist',
      },
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Để tránh các rủi ro trên, hãy đảm bảo đội thợ tuân thủ checklist sau:',
            en: 'To avoid all of the risks above, make sure the installation team follows this checklist:',
          },
        },
        {
          type: 'defs',
          ordered: true,
          items: [
            {
              term: { vi: 'Tháo bu-lông vận chuyển', en: 'Remove the transit bolts' },
              text: {
                vi: 'Bước đầu tiên và bắt buộc trước khi cắm điện.',
                en: 'The first, mandatory step before the machine is plugged in.',
              },
            },
            {
              term: { vi: 'Cân bằng máy', en: 'Level the machine' },
              text: {
                vi: 'Dùng thước thủy chỉnh 4 chân máy đến khi hoàn toàn cân bằng.',
                en: 'Adjust all four feet with a spirit level until it is completely level.',
              },
            },
            {
              term: { vi: 'Lắp van cấp nước', en: 'Connect the water inlet valve' },
              text: {
                vi: 'Siết chặt với ron mới, mở van kiểm tra rò rỉ ở áp lực thấp trước.',
                en: 'Tighten it with a new seal, then open the valve at low pressure first to check for leaks.',
              },
            },
            {
              term: { vi: 'Đặt ống xả đúng độ cao và độ dốc', en: 'Set the drain hose height and slope' },
              text: {
                vi: 'Cao 60–90 cm, không gấp khúc, không dài quá 2 m.',
                en: '60–90 cm high, with no kinks and no longer than 2 m.',
              },
            },
            {
              term: { vi: 'Đấu điện an toàn', en: 'Wire it safely' },
              text: {
                vi: 'Ổ cắm riêng, có aptomat, dây tiếp địa đúng chuẩn.',
                en: 'A dedicated socket with a circuit breaker and a proper earth wire.',
              },
            },
            {
              term: { vi: 'Chạy thử và nghiệm thu', en: 'Test run and sign-off' },
              text: {
                vi: 'Giặt thử một chu trình ngắn, kiểm tra rò rỉ, rung, ồn trước khi nghiệm thu.',
                en: 'Run a short cycle and check for leaks, vibration and noise before signing off.',
              },
            },
          ],
        },
        { type: 'claim', id: 'knowledge.washer-install-commitment' },
      ],
    },
    {
      title: { vi: 'Khi nào nên gọi thợ chuyên nghiệp?', en: 'When should you call a professional?' },
      blocks: [
        {
          type: 'list',
          items: [
            {
              vi: 'Máy giặt mới mua từ hãng, cần lắp đúng chuẩn để giữ bảo hành',
              en: 'A brand-new machine that must be installed to standard to keep the warranty',
            },
            {
              vi: 'Chuyển nhà hoặc di dời máy đã sử dụng',
              en: 'Moving house or relocating a machine that is already in use',
            },
            {
              vi: 'Phát hiện rung lắc, rò rỉ, ồn lớn ngay sau khi tự lắp',
              en: 'Vibration, leaks or loud noise right after a DIY installation',
            },
            {
              vi: 'Nâng cấp đường điện hoặc đường nước cho máy giặt',
              en: 'Upgrading the power or water supply for the machine',
            },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Đừng tiết kiệm chi phí lắp đặt để rồi phải trả nhiều hơn cho việc sửa chữa.',
            en: 'Do not cut corners on installation only to pay far more for repairs later.',
          },
        },
      ],
    },
  ],
  editNotes: [
    'Bỏ 3 ảnh: may-giat-detail.png (quảng cáo có logo hãng), may-giat-installation.png (chú thích sai: ảnh gia đình nhưng ghi đội thợ Bluebolt), may-giat-checkup.png (nhân vật 3D, chú thích tự khen).',
    'Cam kết "đúng quy trình của hãng — bảo hành 12 tháng — 24–48 giờ" chuyển thành claim nháp knowledge.washer-install-commitment.',
    '"Trả gấp 5–10 lần" → "trả nhiều hơn" (số không có nguồn); bỏ câu kêu gọi gọi hotline có "đội thợ toàn quốc" (claim phạm vi, thay bằng khối CTA chung).',
    'Chữ VIẾT HOA giữa câu ("TRƯỚC") → chữ đậm.',
    'Gỡ ảnh đầu bài (stock phụ nữ phương Tây) và ảnh máy giặt bốc lửa may-giat-leak.png (lệch art direction, docs/03 mục 11.4).',
  ],
} as const satisfies ArticleContent;
