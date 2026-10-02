import type { ArticleContent } from './types';

/**
 * GỘP 2 bài robot đang tranh từ khóa (docs/03 mục 10.3 dòng 15–16, CRO-14):
 *   - https://lapdattoanquoc.vn/news/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai (bài giữ URL, đăng 22/04/2026)
 *   - https://lapdattoanquoc.vn/news/robot-va-tu-dong-hoa-gia-dinh (301 về đây, đăng 18/04/2026)
 * Mỗi mục ghi nguồn: [A] = bài giữ lại, [B] = bài gộp vào.
 */
export const robotTuDongHoaGiaDinh = {
  key: 'robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai',
  seoTitle: {
    vi: 'Robot và tự động hóa trong gia đình | Bluebolt Services',
    en: 'Home robots and automation: a new household trend',
  },
  description: {
    vi: 'Robot hút bụi, đèn cảm biến, camera AI và nhà thông minh: công nghệ nền tảng, lợi ích, thách thức khi lắp đặt và xu hướng tự động hóa trong gia đình.',
    en: 'Robot vacuums, sensor lighting, AI cameras and smart homes: the core technology, the benefits, the set-up challenges and where home automation is heading.',
  },
  lead: {
    vi: 'AI và IoT đang định hình lại không gian sống, từ robot lau nhà, đèn cảm biến đến hệ thống an ninh tự động. Một thế hệ thiết bị thông minh có thể vận hành độc lập và thích nghi với thói quen người dùng.',
    en: 'AI and the Internet of Things are reshaping the home, from robot mops and sensor lighting to automated security. A new generation of smart devices can run on their own and adapt to the way you live.',
  },
  publishedAt: '2026-04-22',
  updatedAt: '2026-10-02',
  hero: {
    src: '/images/news/smart-device.png',
    width: 1920,
    height: 1280,
    alt: {
      vi: 'Tay cầm điện thoại điều khiển đèn, quạt, nhiệt độ của căn bếp thông minh',
      en: 'A hand holding a phone that controls the lights, fan and temperature in a smart kitchen',
    },
  },
  ogImage: {
    src: '/images/news/og/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai.jpg',
    width: 1200,
    height: 630,
  },
  intro: [],
  sections: [
    {
      // [A]
      title: {
        vi: 'Khi công nghệ bước vào từng góc nhỏ của cuộc sống',
        en: 'When technology reaches every corner of the home',
      },
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Không còn là hình ảnh trong các bộ phim khoa học viễn tưởng, robot và công nghệ tự động hóa đang dần trở thành một phần quen thuộc trong các gia đình hiện đại. Từ việc lau dọn nhà cửa, kiểm soát thiết bị điện đến hỗ trợ an ninh, các giải pháp này đang thay đổi cách con người sống và quản lý không gian sống của mình.',
            en: 'No longer the stuff of science fiction, robots and home automation are becoming a familiar part of modern households. From cleaning floors and controlling appliances to home security, they are changing the way people live and run their homes.',
          },
        },
        {
          type: 'p',
          text: {
            vi: 'Sự phát triển mạnh mẽ của trí tuệ nhân tạo (AI) và Internet vạn vật (IoT) đã tạo nền tảng cho một thế hệ thiết bị gia dụng thông minh, có khả năng vận hành độc lập và thích nghi với thói quen của người dùng.',
            en: "Rapid progress in artificial intelligence (AI) and the Internet of Things (IoT) has laid the groundwork for a generation of smart appliances that can work independently and learn their owners' habits.",
          },
        },
        {
          type: 'gallery',
          items: [
            {
              image: {
                src: '/images/news/smart-tv.png',
                width: 1920,
                height: 810,
                alt: { vi: 'Smart TV đặt trên kệ trong phòng khách', en: 'A smart TV on a low cabinet in a living room' },
              },
              label: { vi: 'Smart TV', en: 'Smart TV' },
            },
            {
              image: {
                src: '/images/news/smart-plug.png',
                width: 800,
                height: 800,
                alt: { vi: 'Ổ cắm thông minh gắn tường và đặt bàn', en: 'Wall-mounted and desktop smart power strips' },
              },
              label: { vi: 'Ổ cắm thông minh', en: 'Smart plug' },
            },
          ],
          caption: {
            vi: 'Hệ sinh thái nhà thông minh: robot hút bụi, smart TV, camera AI, ổ cắm thông minh, cảm biến nhiệt IoT, thiết bị gia dụng kết nối… đều có thể đồng bộ trong cùng một ngôi nhà',
            en: 'The smart home ecosystem: robot vacuums, smart TVs, AI cameras, smart plugs, IoT temperature sensors and connected appliances can all work together in one home',
          },
        },
      ],
    },
    {
      // [A]
      title: {
        vi: '1. AI và IoT: nền tảng của thiết bị gia dụng thế hệ mới',
        en: '1. AI and IoT: the foundation of the new generation of appliances',
      },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Hai công nghệ cốt lõi đang thúc đẩy làn sóng tự động hóa gia đình',
            en: 'Two core technologies are driving the wave of home automation',
          },
          items: [
            {
              vi: '**Trí tuệ nhân tạo (AI):** cho phép thiết bị học thói quen người dùng, tự đưa ra quyết định và liên tục cải thiện theo thời gian.',
              en: '**Artificial intelligence (AI):** lets devices learn your habits, make decisions on their own and keep improving over time.',
            },
            {
              vi: '**Internet vạn vật (IoT):** kết nối các thiết bị rời rạc thành một hệ sinh thái, điều khiển từ xa qua điện thoại, đồng bộ trạng thái theo thời gian thực.',
              en: '**Internet of Things (IoT):** links separate devices into one ecosystem, with remote control from your phone and real-time status.',
            },
            {
              vi: '**Cảm biến thông minh:** đo nhiệt độ, độ ẩm, ánh sáng, chuyển động… để kích hoạt hành động phù hợp mà không cần con người can thiệp.',
              en: '**Smart sensors:** measure temperature, humidity, light and motion, and trigger the right action without anyone stepping in.',
            },
          ],
        },
      ],
    },
    {
      // [B] mục 1
      title: { vi: '2. Robot hút bụi: từ tiện ích đến thiết yếu', en: '2. Robot vacuums: from gadget to essential' },
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Trong số các thiết bị tự động, robot hút bụi là sản phẩm phổ biến nhất hiện nay, với sự tham gia của nhiều thương hiệu lớn.',
            en: 'Among automated home devices, the robot vacuum is the most popular today, with many major brands in the market.',
          },
        },
        {
          type: 'list',
          label: {
            vi: 'Không chỉ hút bụi, các dòng robot thế hệ mới còn có thể',
            en: 'Beyond vacuuming, the latest models can also',
          },
          items: [
            { vi: 'Tự động lập bản đồ không gian', en: 'Map the home automatically' },
            { vi: 'Lau nhà kết hợp', en: 'Mop in the same pass' },
            { vi: 'Tránh vật cản bằng AI', en: 'Avoid obstacles using AI' },
            { vi: 'Tự quay về trạm sạc và đổ rác', en: 'Return to the dock to recharge and empty the bin' },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Điều đáng chú ý là người dùng ngày càng xem robot hút bụi không còn là thiết bị “cao cấp” mà là công cụ thiết yếu giúp tiết kiệm thời gian và công sức.',
            en: 'Notably, people increasingly see a robot vacuum not as a premium gadget but as an everyday tool that saves time and effort.',
          },
        },
      ],
    },
    {
      // [A] mục 2 + [B] mục 2
      title: { vi: '3. Những lĩnh vực đang được tự động hóa', en: '3. What is being automated' },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Tự động hóa gia đình đã len lỏi vào hầu hết các nhu cầu cơ bản',
            en: 'Home automation now reaches almost every basic need',
          },
          items: [
            {
              vi: '**Vệ sinh:** robot hút bụi, robot lau nhà, máy lọc không khí tự động.',
              en: '**Cleaning:** robot vacuums, robot mops and automatic air purifiers.',
            },
            {
              vi: '**Tiện ích:** đèn cảm biến chuyển động, rèm cửa đóng mở theo ánh sáng, ổ cắm điều khiển từ xa.',
              en: '**Convenience:** motion-sensor lighting, curtains that open and close with daylight, remote-controlled sockets.',
            },
            {
              vi: '**Khí hậu:** điều hòa kết nối Wi-Fi tự điều chỉnh nhiệt độ theo thời gian thực, máy tạo ẩm, quạt thông minh.',
              en: '**Climate:** Wi-Fi air conditioners that adjust temperature in real time, humidifiers and smart fans.',
            },
            {
              vi: '**An ninh:** camera AI nhận diện khuôn mặt, khóa cửa thông minh, chuông cửa có hình.',
              en: '**Security:** AI cameras with face recognition, smart locks and video doorbells.',
            },
            {
              vi: '**Giải trí:** smart TV, loa AI, hệ thống âm thanh đa phòng đồng bộ.',
              en: '**Entertainment:** smart TVs, AI speakers and synchronised multi-room audio.',
            },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Các thiết bị này có thể kết nối và vận hành đồng bộ trong một hệ sinh thái chung, thường được gọi là “smart home”.',
            en: 'These devices can connect and work together in one shared ecosystem, usually called a smart home.',
          },
        },
      ],
    },
    {
      // [B] mục 3
      title: {
        vi: '4. Thị trường tăng trưởng nhanh, nhu cầu ngày càng rõ rệt',
        en: '4. A fast-growing market with clear demand',
      },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Theo nhiều đánh giá, thị trường thiết bị gia đình thông minh tại Việt Nam đang tăng trưởng nhanh, nhờ',
            en: "By many accounts, Vietnam's smart home market is growing fast, driven by",
          },
          items: [
            {
              vi: '**Thu nhập tăng:** tầng lớp trung lưu mở rộng, sẵn sàng chi cho thiết bị tiện lợi.',
              en: '**Rising incomes:** a growing middle class that is willing to spend on convenience.',
            },
            {
              vi: '**Giá thiết bị dễ tiếp cận:** robot hút bụi từ 5–7 triệu đồng đã cho trải nghiệm tốt.',
              en: '**More affordable devices:** robot vacuums from around VND 5–7 million already work well.',
            },
            {
              vi: '**Nhận thức cải thiện:** người dùng hiểu rõ hơn lợi ích và cách khai thác công nghệ.',
              en: '**Better awareness:** people understand the benefits and how to get the most from the technology.',
            },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Với nhịp sống đô thị bận rộn, nhu cầu “giải phóng sức lao động trong gia đình” ngày càng rõ ràng.',
            en: 'With busy city lives, the wish to free people from household chores is clearer than ever.',
          },
        },
      ],
    },
    {
      // [A] mục 3
      title: { vi: '5. Lợi ích thực tế cho người dùng', en: '5. Real benefits for users' },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Khi vận hành đúng cách, hệ thống tự động hóa mang lại nhiều giá trị rõ ràng',
            en: 'Set up properly, an automated home delivers clear value',
          },
          items: [
            { vi: 'Tiết kiệm thời gian, giảm việc nhà lặp lại hằng ngày', en: 'Less time spent on repetitive daily chores' },
            {
              vi: 'Tiết kiệm điện năng nhờ thiết bị tự tắt khi không cần thiết',
              en: 'Lower power use, as devices switch off when they are not needed',
            },
            {
              vi: 'Tăng tính an toàn cho gia đình, đặc biệt khi vắng nhà',
              en: 'A safer home, especially when nobody is in',
            },
            {
              vi: 'Trải nghiệm sống tiện nghi, hiện đại và cá nhân hóa',
              en: 'A more comfortable, modern and personal way of living',
            },
          ],
        },
        {
          type: 'quote',
          text: {
            vi: 'Một ngôi nhà thông minh tốt là ngôi nhà mà người dùng gần như “không phải nghĩ đến nó”: mọi thứ tự vận hành đúng lúc, đúng việc.',
            en: 'A good smart home is one you hardly have to think about: everything happens at the right time, in the right way.',
          },
        },
        {
          type: 'figure',
          image: {
            src: '/images/news/robot-4.png',
            width: 626,
            height: 351,
            alt: {
              vi: 'Robot hình người chuẩn bị rau củ trên bàn bếp',
              en: 'A humanoid robot preparing vegetables on a kitchen counter',
            },
          },
          caption: {
            vi: 'Người dùng dành thời gian cho gia đình thay vì xử lý việc nhà — đó là giá trị thật mà tự động hóa mang lại',
            en: 'Time spent with family instead of on chores — that is the real value of automation',
          },
        },
      ],
    },
    {
      // [A] mục 4 + [B] mục 4
      title: {
        vi: '6. Thách thức: không chỉ là thiết bị mà là hệ thống',
        en: '6. The challenge: it is a system, not just devices',
      },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Dù tiềm năng lớn, người dùng vẫn cần lưu ý vài điểm khi triển khai',
            en: 'For all the potential, there are a few things to consider before you start',
          },
          items: [
            {
              vi: '**Khả năng tương thích:** thiết bị từ các hãng khác nhau không phải lúc nào cũng “nói chung một ngôn ngữ”. Cần chọn hệ sinh thái phù hợp ngay từ đầu.',
              en: '**Compatibility:** devices from different brands do not always speak the same language, so choose your ecosystem from the start.',
            },
            {
              vi: '**Kỹ năng cài đặt:** lắp đặt và cấu hình ban đầu đòi hỏi hiểu biết kỹ thuật nhất định, là rào cản với nhiều gia đình.',
              en: '**Set-up skills:** installing and configuring everything takes some technical know-how, which holds many households back.',
            },
            {
              vi: '**Bảo mật dữ liệu:** camera, micro và cảm biến luôn bật cần được bảo vệ trước nguy cơ rò rỉ thông tin cá nhân.',
              en: '**Data security:** always-on cameras, microphones and sensors must be protected against personal data leaks.',
            },
            {
              vi: '**Chi phí dài hạn:** ngoài giá mua thiết bị, cần tính cả chi phí điện, internet và bảo trì định kỳ.',
              en: '**Running costs:** beyond the purchase price, factor in electricity, internet and regular maintenance.',
            },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Lắp đặt chưa đúng chuẩn cũng dẫn đến lỗi vận hành. Vì vậy, vai trò của các đơn vị lắp đặt và tích hợp hệ thống ngày càng quan trọng.',
            en: 'A substandard installation also leads to faults, which is why installation and system integration partners matter more and more.',
          },
        },
      ],
    },
    {
      // [A] mục 5 + [B] mục 5
      title: {
        vi: '7. Tương lai gần: không gian sống tự thích nghi',
        en: '7. The near future: a home that adapts to you',
      },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Trong vài năm tới, các ngôi nhà sẽ không chỉ “thông minh” mà còn “hiểu chuyện”',
            en: 'In the next few years, homes will be not only smart but genuinely understanding',
          },
          items: [
            {
              vi: 'Thiết bị tự nhận biết bạn vừa về đến cổng để bật điều hòa, đèn, nhạc',
              en: 'Devices that know you have reached the gate and switch on the air conditioning, lights and music',
            },
            {
              vi: 'Hệ thống tự đề xuất tiết kiệm điện theo lịch sinh hoạt thực tế',
              en: 'Systems that suggest energy savings based on your actual routine',
            },
            {
              vi: 'AI nhắc lịch bảo trì máy móc trước khi hỏng hóc xảy ra',
              en: 'AI that schedules maintenance before anything breaks',
            },
            { vi: 'Robot dọn dẹp mỗi ngày', en: 'Robots that clean every day' },
            { vi: 'Thiết bị phối hợp theo “kịch bản sống”', en: 'Devices that work together around daily routines' },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Con người dần chuyển từ vai trò “người vận hành” sang “người thiết kế trải nghiệm”: chỉ cần xác định mong muốn, hệ thống tự lo phần còn lại.',
            en: 'People are shifting from operating their devices to designing how they want to live: say what you want, and the system takes care of the rest.',
          },
        },
        {
          type: 'figure',
          image: {
            src: '/images/news/robot-10.png',
            width: 1368,
            height: 1026,
            alt: {
              vi: 'Robot hình người dùng máy hút bụi trong phòng ngủ',
              en: 'A humanoid robot vacuuming a bedroom',
            },
          },
          caption: {
            vi: 'Ngôi nhà của tương lai gần tự thích nghi theo lịch sinh hoạt của chủ nhân',
            en: "The home of the near future adapts to its owners' routine",
          },
        },
      ],
    },
    {
      // [B] Tổng kết
      title: { vi: 'Tổng kết', en: 'In summary' },
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Robot và tự động hóa không còn là xu hướng xa vời mà đang dần trở thành tiêu chuẩn mới trong các gia đình hiện đại.',
            en: 'Robots and automation are no longer a distant trend; they are becoming the new standard in modern homes.',
          },
        },
        {
          type: 'p',
          text: {
            vi: 'Sự khác biệt không nằm ở việc có dùng công nghệ hay không, mà ở cách mỗi gia đình ứng dụng công nghệ để nâng cao chất lượng cuộc sống.',
            en: 'The difference is not whether a family uses technology, but how it uses it to improve everyday life.',
          },
        },
      ],
    },
    {
      // [A] + [B] "Vai trò của Bluebolt Services"
      title: { vi: 'Vai trò của Bluebolt Services', en: 'Where Bluebolt Services fits in' },
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Bluebolt Services không chỉ lắp đặt máy lạnh mà còn hỗ trợ tư vấn, lắp đặt và cấu hình thiết bị nhà thông minh như robot hút bụi, smart TV, camera, ổ cắm thông minh.',
            en: 'Bluebolt Services installs more than air conditioners: it also advises on, installs and configures smart home devices such as robot vacuums, smart TVs, cameras and smart plugs.',
          },
        },
        { type: 'claim', id: 'knowledge.single-point-of-contact' },
      ],
    },
  ],
  editNotes: [
    'Gộp bài robot-va-tu-dong-hoa-gia-dinh vào bài này; các ý trùng (thách thức, tương lai) gộp thành một mục.',
    'Bỏ tên hãng robot hút bụi (Xiaomi, iRobot, Ecovacs) → "nhiều thương hiệu lớn"; "tăng trưởng hai chữ số mỗi năm" → "tăng trưởng nhanh" (không có nguồn).',
    'Bỏ ảnh có logo/watermark hãng (robot hút bụi DEEBOT, camera Viettel, cảm biến E-TEK, robot LG) và ảnh robot giống sản phẩm nhận diện được; bỏ ảnh 3D robot-vacuum-broom.png (thuộc bộ icon dịch vụ).',
    'og:image cũ (tháp viễn thông em-telco..., ảnh gia đình phương Tây + robot) không dùng; 301 sang ảnh OG mới (content/redirects.ts → legacyAssets).',
    '"Một thợ — nhiều thiết bị — một điểm liên hệ" chuyển thành claim nháp knowledge.single-point-of-contact; bỏ "đồng hành cùng các gia đình Việt" (B2C nhánh A).',
  ],
} as const satisfies ArticleContent;
