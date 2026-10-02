import type { ArticleContent, Localized, Step } from './types';

/**
 * Nguồn: https://lapdattoanquoc.vn/news/10-nguyen-nhan-may-lanh-khong-lanh (+ bản /en), tải lại 02/10/2026.
 */
const SIGNS: Localized = { vi: 'Dấu hiệu', en: 'Signs' };
const CAUSES: Localized = { vi: 'Nguyên nhân thường gặp', en: 'Common causes' };
const FIXES: Localized = { vi: 'Cách khắc phục', en: 'How to fix it' };

const details: readonly Step[] = [
  {
    title: { vi: 'Máy lạnh bám bụi, lâu ngày không vệ sinh', en: 'Dust build-up from skipped cleaning' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [
          { vi: 'Gió yếu', en: 'Weak airflow' },
          { vi: 'Làm lạnh chậm', en: 'Slow cooling' },
          { vi: 'Có mùi khó chịu', en: 'An unpleasant smell' },
        ],
      },
      {
        type: 'list',
        label: FIXES,
        items: [
          {
            vi: 'Vệ sinh dàn lạnh, dàn nóng định kỳ (3–6 tháng/lần)',
            en: 'Clean the indoor and outdoor units regularly (every 3–6 months)',
          },
          { vi: 'Làm sạch lưới lọc bụi', en: 'Clean the dust filter' },
        ],
      },
    ],
  },
  {
    title: { vi: 'Thiếu hoặc hết gas', en: 'Low or no refrigerant' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [
          { vi: 'Máy chạy nhưng không mát', en: 'The unit runs but does not cool' },
          { vi: 'Có thể đóng tuyết ở dàn lạnh', en: 'Frost may form on the indoor unit' },
        ],
      },
      {
        type: 'list',
        label: FIXES,
        items: [
          { vi: 'Kiểm tra rò rỉ', en: 'Check for leaks' },
          { vi: 'Nạp gas đúng loại, đúng áp suất', en: 'Recharge with the right refrigerant at the right pressure' },
        ],
      },
    ],
  },
  {
    title: { vi: 'Lắp đặt sai kỹ thuật', en: 'Poor installation' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [
          { vi: 'Máy mới lắp nhưng không lạnh', en: 'A newly installed unit does not cool' },
          { vi: 'Hoạt động không ổn định', en: 'It runs erratically' },
        ],
      },
      {
        type: 'list',
        label: CAUSES,
        items: [
          { vi: 'Không hút chân không', en: 'The lines were never vacuumed' },
          { vi: 'Ống đồng lắp sai tiêu chuẩn', en: 'The copper piping does not meet the standard' },
        ],
      },
      {
        type: 'list',
        label: FIXES,
        items: [
          { vi: 'Kiểm tra lại toàn bộ hệ thống lắp đặt', en: 'Inspect the whole installation again' },
          { vi: 'Sửa theo đúng quy trình kỹ thuật', en: 'Redo the work following the correct procedure' },
        ],
      },
    ],
  },
  {
    title: { vi: 'Block (máy nén) bị lỗi', en: 'A faulty compressor' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [
          { vi: 'Máy không làm lạnh', en: 'No cooling at all' },
          { vi: 'Có tiếng kêu lạ', en: 'Unusual noises' },
        ],
      },
      {
        type: 'list',
        label: FIXES,
        items: [{ vi: 'Kiểm tra và sửa chữa hoặc thay block', en: 'Inspect and repair or replace the compressor' }],
      },
      {
        type: 'callout',
        tone: 'warning',
        text: {
          vi: 'Lỗi block cần kỹ thuật viên chuyên môn xử lý.',
          en: 'A compressor fault needs a qualified technician.',
        },
      },
    ],
  },
  {
    title: { vi: 'Quạt dàn nóng hoặc dàn lạnh bị hỏng', en: 'A failed indoor or outdoor fan' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [
          {
            vi: 'Máy chạy nhưng không có gió hoặc gió yếu',
            en: 'The unit runs but there is no airflow, or only a weak one',
          },
        ],
      },
      {
        type: 'list',
        label: FIXES,
        items: [
          { vi: 'Sửa hoặc thay quạt', en: 'Repair or replace the fan' },
          { vi: 'Kiểm tra tụ điện quạt', en: 'Check the fan capacitor' },
        ],
      },
    ],
  },
  {
    title: { vi: 'Tụ điện yếu hoặc hỏng', en: 'A weak or failed capacitor' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [
          { vi: 'Máy chạy chập chờn', en: 'The unit runs intermittently' },
          { vi: 'Không khởi động được block', en: 'The compressor will not start' },
        ],
      },
      {
        type: 'list',
        label: FIXES,
        items: [{ vi: 'Thay tụ điện mới đúng thông số', en: 'Fit a new capacitor with the correct rating' }],
      },
    ],
  },
  {
    title: { vi: 'Ống đồng bị rò rỉ hoặc nghẹt', en: 'Leaking or blocked copper piping' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [{ vi: 'Làm lạnh yếu dần theo thời gian', en: 'Cooling gets weaker over time' }],
      },
      {
        type: 'list',
        label: FIXES,
        items: [
          { vi: 'Kiểm tra đường ống', en: 'Inspect the piping' },
          { vi: 'Hàn lại chỗ rò hoặc thay ống', en: 'Re-braze the leak or replace the pipe' },
        ],
      },
    ],
  },
  {
    title: { vi: 'Cài đặt nhiệt độ sai', en: 'The wrong temperature setting' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [{ vi: 'Máy vẫn chạy nhưng không đủ lạnh', en: 'The unit runs but never gets cool enough' }],
      },
      {
        type: 'list',
        label: FIXES,
        items: [
          { vi: 'Điều chỉnh nhiệt độ phù hợp (25–27 °C)', en: 'Set a sensible temperature (25–27 °C)' },
          { vi: 'Chọn đúng chế độ làm lạnh (Cool)', en: 'Select the Cool mode' },
        ],
      },
    ],
  },
  {
    title: { vi: 'Nguồn điện không ổn định', en: 'An unstable power supply' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [
          { vi: 'Máy hoạt động yếu', en: 'The unit runs weakly' },
          { vi: 'Tự ngắt liên tục', en: 'It keeps cutting out' },
        ],
      },
      {
        type: 'list',
        label: FIXES,
        items: [
          { vi: 'Kiểm tra nguồn điện', en: 'Check the power supply' },
          { vi: 'Sử dụng ổn áp nếu cần', en: 'Use a voltage stabiliser if needed' },
        ],
      },
    ],
  },
  {
    title: { vi: 'Máy quá công suất hoặc phòng không kín', en: 'An undersized unit or a poorly sealed room' },
    blocks: [
      {
        type: 'list',
        label: SIGNS,
        items: [
          { vi: 'Máy chạy liên tục nhưng không mát', en: 'The unit runs non-stop but the room stays warm' },
        ],
      },
      {
        type: 'list',
        label: CAUSES,
        items: [
          { vi: 'Phòng quá lớn', en: 'The room is too large for the unit' },
          {
            vi: 'Thoát nhiệt nhiều (cửa mở, ánh nắng trực tiếp)',
            en: 'Too much heat gets in (open doors, direct sunlight)',
          },
        ],
      },
      {
        type: 'list',
        label: FIXES,
        items: [
          { vi: 'Chọn máy đúng công suất', en: 'Choose a unit with the right capacity' },
          { vi: 'Che chắn, cách nhiệt tốt hơn', en: 'Improve shading and insulation' },
        ],
      },
    ],
  },
];

export const nguyenNhanMayLanhKhongLanh = {
  key: '10-nguyen-nhan-may-lanh-khong-lanh',
  seoTitle: {
    vi: 'Máy lạnh không lạnh: 10 nguyên nhân và cách khắc phục',
    en: 'Air conditioner not cooling? 10 causes and fixes',
  },
  description: {
    vi: 'Máy lạnh chạy mà không mát có thể do bụi bẩn, thiếu gas, block, tụ điện hay lắp sai kỹ thuật. Tổng hợp 10 nguyên nhân thường gặp và cách khắc phục.',
    en: 'An AC that runs but will not cool may have dirty filters, low refrigerant, a weak capacitor or a poor install. Ten common causes and how to fix them.',
  },
  lead: {
    vi: 'Xác định đúng nguyên nhân giúp tiết kiệm chi phí sửa chữa và tránh hỏng hóc nghiêm trọng — từ bụi bẩn, hết gas đến block lỗi.',
    en: 'Finding the real cause saves on repair costs and prevents serious damage — from dust and low refrigerant to a failing compressor.',
  },
  publishedAt: '2026-04-05',
  updatedAt: '2026-10-02',
  hero: null,
  ogImage: null,
  intro: [
    {
      type: 'p',
      text: {
        vi: 'Máy lạnh không lạnh là tình trạng rất phổ biến, đặc biệt trong mùa nóng cao điểm. Nhiều người nghĩ do hết gas, nhưng thực tế có rất nhiều nguyên nhân khác nhau. Việc xác định đúng nguyên nhân sẽ giúp bạn tiết kiệm chi phí sửa chữa và tránh hỏng hóc nghiêm trọng.',
        en: 'An air conditioner that will not cool is a very common problem, especially at the height of the hot season. Many people assume it has run out of refrigerant, but there are plenty of other causes. Pinning down the right one saves you money and prevents more serious damage.',
      },
    },
    {
      type: 'figure',
      image: {
        src: '/images/news/nguyen-nhan-may-lanh.png',
        width: 512,
        height: 341,
        alt: {
          vi: 'Infographic 10 nguyên nhân và cách khắc phục máy lạnh không lạnh',
          en: 'Infographic of 10 reasons an air conditioner stops cooling',
        },
        locales: ['vi'],
        fit: 'contain',
      },
      caption: {
        vi: 'Máy hoạt động nhưng không lạnh — có thể do bụi, gas, block hoặc lắp sai kỹ thuật',
        en: 'The unit runs but does not cool — dust, refrigerant, the compressor or a poor install may be to blame',
      },
    },
    {
      type: 'p',
      text: {
        vi: 'Dưới đây là 10 nguyên nhân thường gặp và cách khắc phục hiệu quả.',
        en: 'Here are the 10 most common causes and how to fix each one.',
      },
    },
  ],
  sections: [
    {
      title: { vi: 'Tổng quan nhanh 10 nguyên nhân', en: 'The 10 causes at a glance' },
      blocks: [
        {
          type: 'defs',
          ordered: true,
          items: [
            {
              term: { vi: 'Bám bụi dàn lạnh và lưới lọc', en: 'Dust on the indoor coil and filter' },
              text: {
                vi: 'Nguyên nhân phổ biến nhất. Vệ sinh lưới lọc 2 tuần/lần, vệ sinh tổng thể 6 tháng/lần.',
                en: 'The most common cause. Clean the filter every 2 weeks and give the unit a full clean every 6 months.',
              },
            },
            {
              term: { vi: 'Thiếu gas', en: 'Low refrigerant' },
              text: {
                vi: 'Sau 2–3 năm sử dụng hoặc sau khi tháo lắp, áp gas có thể giảm. Cần thợ đo áp và nạp bù.',
                en: 'After 2–3 years of use, or after the unit has been moved, refrigerant pressure can drop. A technician needs to measure it and top it up.',
              },
            },
            {
              term: { vi: 'Lắp sai kỹ thuật', en: 'Poor installation' },
              text: {
                vi: 'Ống đồng quá dài, gấp khúc nhiều, không hút chân không kỹ gây tổn thất gas và giảm hiệu suất.',
                en: 'Piping that is too long or bent too often, or lines that were not properly vacuumed, lose refrigerant and efficiency.',
              },
            },
            {
              term: { vi: 'Block (máy nén) hỏng', en: 'A failed compressor' },
              text: {
                vi: 'Block là “trái tim” của máy lạnh. Khi hỏng, máy vẫn chạy quạt nhưng không lạnh. Chi phí thay thường bằng 30–60% giá máy mới.',
                en: 'The compressor is the heart of the system. When it fails, the fan still runs but nothing cools. Replacing it typically costs 30–60% of a new unit.',
              },
            },
            {
              term: { vi: 'Quạt dàn nóng hoặc dàn lạnh bị lỗi', en: 'A faulty indoor or outdoor fan' },
              text: {
                vi: 'Quạt yếu hoặc dừng thì không tản nhiệt được, block không nén được gas nên máy không lạnh.',
                en: 'A weak or stalled fan cannot shed heat, so the compressor cannot do its job and the unit stops cooling.',
              },
            },
            {
              term: { vi: 'Tụ điện yếu', en: 'A weak capacitor' },
              text: {
                vi: 'Linh kiện rẻ nhưng quan trọng. Tụ yếu khiến block khởi động chậm hoặc không khởi động.',
                en: 'A cheap but important part. A weak capacitor makes the compressor slow to start, or stops it starting at all.',
              },
            },
            {
              term: { vi: 'Ống đồng bị rò rỉ', en: 'A leaking copper pipe' },
              text: {
                vi: 'Rò ở mối nối hoặc do chuột cắn. Gas thoát hết thì máy chỉ còn chạy quạt.',
                en: 'Leaks at the joints or damage from rodents let the refrigerant escape, leaving only the fan running.',
              },
            },
            {
              term: { vi: 'Cài đặt sai chế độ', en: 'The wrong mode' },
              text: {
                vi: 'Đôi khi máy đang ở chế độ Fan hoặc Dry thay vì Cool. Kiểm tra remote trước khi gọi thợ.',
                en: 'Sometimes the unit is simply set to Fan or Dry instead of Cool. Check the remote before calling a technician.',
              },
            },
            {
              term: { vi: 'Điện áp không ổn định', en: 'Unstable voltage' },
              text: {
                vi: 'Điện yếu (dưới 200 V) hoặc dao động liên tục khiến block hoạt động kém hoặc không khởi động.',
                en: 'Low voltage (under 200 V) or constant fluctuation makes the compressor underperform or fail to start.',
              },
            },
            {
              term: { vi: 'Công suất không phù hợp diện tích', en: 'Capacity that does not match the room' },
              text: {
                vi: 'Phòng 25 m² mà lắp máy 9.000 BTU thì không bao giờ đạt nhiệt độ mong muốn. Nên chọn công suất theo công thức khoảng 600 BTU cho mỗi m².',
                en: 'A 9,000 BTU unit in a 25 m² room will never reach the set temperature. Size the unit at roughly 600 BTU per square metre.',
              },
            },
          ],
        },
      ],
    },
    {
      title: { vi: 'Dấu hiệu và cách khắc phục từng nguyên nhân', en: 'Signs and fixes for each cause' },
      blocks: [
        { type: 'steps', items: details },
        {
          type: 'p',
          text: {
            vi: 'Máy lạnh không lạnh không phải lúc nào cũng do lỗi nặng. Nhiều trường hợp chỉ cần vệ sinh hoặc điều chỉnh đơn giản là có thể khắc phục.',
            en: 'An air conditioner that will not cool does not always mean a serious fault. In many cases a clean or a simple adjustment is enough.',
          },
        },
      ],
    },
    {
      title: { vi: 'Bluebolt Services cung cấp dịch vụ', en: 'Services from Bluebolt Services' },
      gate: 'knowledge.b2c-ac-care-services',
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Đặt lịch nhanh, có thợ gần bạn, giá minh bạch.',
            en: 'Quick booking, a technician near you and transparent pricing.',
          },
        },
      ],
    },
  ],
  editNotes: [
    'Bỏ "chiếm 40% số ca không lạnh" (số không có nguồn) → "nguyên nhân phổ biến nhất".',
    'Bỏ mũi tên "→" trong câu, thay bằng câu đầy đủ; tiêu đề chi tiết viết lại sentence case.',
    'Mục dịch vụ cho khách lẻ gắn claim knowledge.b2c-ac-care-services (nhánh A chưa nhận đơn B2C trực tiếp): production ẩn cả mục.',
    'Ảnh hero cũ (dàn nóng có logo hãng trên mái nhà) không dùng; dùng khung giữ chỗ. Infographic có chữ tiếng Việt chỉ hiện ở bản VI.',
  ],
} as const satisfies ArticleContent;
