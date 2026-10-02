# 03 — Định hướng thiết kế lại lapdattoanquoc.vn: "Bluebolt Cinematic"

> Dự án: website Bluebolt Services (CÔNG TY CỔ PHẦN CÔNG NGHỆ TIA CHỚP XANH)
> Người đọc: anh Duy (quyết định) · dev vận hành Claude Code (thực thi)
> Ngày: 01/10/2026 · Phiên bản: **v2.1 — hướng điện ảnh, sau vòng phản biện** (thay bản v1 "giống site mẫu") · Trạng thái: **ĐỀ XUẤT, chưa duyệt**
> Kế hoạch thực thi, giờ, lịch, NFR chốt: `04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md`. Chỗ nào hai tài liệu khác nhau thì theo `04`.
> Mọi đường dẫn bằng chứng tính từ `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/`.

---

## 0. Tóm tắt trong 1 phút

- **Anh đã làm rõ: thứ anh thích là cái video quảng cáo, không phải site mddecorpro.com.** Vì vậy em bỏ hướng "ảnh render lớn + 2.5D giống site nội thất". Em lấy **ngôn ngữ máy quay** của video làm xương sống: góc nhìn người đang ngồi (POV) trong phòng sáng ban ngày, máy vòng từ chéo về chính diện và tiến lại, **phòng tối dần khi màn hình chiếm khung**, rồi **máy giữ khung cho website cuộn trên màn hình** (mục 2.1).
- **Big idea: "Mỗi lần cuộn là một cú máy."** **Khuyến nghị A+ (sát video nhất):** một cú máy tiến vào màn hình điều phối, giữ khung cho website cuộn, rồi chuyển giao sang trang thật. Bản đồ 34 tỉnh nằm ở section HTML ngay sau. B (thêm cú `crane` xuống bản đồ) và C (6 shot kể trọn một đơn: điều phối → bản đồ → nhà khách → máy lạnh → nghiệm thu → đối soát, mục 4) là **phần em mở rộng, không có trong video**. Các cú máy của C vẫn dùng làm hero trang con (mục 7.5).
- **Nền tảng được trình diễn ngay trong cảnh** (dashboard của Hãng trên laptop, app thợ trên điện thoại, báo cáo đối soát). Đây là chất "Services, quốc tế" mà site hiện tại thiếu (mục 5).
- **Kỹ thuật lai, HTML luôn là nội dung chính:**
  - Desktop đủ GPU: một canvas WebGL dùng chung cho chuỗi shot đầu trang.
  - Mobile: **video dựng sẵn từ chính cảnh đó**, cuộn để tua (chuỗi ảnh là dự phòng).
  - Desktop không đủ GPU, reduced-motion: ảnh tĩnh.
  - Trang con: mỗi trang tối đa một shot ngắn ở hero, phần còn lại là motion 2.5D (mục 7).
- **Chọn bằng mắt trước khi build:** ba prototype **A+ (khuyến nghị), B, Q (quay thật phòng điều phối)** (mục 9). Prototype hướng A đã dựng xong (`prototype/demo-desktop.mp4`, `prototype/shots/sheet.jpg`); vòng phản biện chỉ ra các điểm phải sửa để thành A+ (`04` mục 1.1).
- **Giữ nguyên từ bản v1:** định vị, sitemap, bảng 301, design tokens (cách giải tương phản cam), typography, quy trình 5 bước, bộ KPI, danh sách nội dung cần anh cung cấp.
- **Giờ build và lịch dự án là hai chuyện khác nhau** (số chốt ở `04` mục 5):
  - Claude Code: A+ khoảng **271 giờ**, B khoảng 281, C khoảng 295, Q khoảng 244, đã gồm G0, contract, form, QA và launch. Số 110–150 giờ ở bản đầu tài liệu này chỉ tính phần phim và trang tĩnh.
  - Việc người khoảng **208 giờ** (gồm ~80 giờ dev vận hành Claude Code), cộng 50–80 giờ 3D artist (không cần nếu chọn Q).
  - Lịch khoảng **10 tuần tới launch (~10/12/2026)**. Đường găng nằm ở phần việc người.

---

## 1. Định vị và thông điệp

### 1.1 Bluebolt Services là ai (một câu)

**Mạng lưới lắp đặt và bảo hành last-mile tại 34 tỉnh/thành, làm theo chuẩn hãng, cho Hãng điện máy và Sàn TMĐT/bán lẻ.** Nền tảng điều phối giúp đơn đi từ hãng tới thợ rồi tới nghiệm thu và đối soát một cách minh bạch.

Cơ sở:
- Chính sách hiện hành ghi rõ đơn đến từ Hãng/Sàn, khách trả vật tư tại chỗ cho thợ, BBSV không xuất hóa đơn vật tư (`research/agent-notes/content-cro/policy-vi-parts.json`, Phần 2).
- Benchmark gần nhất là nhóm last-mile installer cho hãng/retailer: HelloTech Partnerships, InstallerNet, Field Nation. Không nên so với app B2C như bTaskee hay Vua Thợ (research:benchmark, positioning_insight).
- Theo 8 site trong nước đã khảo sát, chưa ai trình bày rõ mô hình "mạng lưới lắp đặt white-label cho hãng và sàn". Khoảng trống này chưa được xác minh đầy đủ vì chưa khảo sát đối thủ B2B trực tiếp (critic: gaps).

### 1.2 Ba nhóm khách, ba cửa vào

| Nhóm | Họ cần thấy gì trong 5 giây | CTA chính | Ưu tiên |
|---|---|---|---|
| **Hãng & Sàn** (B2B, khách trả tiền) | Phủ 34 tỉnh, SLA đo được, đối soát/VAT, bằng chứng (logo, case study) | **Nhận báo giá / Đặt lịch demo 30 phút** | P0 |
| **Thợ kỹ thuật** (nguồn cung) | Thu nhập tham khảo, cách nhận tiền, đơn ổn định, đăng ký 4 trường | **Đăng ký làm đối tác thợ** | P0 |
| **Khách lẻ** (người dùng cuối của Hãng/Sàn) | Gọi ai, bảo hành bao lâu, tra cứu đơn | **Gọi / Zalo · Đăng ký bảo hành** | P1 |

### 1.3 Vai trò B2C: *giả định, chờ anh xác nhận*

Câu hỏi mở số 4 của critic là "Bluebolt có nhận đơn trực tiếp từ người tiêu dùng không?". Em **không tự trả lời thay anh**. Bản thiết kế dưới đây được dựng theo nhánh A. Nhánh B được thiết kế sẵn để bật lên khi anh chọn.

| | Nhánh A (giả định mặc định) | Nhánh B (nếu anh chọn nhận B2C) |
|---|---|---|
| Hero trang chủ | Thông điệp B2B, 3 cửa vào | Thêm tab "Đặt thợ" (thiết bị → tỉnh → ngày) |
| Trang cho khách lẻ | `/ho-tro-khach-hang`: gọi/Zalo, đăng ký bảo hành 7 ngày, (P2) tra cứu đơn | Thêm `/dat-lich` (form 3 bước) |
| Bảng giá | Khung giá vật tư tham khảo + "giá theo hợp đồng" cho B2B | Thêm giá công lắp "từ …" theo thiết bị và vùng |
| Ảnh hưởng | Không có backend mới ngoài form lead | Cần API đặt lịch, có contract riêng, làm qua CR |

### 1.4 Tagline: các phương án để anh chọn

Ba trụ thương hiệu **Nhanh – Chuẩn – Minh bạch** được giữ nguyên. Đây là tài sản các agent đều đồng thuận giữ. Bản EN hiện đang lệch: lúc "FAST - RELIABLE - TRANSPARENT", lúc "FAST - PRECISE - TRANSPARENT". Cần chốt một bản.

| # | Tiếng Việt | English | Khi nào hợp |
|---|---|---|---|
| T1 | **Hạ tầng lắp đặt toàn quốc cho hãng điện máy** | **Vietnam's nationwide installation network for appliance brands** | Định vị B2B rõ nhất, hợp hãng FDI. *Em khuyến nghị.* |
| T2 | Lắp đặt chuẩn hãng. 34 tỉnh thành. Một đầu mối. | Brand-standard installation. 34 provinces. One partner. | Nhấn độ phủ và sự đơn giản cho Hãng |
| T3 | Bán ở đâu, lắp chuẩn ở đó. | Sold anywhere. Installed right, everywhere. | Hợp Sàn TMĐT, nhớ nhanh, dùng tốt cho quảng cáo |

Ba trụ bản EN: em đề xuất **Fast · Precise · Transparent**. "Precise" sát nghĩa "chuẩn" (đúng kỹ thuật, đúng chuẩn hãng) hơn "Reliable". Bản EN cuối cùng phải do người viết bản ngữ duyệt (mục 15).

Dòng copyright (giải quyết mâu thuẫn giữa ux-visual và content-cro): **giữ tên pháp lý tiếng Việt, thương hiệu đặt trong ngoặc.**
- VI: `© 2026 Công ty Cổ phần Công nghệ Tia Chớp Xanh (Bluebolt Services). Bảo lưu mọi quyền.`
- EN: `© 2026 CÔNG TY CỔ PHẦN CÔNG NGHỆ TIA CHỚP XANH (Bluebolt Services). All rights reserved.`

Không dịch tên pháp nhân thành "Blue Lightning…" (content-cro, CRO-12).

> *Giả định, chờ anh xác nhận:* thương hiệu chính là **Bluebolt Services**, còn "Lắp Đặt Toàn Quốc" là tên miền và mô tả dịch vụ. Lý do email dùng domain bluebolt.services thì chưa rõ.

---

## 2. Concept "Bluebolt Cinematic"

### 2.1 Anh thích gì ở video: đọc từ khung hình

Nguồn: `research/tiktok/sample.mp4` (47 giây, 576×1024, dọc). Khung hình 0–8 s lấy ở 2 khung/giây: `research/tiktok/sheets/camera_0-8s.jpg`. Khung lẻ ở `research/tiktok/frames/f_*.jpg`.

| Thời điểm | Máy quay làm gì | Cảm giác tạo ra |
|---|---|---|
| 0–0,5 s | **Cảnh rộng chéo góc, góc nhìn người đang ngồi (POV).** Laptop đang hiện code chiếm tiền cảnh dưới khung, tay trên trackpad, màn hình lớn ngay phía sau, khung nghiêng vài độ. **Phòng sáng ánh ngày**, có cửa sổ, rèm | "Đây là phòng làm việc thật, có người đang làm" |
| 0,5–3 s | **Dolly-in và xoay dần** từ chéo góc về chính diện, khung được cân thẳng lại. Laptop (gần) trôi nhanh hơn màn hình lớn (xa), nên có thị sai rõ | Chiều sâu 3D thật, không phải ảnh phẳng |
| 4,75–6,25 s | Màn hình lớn gần lấp ngang khung. **Phòng tối dần** (độ sáng trần 108 → 54, đo ở `02` mục A3) vì điện thoại tự hạ phơi sáng khi màn hình trắng ra | "Đèn trong phòng tắt, chỉ còn màn hình phát sáng" |
| ~6,5–47 s | **Máy giữ khung**, chỉ còn rung tay nhẹ. **Website cuộn ngay trên màn hình trong cảnh**, laptop vẫn ở mép dưới | "Website sống trong không gian thật". Đây là đỉnh cảm xúc của video |

Ba điểm cần nói thẳng:
- **Video không bắt đầu ở phòng tối.** Phòng chỉ tối khi màn hình trắng chiếm khung. Bản đầu tài liệu này và prototype đã dựng phòng tối kiểu đêm từ khung đầu: sai so với video, đã sửa (mục 6.1).
- **Video không thật sự chui vào màn hình.** Màn hình chỉ gần lấp ngang khung, laptop vẫn còn ở dưới. "Đẩy xuyên màn hình rồi chuyển sang trang thật" (mục 3, `push-through`) là bước em **mở rộng thêm** để biến video thành trải nghiệm web.
- **Bố cục, màu xanh rêu và ảnh nội thất của MD Decor Pro không lấy.** Bài học kỹ thuật từ site đó vẫn đúng: site mẫu không dùng WebGL, cảm giác mượt đến từ easing tốt và không có long task (`research/agent-notes/creative-technologist/mddecorpro/probe.json`).

### 2.2 Big idea: "Mỗi lần cuộn là một cú máy"

> **Người xem cuộn chuột, máy quay di chuyển trong một không gian 3D liền mạch. Họ đi theo một đơn lắp đặt từ lúc rơi vào màn hình điều phối tới lúc khách ký nghiệm thu.**

Ba quy tắc:
1. **Một câu chuyện, không phải một bộ sưu tập hiệu ứng.** Mỗi shot là một bước của quy trình 5 bước (mục 14.1). Cắt bỏ bất cứ chuyển động nào không kể chuyện.
2. **Thiết bị trong cảnh là nơi nội dung xuất hiện.** Chữ, số và nút không trôi lơ lửng trong 3D. Chúng hiện trên màn hình laptop, điện thoại, hoặc trên lớp HTML bên cạnh cảnh.
3. **Giữ khung cho website cuộn trên màn hình, rồi mới chuyển giao sang HTML thật** (screen-to-page handoff). Phim kết thúc đúng ở chỗ trang web bình thường bắt đầu, nên người xem không có cảm giác "xong intro rồi mới tới site". Sau chuyển giao giữ dư âm cảnh một màn (vignette, ánh xanh mép dưới, bezel mờ dần) để không thành cú "tắt phim".

### 2.3 Vì sao hướng này hợp "Services, quốc tế" hơn hướng cũ

| Tiêu chí | Hướng v1 (ảnh render + 2.5D, KHANG làm hero) | Hướng v2 (Cinematic) |
|---|---|---|
| Thông điệp chính | Mascot dễ thương | **Hạ tầng vận hành có thật**: điều phối, mạng lưới, nghiệm thu, đối soát |
| Hãng FDI nhìn thấy gì | Một công ty dịch vụ địa phương | Một nền tảng có dashboard, SLA và báo cáo, giống HelloTech / Field Nation (`02-MAU-THAM-KHAO-VA-BENCHMARK.md`) |
| Khác biệt với 8 site trong nước | Trung bình | Cao. Chưa site lắp đặt nào kể chuyện bằng máy quay (research:benchmark) |
| Rủi ro | Thấp | Cao hơn: hiệu năng, mobile, "kẹt cuộn". Xử lý ở mục 7–8 |

### 2.4 Phần nào của hướng cũ vẫn giữ

- **Motion 2.5D** (mục 12) vẫn là nền cho mọi section sau phim và cho các trang con.
- **Bài học `<model-viewer>` của site hiện tại vẫn là luật.** File `khang-3d.glb` 3,7 MB (417.618 tam giác) đẩy TBT desktop lên 36.430 ms. Khi chặn model-viewer, blocking về 0 ms (`research/agent-notes/frontend-seo-a11y/longtask-model-viewer.txt`). Số TBT này đo trên SwiftShader, nên không trích nó như hiệu năng người dùng thật. Vì vậy: không có canvas nào là phần tử LCP, và không tải 3D trước khi trang dùng được.
- **Bản đồ 34 tỉnh** của POC trở thành một shot trong phim (shot 2) và là trang `/mang-luoi`.
- **Quy trình máy lạnh dựng thủ tục** (RoundedBox, ống đồng theo đường cong) không còn đứng riêng một section. Nó trở thành shot 4.

---

## 3. Ngữ pháp máy quay (chuẩn hóa)

Mỗi cú máy có tên. Thiết kế, code và render video mobile đều dùng chung bộ tên và thông số này. Số đo theo **vh cuộn** (1 vh = 1% chiều cao viewport) vì chuyển động gắn với cuộn, không gắn với thời gian.

### 3.1 Tám cú máy

| Tên | Mô tả | Độ dài cuộn | Easing (theo tiến độ cuộn) | Thông số | Dùng khi |
|---|---|---|---|---|---|
| `establish` | Cảnh rộng chéo góc **POV người ngồi**, máy gần đứng yên | 0 (trạng thái khi vào trang) | — | Tiêu cự tương đương 28 mm (FOV dọc ~46°). Lệch trục 25–35°. Máy cao ~1,15–1,2 m, ngay sau mép bàn, chúc xuống. Laptop chiếm ~1/3 dưới khung, bị cắt mép. **Nghiêng ngang 2–4°** như video quay tay | Mở phim, mở trang con |
| `dolly-in` | Máy tiến về đối tượng, đồng thời xoay quanh nó từ chéo về chính diện | 80–120 vh | `cubic-bezier(.45,0,.2,1)` | Khoảng cách giảm 3× → 1,15×. Xoay 30–35° → 0°. FOV thu nhẹ 46° → 38° để tăng cảm giác "lao vào" | Shot 1, mọi hero trang con |
| `orbit` | Máy quay quanh một vật cố định | 60–100 vh | `sine.inOut` | Cung ≤ 60°. Bán kính giữ nguyên. Không lộn ngược | Shot 4: máy lạnh, ống đồng |
| `crane` | Máy nâng lên và chúc xuống thành nhìn từ trên | 100–140 vh | `power3.inOut` | Góc chúc 10° → 80°. Cao ×4–6. Gần cuối thì FOV thu về 25° cho giống bản đồ phẳng | Shot 2: màn hình → bản đồ 34 tỉnh. Shot 3: từ bản đồ xuống một mái nhà |
| `screen-hold` | **Máy giữ khung, website cuộn trên màn hình trong cảnh.** Đây là pha dài nhất của video | 60–100 vh | tuyến tính | Máy dừng khi màn hình phủ ~85–90% bề ngang, laptop còn ở mép dưới. Texture màn hình dài (≤ 1600×3600) dịch UV theo cuộn. Phòng đã tối (exposure ~0,6) | Sau `dolly-in`, trước `push-through` |
| `push-through` | Đoạn cuối: màn hình trong cảnh lấp đầy khung, rồi chuyển giao sang HTML thật | 15–25 vh | `power2.in` | Chuyển khi màn hình phủ ≥ 98% viewport. Crossfade 200 ms. Chi tiết ở mục 7.4 | Kết thúc phim. Chuyển giữa các shot qua một màn hình |
| `rack-focus` | Đổi vùng nét từ gần sang xa (hoặc ngược lại), máy gần như đứng yên | 30–50 vh | `power1.inOut` | Khẩu độ ảo tương đương f/2,8. Bokeh tối đa 3 px ở 1080p. **Chỉ bật trên tầng GPU cao nhất.** Tầng thấp hơn thay bằng 2 lớp ảnh nét/mờ cắt sẵn | Shot 4 → 5: từ máy lạnh sang điện thoại nghiệm thu |
| `handheld` | Rung tay nhẹ chồng lên mọi cú máy | **Khi đang cuộn**, tắt dần 1,5 s sau khi dừng (đứng yên thì không vẽ, để tiết kiệm GPU/pin và không hỏng INP) | Nhiễu simplex 2 tầng | Xoay ±0,15–0,25°. Tịnh tiến ±2–4 mm (theo thang cảnh). Tần số 0,3–0,6 Hz. Roll handheld ≤ 0,5° | Toàn phim. Tắt khi reduced-motion |
| `exposure-ramp` | Phòng tối dần khi màn hình chiếm khung (chữ ký của video) | Trong `dolly-in`, p ≈ 0,45–0,8 | `power1.inOut` | `toneMappingExposure` (hoặc cường độ đèn môi trường) 1,15 → ~0,6, giảm ~50% như đo ở `02` mục A3. Màn hình giữ sáng (`toneMapped=false`) | Mọi phim có màn hình chiếm khung |

### 3.2 Luật dùng máy

1. **Mỗi shot chỉ một cú máy chính.** Có thể cộng `handheld` và tối đa một `rack-focus`. Shot nào cần hai chuyển động lớn thì cắt làm hai shot.
2. **Máy chỉ di chuyển khi người dùng cuộn.** Khi đứng yên, `handheld` tắt dần trong 1,5 s rồi canvas ngừng vẽ. Không có cú máy nào tự chạy theo thời gian.
3. **Làm mượt cuộn bằng scrub của GSAP** (`scrub: 0.8` trên desktop), không bằng cách chiếm bánh xe chuột. Có cuộn native thì bàn phím, trackpad và thanh cuộn đều chạy đúng.
4. **Giữa hai shot cách xa nhau thì cắt qua một màn hình**, không bay dài qua không gian trống. Đây là "match cut": màn hình laptop → bản đồ trên màn hình → bản đồ thật. Vừa có ý nghĩa vừa đỡ phải dựng cảnh nối.
5. **Chữ không bao giờ chuyển động cùng máy.** Chữ trên lớp HTML hiện bằng `rise` (mục 12) khi shot dừng ở mốc của nó, và đứng yên để đọc.
6. **Khung `establish` được nghiêng 2–4°** (như video quay tay), về 0° trước khi màn hình chiếm khung. Từ đó tới hết phim chân trời thẳng, roll handheld ≤ 0,5°. Không nghiêng theo cuộn ở giữa phim: đó là khác biệt giữa "điện ảnh" và "trò chơi". (Bản đầu ghi "chân trời luôn thẳng", trái với video và với prototype; đã sửa.)
7. **Thời gian dừng đọc:** mỗi shot có một đoạn 20–30 vh ở cuối mà máy gần như đứng yên, để người xem đọc chữ trước khi máy đi tiếp.

### 3.3 Token cho dev

```ts
// motion/camera.ts — một nguồn cho cả WebGL và pipeline render video mobile
export const CAMERA = {
  establish:   { fovDeg: 46, yawDeg: 28, heightM: 1.18, rollDeg: -3 },   // POV người ngồi, ban ngày
  dollyIn:     { lengthVh: 100, distFrom: 3.0, distTo: 1.15, yawTo: 0, fovTo: 38, rollTo: 0, ease: [0.45, 0, 0.2, 1] },
  exposure:    { from: 1.15, to: 0.6, startP: 0.45, endP: 0.8 },        // phòng tối dần (02 mục A3)
  screenHold:  { lengthVh: 80, fillWidth: 0.88, texHeightPx: 3600 },    // website cuộn trên màn hình
  orbit:       { lengthVh: 80, arcDeg: 55, ease: 'sine.inOut' },
  crane:       { lengthVh: 120, pitchFrom: 10, pitchTo: 80, heightMul: 5, fovTo: 25, ease: 'power3.inOut' },
  pushThrough: { lengthVh: 20, fillThreshold: 0.98, crossfadeMs: 200, ease: 'power2.in' },
  rackFocus:   { lengthVh: 40, fStop: 2.8, maxBokehPx: 3 },
  handheld:    { rotDeg: 0.2, posMm: 3, hz: [0.3, 0.6], maxRollDeg: 0.5, idleFadeS: 1.5 },  // chỉ khi đang cuộn
  holdVh: 25,  // đoạn dừng đọc cuối mỗi shot
  scrub: 0.8,
} as const;
```

Các giá trị trên là **điểm xuất phát**. Chúng được chỉnh bằng mắt trong prototype rồi chốt lại ở đây.

---

## 4. Câu chuyện trang chủ: 6 shot

> **Bảng dưới là phương án C đầy đủ (6 shot), em mở rộng thêm, không có trong video.** Khuyến nghị là **A+** = shot 0 → 1 → `screen-hold` → handoff (~300 vh, mục 9). B = A+ cộng shot 2. Các shot 3–5 dùng làm hero trang con (mục 7.5).

**Tổng độ dài phim C: khoảng 660 vh trên desktop** (chưa tính `screen-hold`), tính cả màn hình đầu. Phần phải cuộn là khoảng 560 vh, tức **≈ 5,6 màn hình (khoảng 4.300 px ở 1366×768, cỡ 40 nấc chuột)**, không phải "5–6 lần lăn trang" như bản đầu ghi. Ngay dưới H1 luôn có link **"Bỏ qua phần giới thiệu ↓"**. Thanh chương ở cạnh phải (6 chấm, mỗi chấm có nhãn) cho biết đang ở đâu và bấm được để nhảy.

| # | Tên shot | Cảnh | Cú máy | Nội dung HTML đi kèm | CTA | vh |
|---|---|---|---|---|---|---|
| 0 | **Phòng điều phối** | POV người ngồi, **phòng sáng dịu chiều muộn**, cửa sổ sáng làm rim. Laptop mở dashboard điều phối ở tiền cảnh, màn hình lớn phía sau. **Dàn lạnh treo tường thấy trọn** ở góc trên. Đạo cụ nghề: hộp đồ nghề mở, cuộn ống đồng, đồng hồ đo gas, áo đồng phục vắt ghế. Điện thoại app thợ trên giá | `establish` + `handheld` | Eyebrow, H1 (tagline T1), lead, 2 CTA. **Đây là phần tử LCP và là H1 duy nhất của trang**, nằm trên lớp HTML bên trái, có scrim, hiện ngay từ server | **Nhận báo giá cho doanh nghiệp** · Đăng ký làm đối tác thợ | 100 (màn hình đầu) |
| 1 | **Một đơn vừa đến** | Cùng phòng | `dolly-in` về laptop. Laptop từ chéo về chính diện; màn hình lớn phía sau trôi chậm hơn (thị sai) | Trên laptop: thẻ đơn mới trượt vào ("Lắp điều hòa 12.000 BTU · Thủ Đức · Hãng [__]"). Lớp HTML: **01 Tiếp nhận đơn** + 1 câu về kênh nhận đơn (API/file/portal, *chờ anh xác nhận*) | — | 100 |
| 2 | **Tìm thợ gần nhất** | Máy chuyển từ laptop sang màn hình lớn (match cut), rồi bản đồ trên màn hình "nở" thành **bản đồ 34 tỉnh 3D** | `push-through` vào màn hình lớn, rồi `crane` thành nhìn từ trên | Các tỉnh mọc khối Bắc → Nam. Ghim thợ sáng cam, một đường nối từ đơn tới thợ gần nhất. Lớp HTML: **02 Điều phối thợ** + KPI K1, K2. **Hoàng Sa, Trường Sa luôn trong khung, có nhãn** | Xem mạng lưới 34 tỉnh → `/mang-luoi` | 120 |
| 3 | **Tới nhà khách** | Từ bản đồ, máy hạ xuống một khu phố cách điệu, rồi vào phòng khách sáng ánh chiều | `crane` ngược (chúc xuống, hạ thấp), cắt qua cửa sổ | Điện thoại của thợ ở tiền cảnh hiện **app thợ**: lịch hẹn, nút "Đã gọi khách". Lớp HTML: **03 Xác nhận lịch hẹn** + SLA vùng (*placeholder*) | — | 100 |
| 4 | **Lắp chuẩn hãng** | Bức tường với dàn lạnh treo tường (không logo), ống đồng đi tới dàn nóng ngoài ban công | `orbit` 55° quanh dàn lạnh. Dàn lạnh tách lớp rồi ghép lại, ống đồng "chạy" nối hai dàn | Lớp HTML: **04 Lắp đặt & nghiệm thu** + 3 gạch đầu dòng tiêu chuẩn (thợ E-KYC, đúng chuẩn hãng, có ảnh trước/sau: **claim chờ bằng chứng**, đọc từ `content/claims.ts`) | Tiêu chuẩn thợ → `/doi-tac-tho#tieu-chuan` | 100 |
| 5 | **Nghiệm thu và đối soát** | `rack-focus` từ máy lạnh sang điện thoại: màn hình nghiệm thu có ảnh, chữ ký khách. Rồi cắt về laptop ở phòng điều phối: báo cáo đối soát | `rack-focus`, rồi `dolly-in` + `push-through` vào laptop | Trên laptop: bảng đối soát tháng, cột trạng thái "Đã nghiệm thu". Lớp HTML: **05 Đối soát & bảo hành** (thời hạn bảo hành: claim chờ bằng chứng). Màn hình laptop lấp khung, **chuyển giao sang section HTML "Ba cửa vào"** (H2) | Đặt lịch demo 30 phút | 120 (+20 handoff) |

Sau shot 5, trang trở thành trang web bình thường với cuộn native và motion 2.5D (storyboard ở mục 13).

**Giả định cần anh xác nhận:** nội dung trên các màn hình trong cảnh (tên hãng, địa chỉ, số đơn) là **dữ liệu minh họa** và có ghi "Giao diện minh họa" ở góc. Nếu đội sản phẩm cung cấp màn hình thật của dashboard và app thợ thì dùng màn hình thật (mục 15, dòng 13).

---

## 5. Device-in-scene: nơi trình diễn nền tảng

Đây là phần làm nên chất "Services, quốc tế". Khách B2B không chỉ thấy "chúng tôi có thợ". Họ thấy **công cụ** mà họ sẽ dùng.

| Thiết bị trong cảnh | Màn hình hiển thị | Ai cần thấy | Shot | Trang con dùng lại |
|---|---|---|---|---|
| **Laptop điều phối** | Dashboard Hãng: danh sách đơn, trạng thái (Mới → Đã gán thợ → Đang đến → Đã nghiệm thu), bộ lọc tỉnh | Hãng & Sàn | 0, 1 | `/giai-phap/hang-dien-may` (hero) |
| **Màn hình lớn** | Bản đồ 34 tỉnh, ghim thợ, đường đi | Hãng & Sàn | 0, 2 | `/mang-luoi` |
| **Điện thoại thợ** | App thợ: đơn mới, lịch hẹn, checklist lắp đặt, chụp ảnh nghiệm thu, ví | Thợ, và Hãng (để thấy kiểm soát chất lượng) | 3, 5 | `/doi-tac-tho` (hero) |
| **Laptop (lần 2)** | Báo cáo đối soát tháng: số đơn, tỷ lệ đúng hẹn, xuất Excel/PDF | Hãng & Sàn (kế toán, vận hành) | 5 | `/giai-phap/san-tmdt-ban-le` |
| **Máy lạnh treo tường** | Không có màn hình. Là "sản phẩm" của dịch vụ | Mọi người | 4 | `/dich-vu/lap-dat-dieu-hoa` (hero) |

Quy tắc cho màn hình trong cảnh:
- **Màn hình là HTML thật, không phải ảnh vẽ tay.** Mỗi màn hình là một React component (`<DispatchDashboard>`, `<TechnicianApp>`, `<ReconReport>`) dùng chung design tokens. Lúc build, Playwright chụp component thành ảnh AVIF để làm texture. Như vậy màn hình trong cảnh luôn khớp với UI thật, và khi handoff thì phần HTML hiện ra giống hệt texture.
- **Chữ trên màn hình phải đọc được ở khung cuối của mỗi shot**: tối thiểu 14 px hiệu dụng trên viewport 1366×768.
- **Không có logo hãng nào trên giao diện minh họa** khi chưa có văn bản đồng ý. Tên đối tác để `[Hãng A]`.
- **Ngôn ngữ:** bản EN dùng bộ texture riêng chụp từ component ở locale `en`. Không để chữ Việt trên màn hình của trang EN.

---

## 6. Art direction cho cảnh

### 6.1 Ánh sáng

| Cảnh | Không khí | Đèn chính | Đèn phụ | Màu màn hình |
|---|---|---|---|---|
| Phòng điều phối (shot 0, 1, 5) | **Bắt đầu sáng dịu (chiều muộn, cửa sổ sáng). Khi màn hình chiếm khung, phòng tối dần** (exposure giảm ~50%, theo đo ở `02` mục A3). Đây là chữ ký của video, không phải phòng tối từ đầu | Ánh ngày qua cửa sổ, 4.500–5.500 K | Đèn bàn 2.700–3.000 K cường độ thấp, chỉ nổi lên khi phòng đã tối | Màn hình phát sáng `blue-600` #004AAD pha trắng, **hắt sáng xanh lên mặt bàn và tay ghế** khi phòng tối dần |
| Bản đồ (shot 2) | Ban đêm nhìn từ vệ tinh, cách điệu | Ánh sáng môi trường dịu từ trên | — | Đất liền `navy-900` → `blue-600`. Biển gradient tối. Ghim thợ `orange-500` phát sáng |
| Nhà khách (shot 3, 4) | **Giờ vàng chiều**, ấm, sạch | Nắng xiên qua cửa sổ 4.500 K | Fill trắng mềm | Điện thoại thợ: giao diện sáng |

Nguyên tắc: **ấm ở không gian, xanh ở công nghệ, cam ở con người và điểm hành động.** Ba màu thương hiệu xuất hiện tự nhiên qua ánh sáng, không phải sơn lên đồ vật.

### 6.2 Palette cảnh khớp tokens

| Vai trò trong cảnh | Token / màu | Tỉ lệ diện tích (ước) |
|---|---|---|
| Bóng tối, tường, nền đêm | `navy-900` #0A1F44 và các sắc tối hơn | ~45% |
| Gỗ bàn, sàn, nắng | Trung tính ấm (ngoài token UI, chỉ dùng trong ảnh 3D) | ~30% |
| Ánh sáng màn hình, đất liền bản đồ | `blue-600` #004AAD, `blue-300` #7FAAF0 | ~18% |
| Ghim thợ, mũ bảo hộ, dây rút, nút trên app | `orange-500` #EF8426 | ≤ 7% |

Cam chỉ xuất hiện ở **chỗ có người hoặc có hành động**. Đây cũng là luật 8% cam của UI (mục 11.1).

### 6.3 Vật liệu

- Laptop và màn hình: nhôm mờ, viền đen. **Không logo, không kiểu dáng nhận diện của hãng nào** (không thể nhìn ra MacBook).
- Bàn gỗ sồi hoặc óc chó, vân rõ nhưng tối. Tường bê tông mịn.
- Máy lạnh: nhựa trắng satin, cánh đảo gió xám. **Không giống dòng máy của hãng nào.** Ống đồng có độ bóng kim loại, bảo ôn xám.
- Không có bàn tay người trong cảnh realtime (tay 3D dễ thành "thung lũng kỳ lạ"). Cảm giác "có người" đến từ `handheld`, ly cà phê, sổ tay, áo khoác vắt ghế.
- Tham chiếu hình: video mẫu (`research/tiktok/sheets/camera_0-8s.jpg`) cho ánh sáng và góc máy. **Không** tham chiếu ảnh nội thất của MD Decor Pro.

### 6.4 Vai trò của KHANG trong phim

KHANG **không phải nhân vật chính** của phim. Nhân vật chính là đơn lắp đặt và đội thợ. KHANG xuất hiện ba lần, như một chữ ký:

| Lần | Ở đâu | Dạng |
|---|---|---|
| 1 | Shot 0: một **tượng nhỏ KHANG** đứng trên bàn điều phối, cạnh laptop | Poster render, hoặc GLB 628 KB trên tầng GPU cao |
| 2 | Shot 3, 5: **avatar trợ lý** trên app thợ ("KHANG nhắc: chụp ảnh dàn nóng") | Ảnh 2D trong texture màn hình |
| 3 | Cuối trang: KHANG cầm cờ lê ở CTA cuối, 404, empty state | Poster render |

Mesh KHANG hiện **chưa rig** và **bản quyền mesh/ảnh chưa xác nhận** (câu hỏi mở số 10). **Prototype hiện CÓ dùng KHANG (~62,6k tam giác, gần 90% cảnh), chỉ dùng nội bộ.** Bản đem ra ngoài, poster và ảnh OG phải chạy chế độ không KHANG (`?noKhang`, mặc định bật khi render poster/OG) cho tới khi anh xác nhận bằng văn bản. Vòng phản biện cũng chỉ ra mascot đồ chơi trên bàn phá chất "quay thật" của video, nên **mặc định bỏ KHANG khỏi cảnh**; nếu có quyền thì chỉ là tượng nhỏ hoặc sticker trên laptop. Không đặt 3D artist làm KHANG trước khi có xác nhận quyền.

### 6.5 Nguồn asset cảnh

| Asset | Cách có | Ghi chú |
|---|---|---|
| Phòng, bàn, laptop, màn hình, máy lạnh, nhà phố | **Dựng thủ tục trong code** (RoundedBox, Extrude, Lathe) cộng model CC0 từ Poly Haven nếu cần | CC0 nên không vướng giấy phép. Giữ style "sạch, hơi cách điệu", không cố photoreal |
| HDRI môi trường | Poly Haven CC0, giảm còn 1K | Tự host |
| Bản đồ 34 tỉnh | TopoJSON từ thanglequoc/vietnamese-provinces-database (MIT), bake ra GLB lúc build | Đã đo ở POC (mục 8) |
| Ảnh thật (thợ, công trình) | Buổi chụp ảnh thật (mục 15) | Dùng ở các section sau phim, **không** đưa vào cảnh 3D |
| Cảnh đạt chất lượng thương mại (A+/B/C) | Thuê 3D artist dựng bằng Blender, xuất GLB. Hợp đồng chuyển giao toàn bộ quyền tác phẩm và file nguồn; không dùng asset AI hoặc stock không rõ giấy phép | Chi phí **chưa kiểm chứng**, phải xin báo giá (`04` mục 5.3) |
| Phương án Q | Quay thật phòng điều phối Bluebolt (mục 9) | Không cần 3D artist |

---

## 7. Kiến trúc kỹ thuật lai

### 7.1 Một nguồn cảnh, bốn cách hiển thị

```
                      ┌─────────────────────────────────────────┐
                      │  NGUỒN DUY NHẤT: scene R3F + CAMERA     │
                      │  (motion/camera.ts, scenes/*.tsx)       │
                      └───────┬───────────────┬─────────────────┘
                              │ realtime      │ render offline (Playwright → ffmpeg)
            ┌─────────────────┴───┐   ┌───────┴──────────────────────────────┐
            │ T-FULL / T-LITE     │   │ video tua (chuỗi ảnh dự phòng), T-SEQ │
            │ canvas WebGL        │   │ ảnh tĩnh từng shot cho T-STILL        │
            └─────────────────────┘   │ poster khung đầu (LCP fallback)       │
                                      │ video loop ngắn cho hero trang con    │
                                      └───────────────────────────────────────┘
      Luôn có: HTML thật (H1, chữ từng bước, KPI, CTA) = nội dung chính, SEO, a11y
```

Lợi ích: sửa một góc máy ở `camera.ts` là cả desktop realtime lẫn video mobile cùng đổi. Không có hai phiên bản lệch nhau.

### 7.2 Bốn tầng thiết bị

| Tầng | Điều kiện | Phim trang chủ hiển thị thế nào |
|---|---|---|
Điều kiện chính xác (VÀ/HOẶC, chọn theo renderer thật) ở `04` mục 3.1. Tóm tắt:

| Tầng | Điều kiện | Phim trang chủ hiển thị thế nào |
|---|---|---|
| **T-FULL** | Desktop ≥ 1024 px, `pointer:fine`, GPU tier 3 (detect-gpu, tự host), renderer thật, không Save-Data | Canvas WebGL, DPR [1; 2], bóng đổ mềm, `rack-focus` thật (DOF) chỉ ở C |
| **T-LITE** | Desktop, GPU tier 2 | Canvas WebGL, DPR [1; 1,5], không DOF, không bóng động. Frame time p90 > 25 ms trong 2 s đang cuộn thì tự hạ xuống T-STILL |
| **T-SEQ** | Màn nhỏ hoặc dọc: width < 768, hoặc cảm ứng và cạnh ngắn < 768 | **Video dựng sẵn từ chính cảnh**, khung dọc, tua theo tiến độ cuộn (prototype đã chạy). Chuỗi ảnh trên canvas 2D là dự phòng |
| **T-STILL** | `prefers-reduced-motion: reduce`, Save-Data, không có JS, **hoặc desktop/iPad không đủ GPU** (tier 0–1, renderer phần mềm, mất WebGL context) | Poster + 1 ảnh tĩnh mỗi shot đặt cạnh chữ từng bước. Không pin, không scrub |

Vì sao mobile dùng video/chuỗi ảnh thay vì WebGL, kể cả iPhone đời mới:
- Kết quả dự đoán được trên mọi máy: không lỗi shader Safari, không nóng máy, không mất context WebGL khi chuyển app.
- Hình có thể đẹp hơn realtime (render offline được bật bóng đổ và DOF).
- Có thể cân nhắc mở WebGL cho iPad/iPhone cao cấp **sau** khi go-live và đo thật.

### 7.3 Cấu trúc code

```
app/(site)/page.tsx                 Trang chủ: SSR toàn bộ HTML (H1, 5 bước, KPI, CTA)
components/film/
  FilmStage.tsx                     'use client'. Chọn tầng, dynamic import đúng 1 renderer
  FilmTimeline.ts                   GSAP ScrollTrigger: 1 timeline, mỗi shot là 1 label
  renderers/WebGLFilm.tsx           R3F <Canvas frameloop="demand">, chỉ nạp ở T-FULL/T-LITE, sau ý định đầu tiên
  renderers/VideoScrubFilm.tsx      <video> tua theo cuộn, chỉ nạp ở T-SEQ (SequenceFilm.tsx là dự phòng)
  renderers/StillFilm.tsx           <picture> tĩnh, có sẵn trong HTML SSR (T-STILL, no-JS)
  scenes/DispatchRoom.tsx           Shot 0, 1, 5
  scenes/ProvinceMap.tsx            Shot 2 (dùng lại POC bản đồ)
  scenes/CustomerHome.tsx           Shot 3, 4
  screens/*.tsx                     Màn hình trong cảnh, cũng dùng làm UI thật khi handoff
motion/camera.ts                    Token máy quay (mục 3.3)
scripts/render-film.mjs             Playwright chụp từng khung → ffmpeg → video tua + poster + OG
```

Luật:
- **HTML của 5 bước nằm trong DOM theo thứ tự đọc**, ở dạng `<ol>`, render từ server. Canvas đặt `aria-hidden="true"`. Trình đọc màn hình và Googlebot đọc một danh sách 5 bước bình thường.
- **Phần tử LCP là H1 hoặc ảnh poster** (`fetchpriority="high"`), cả hai do server render và hiện mặc định. **Mỗi trang đúng một H1** (trang chủ: ở shot 0). Chunk 3D chỉ import sau ý định đầu tiên của người dùng hoặc `load` + 2 s rảnh, không bao giờ ở lần render đầu; video chỉ tải ở lần chạm/cuộn đầu (`04` mục 3.1–3.2).
- **Một canvas cho cả phim.** Đổi cảnh bằng cách mount/unmount group trong cùng context, không tạo canvas mới.
- **Ra khỏi vùng phim thì dừng hẳn render** và giải phóng texture lớn.
- **`webglcontextlost`**: chuyển ngay sang T-STILL ở đúng khung đang xem (desktop không nhận video dọc).
- **Link "Bỏ qua phần giới thiệu"** là thẻ `<a href="#ba-cua-vao">` thật, focus được bằng bàn phím.

### 7.4 Chuyển giao màn hình sang trang (screen-to-page handoff)

Đây là khoảnh khắc "wow" và cũng là chỗ dễ lộ nhất. Cách làm:

0. **Đích chuyển giao theo phương án** (chốt một mô hình): A+/B chuyển giao vào màn hình lớn sang `HeroScreen` (như prototype), rồi tới "Ba cửa vào"; C chuyển giao từ laptop sang "Ba cửa vào". **Ở mọi phương án, màn hình đích dùng H2. H1 duy nhất nằm ở shot 0.** Trước chuyển giao có pha `screen-hold` (website cuộn trên màn hình).
1. **Texture trên màn hình là ảnh chụp của chính section HTML đích**, chụp ở đúng tỉ lệ màn hình bằng `scripts/shoot-textures.mjs` (bản dài cho `screen-hold`).
2. Khi `push-through` đưa màn hình phủ ≥ 98% viewport, section HTML thật được đặt `position: fixed` đúng vị trí và crossfade 200 ms đè lên canvas.
3. Viewport không phải 16:10 thì section HTML được căn theo kiểu "cover" khớp với texture. Crossfade che phần lệch nhỏ.
4. Canvas ẩn đi, pin được gỡ, cuộn native tiếp tục. Cuộn ngược lên thì quá trình chạy ngược lại.
5. Section HTML luôn hoạt động độc lập. Nếu handoff lỗi, người dùng vẫn thấy một section bình thường.

Nếu anh thấy handoff thật không đáng rủi ro, phương án thay thế là **cắt sang trắng 1 khung** (giống video mẫu ở đoạn chuyển trang). Rẻ hơn và vẫn ổn.

### 7.5 Trang con: một shot ngắn, không nhồi WebGL

| Trang | Hero | Cách làm |
|---|---|---|
| `/giai-phap/hang-dien-may` | `dolly-in` vào laptop dashboard Hãng | **Video loop ngắn** render sẵn từ `DispatchRoom` (≤ 4 s, ≤ 600 KB, **ước tính**) + poster |
| `/giai-phap/san-tmdt-ban-le` | `dolly-in` vào báo cáo đối soát | Video loop từ cùng cảnh |
| `/mang-luoi` | `crane` xuống bản đồ, **tương tác được** | **Trang duy nhất ngoài trang chủ dùng WebGL live**, vì bản đồ cần hover/tap từng tỉnh. Fallback SVG + bảng 34 tỉnh |
| `/dich-vu/lap-dat-dieu-hoa` | `orbit` quanh dàn lạnh | Video loop |
| `/doi-tac-tho` | Điện thoại app thợ | **Ưu tiên ảnh/video quay thật** thợ Bluebolt cầm điện thoại. Không có thì dùng loop render |
| Các trang còn lại | Không có shot | Motion 2.5D (mục 12) |

Video hero trang con: `muted playsinline`, không autoplay khi Save-Data hoặc reduced-motion, chỉ tải khi hero vào viewport, dừng khi ra khỏi viewport.

---

## 8. Ngân sách hiệu năng

**Đã đo** nghĩa là có số trong file research. **Ước tính** nghĩa là prototype phải đo lại trước khi chốt.

### 8.1 Số đo đã có

| Hạng mục | Số | Nguồn | Ghi chú |
|---|---|---|---|
| Trang chủ hiện tại, mobile | 1.294 KiB · LCP 5,6 s · Perf 73 | `research/lighthouse-summary.txt` | Chưa có 3D mà đã nặng |
| Trang chủ hiện tại, desktop | 4.583 KiB · TBT 36.430 ms · Perf 60 | như trên | Do `model-viewer` + GLB 3,7 MB |
| JS tải đầu (POC Next 16, không 3D) | **135,3 KB** gz, tổng 176,6 KB | `research/agent-notes/webgl-architect/nextpoc-measurements.json` (reduced-motion) | |
| Runtime 3D (three + R3F + drei) | **~260 KB** gz (395,6 − 135,3) | như trên (mobile) | Chênh lệch JS giữa có và không 3D |
| Hero 3D sẵn sàng | 603 ms desktop · 1.586 ms mobile (CPU 4×) | như trên | localhost, SwiftShader |
| KHANG GLB tối ưu | 628 KB (62.641 tam giác) · 352 KB (25.056 tam giác) | `research/agent-notes/webgl-architect/r3d-measurements.json` | Gốc 3,7 MB / 417.618 |
| Bản đồ 34 tỉnh | 31,7 KB TopoJSON · 12.396 tam giác · 34 draw call · dựng 203 ms | `research/agent-notes/webgl-architect/r3d-measurements-glb-opt15n_map-topo3.json` | |

### 8.2 Ngân sách cho hướng Cinematic

| Hạng mục | Ngân sách | Đo hay ước |
|---|---|---|
| HTML + CSS + JS tải đầu (mọi tầng) | ≤ 170 KB JS gz, LCP là H1/poster | Dựa trên số đo 135,3 KB |
| Poster khung đầu (AVIF) | ≤ 150 KB desktop · ≤ 90 KB mobile | Ước tính |
| Runtime 3D (chỉ T-FULL/T-LITE, import sau ý định đầu tiên) | **≤ 290 KB gz** = 260 + ~30 KB code phim. Prototype Vite đo 359 KB, phải giảm (`04` mục 3.5) | 260 đã đo · 30 ước tính |
| Cảnh phòng điều phối (hình học thủ tục + texture KTX2) | ≤ 500 KB | Ước tính |
| HDRI 1K | ≤ 250 KB | Ước tính |
| Texture màn hình trong cảnh (AVIF/JPG sRGB, **không KTX2** vì nhòe chữ) | ≤ 400 KB tổng (prototype: 3 tấm JPG 273 KB) | Prototype đo một phần |
| Bản đồ bake GLB | 40–80 KB | Ước tính (dữ liệu nguồn 31,7 KB đã đo) |
| Cảnh nhà khách + máy lạnh (thủ tục) | ≤ 300 KB | Ước tính |
| **Tổng phim desktop** (chunk 3D + GLB + texture, không tính JS chính và font) | A+/B: T-FULL **≤ 2,2 MB**, T-LITE ≤ 1,4 MB, shot 0–1 ≤ 1,2 MB. C: ≤ 2,5 MB. Tải dần theo shot | Ước tính (`04` NFR-PERF-09) |
| Video tua mobile T-SEQ | **≤ 110 KB/s phim**, 540×960 mặc định, GOP ≤ 8, shot đầu ≤ 400 KB, tải theo shot | Có số đo ma trận encode trên bbsw (`04` mục 3.2): prototype A 4 s ở 720p/GOP 4 là 933 KB, vượt mọi mức cũ |
| Tổng trang chủ mobile trước khi cuộn | **≤ 600 KB** | Mục tiêu |
| Bộ nhớ mobile | Video: 1 phần tử `<video>` cho mỗi shot đang xem, giải phóng Blob shot đã qua. Chuỗi ảnh (dự phòng): tối đa ~30 ImageBitmap đã giải mã, xoay vòng | Ước tính, kiểm trên iPhone 11 và Android tầm trung |
| Khung hình desktop | T-FULL p95 ≤ 16,7 ms trên R-HI; T-LITE p95 ≤ 20 ms trên laptop GPU tích hợp (`04` NFR-PERF-11/12) | Chưa đo. SwiftShader không đại diện được |
| T-STILL | 0 request 3D, 0 request video/chuỗi ảnh | Mục tiêu, kiểm bằng Playwright |

Cần làm rõ: mọi số đo trong 8.1 chạy trên localhost với GPU giả lập (SwiftShader), **chưa phải hiệu năng người dùng thật**. Prototype phải đo lại trên laptop có GPU thật và trên máy Android tầm trung.

---

## 9. Ba prototype A+ / B / Q để anh chọn bằng mắt

**Nói thẳng trước:** video chỉ có **một cú máy** rồi giữ khung cho website cuộn. **A+ là bản sát video nhất.** B và C là phần em mở rộng (crane xuống bản đồ, bay vào nhà khách, orbit máy lạnh, rack-focus): đó là ngôn ngữ của trang sản phẩm Apple hay scrollytelling, không có trong video, và kéo dài phim, dễ "kẹt cuộn" với khách B2B đang vội. Vì vậy khuyến nghị đổi từ B (bản đầu) sang **A+**.

Trạng thái: **prototype hướng A đã dựng xong** (`prototype/demo-desktop.mp4`, `prototype/shots/sheet.jpg`, `prototype/MEASUREMENTS.md`). Vòng phản biện chỉ ra prototype chưa bắt được tinh thần video (diorama đêm nhìn từ cao, thiếu pha `screen-hold`, màn đầu không có H1/CTA B2B, phòng không tối dần) và chưa đạt hiệu năng (Lighthouse desktop 61, TBT 39.400 ms, không hơn site cũ). Danh sách sửa ở `04` mục 1.1 và G2.

Mỗi bản giao kèm: bản chạy trên máy dev (127.0.0.1, không mở cổng public), video quay màn hình desktop và bản T-SEQ trên điện thoại, số đo trọng lượng trang và fps trên máy thật.

| | **A+ — "Mở máy + giữ khung" (khuyến nghị)** | **B — A+ và "Toàn quốc"** | **Q — Quay thật** |
|---|---|---|---|
| Nội dung | Shot 0 (POV) → 1 (dolly-in, phòng tối dần) → `screen-hold` (website cuộn trên màn hình) → handoff. Bản đồ 34 tỉnh ở section HTML ngay sau, motion 2.5D | Như A+, thêm `crane` từ màn hình xuống bản đồ 34 tỉnh trước handoff | 1 buổi quay tại phòng điều phối Bluebolt bằng điện thoại hoặc gimbal, đúng cú máy của video (POV chéo, tiến về màn hình, màn hình phát site mới thật). Thêm 2–3 cảnh thợ lắp máy lạnh thật. Desktop và mobile đều là video tua theo cuộn |
| Giống video ở chỗ | Rất sát: một cú máy, phòng tối dần, website sống trên màn hình | Như A+, cộng một cú máy không có trong video | **Sát nhất**: cảnh thật, người thật, tay thật |
| Độ dài phim, tính cả màn hình đầu (desktop) | ~300 vh | ~420 vh | ~300 vh |
| Trọng lượng desktop | Phim ≤ 2,2 MB (T-FULL) | ≤ 2,2 MB | Video tua ngang theo ngân sách bit-rate riêng (1080p ước 3–6 MB, **chưa đo**), có bản 720p |
| Video mobile | ≤ 110 KB/s phim | ≤ 110 KB/s | ≤ 110 KB/s |
| Giờ Claude Code tới launch (`04` mục 5.1) | **≈ 271** | ≈ 281 | ≈ 244 |
| Cần 3D artist | Có (50–80 giờ) | Có | **Không.** Cần phòng và thợ trông chuyên nghiệp, quyền hình ảnh nhân sự, 1 buổi quay + 1 người dựng |
| Rủi ro chính | Thông điệp độ phủ phải nằm ở section sau | Bản đồ phải đúng chủ quyền ở mọi khung; phim dài hơn | Màn hình trong cảnh phải phát site mới, nên buổi quay chính thức phải sau khi site HTML chạy trên staging (hoặc ghép màn hình hậu kỳ). Không đổi chữ trên màn hình được nếu không quay/ghép lại |
| Phù hợp khi | Muốn đúng tinh thần video, an toàn hiệu năng | Muốn nhấn "toàn quốc" ngay trong phim | **Có phòng điều phối thật đủ đẹp** (giả định, chờ anh xác nhận) và muốn chứng minh năng lực bằng cảnh thật |

**C — "Trọn một đơn" (6 shot, mục 4):** không khuyến nghị cho trang chủ (~740 vh tính cả `screen-hold`, ≈ 295 giờ). Có thể đặt thêm prototype C (+10 giờ) nếu anh muốn xem. Các cú máy của C dùng làm hero trang con, mỗi trang một cú: `crane` cho `/mang-luoi`, `orbit` dàn lạnh cho `/dich-vu/lap-dat-dieu-hoa` (mục 7.5).

Cách duyệt:
1. Trước khi code cảnh, em gửi **3 style frame** (khung đầu POV ban ngày, pha `screen-hold`, section bản đồ) để anh duyệt ánh sáng và vật liệu. Đây là chỗ rẻ nhất để sửa hướng, và **3D artist chỉ bắt đầu sau bước này**.
2. Bluebolt quay thử Q 1–2 giờ bằng điện thoại (tuần 1–2) để anh so trực tiếp với A+.
3. Anh xem prototype trên laptop và điện thoại của anh, cộng một máy Android tầm trung.
4. Anh chọn A+, B hoặc Q. Chưa có quyết định này thì không build phim cho production.

---

## 10. Kiến trúc thông tin

### 10.1 Sitemap mới theo nhóm khách

```
/                                   Trang chủ                                   P0
├── GIẢI PHÁP (Hãng & Sàn)
│   ├── /giai-phap                  Hub: so sánh tự quản thợ / đơn vị địa phương / Bluebolt   P1
│   ├── /giai-phap/hang-dien-may    Landing cho Hãng điện máy, điện lạnh           P0
│   └── /giai-phap/san-tmdt-ban-le  Landing cho Sàn TMĐT và chuỗi bán lẻ           P0
├── /dich-vu                        Hub dịch vụ (4 nhóm)                           P0
│   ├── /dich-vu/lap-dat-dieu-hoa                                                 P0
│   ├── /dich-vu/lap-dat-dien-may   (máy giặt, TV treo tường, tủ lạnh…)           P1
│   ├── /dich-vu/bao-tri-dinh-ky    (bảo trì chuỗi, văn phòng)                    P1
│   └── /dich-vu/lap-dat-robot-hut-bui                                           P2
├── /bang-gia                       Khung giá vật tư tham khảo + giá theo hợp đồng P0
├── /mang-luoi                      Bản đồ 34 tỉnh + bảng tỉnh + SLA theo vùng     P0
├── /doi-tac-tho                    GỘP /requirement + /worker-map (+ phần thợ của /system-map)  P0
├── /ho-tro-khach-hang              Khách lẻ: gọi/Zalo, đăng ký bảo hành (giả định nhánh A)  P1
│   └── /tra-cuu                    Tra cứu đơn và bảo hành (cần backend)          P2
├── /ve-chung-toi                   Câu chuyện, pháp nhân, đội ngũ, mốc phát triển P1
├── /kien-thuc                      Hub nội dung (thay /news)                      P1
│   └── /kien-thuc/<slug>           Bài viết                                       P1
├── /lien-he                        Liên hệ theo bộ phận (Kinh doanh B2B / Tuyển thợ / CSKH)  P0
└── Pháp lý (nội dung chờ pháp chế)
    ├── /chinh-sach-bao-mat                                                       P0
    ├── /dieu-khoan-su-dung                                                       P0
    └── /chinh-sach-bao-hanh                                                      P0
```

Bản EN dùng slug tiếng Anh riêng: `/en`, `/en/solutions`, `/en/solutions/appliance-brands`, `/en/solutions/marketplaces-retail`, `/en/services`, `/en/services/air-conditioner-installation`, `/en/services/appliance-installation`, `/en/services/scheduled-maintenance`, `/en/services/robot-vacuum-installation`, `/en/pricing`, `/en/network`, `/en/technician-partners`, `/en/customer-support`, `/en/track`, `/en/about`, `/en/knowledge`, `/en/knowledge/<en-slug>`, `/en/contact`, `/en/privacy-policy`, `/en/terms`, `/en/warranty-policy`.

**Gộp 3 trang tuyển thợ:** `/requirement` (danh sách việc), `/worker-map` (tiêu chuẩn thợ) và `/system-map` (tiêu chuẩn, form chết, bản đồ placeholder) đang trùng nội dung. Tên route cũng đảo nghĩa: "worker-map" không có bản đồ, còn "system-map" lại là trang tuyển thợ (UX-14, CRO-16). Sau khi gộp:
- `/doi-tac-tho` gồm thu nhập, tiêu chuẩn, lộ trình gia nhập, việc đang tuyển và **một form 4 trường**.
- Bản đồ chuyển về `/mang-luoi`.

### 10.2 Chính sách slug: *đề xuất, chờ anh xác nhận* (câu hỏi mở số 12)

| Quy tắc | Đề xuất | Lý do |
|---|---|---|
| Slug VI | Tiếng Việt **không dấu**, kebab-case, ≤ 5 từ (`/doi-tac-tho`) | Slug có dấu bị percent-encode khi chia sẻ qua Zalo hoặc dán vào Excel (`/%C4%91%E1%BB%91i-t%C3%A1c`), dễ hỏng link. 8 slug bài viết hiện tại đã không dấu, nên giữ một chuẩn. Từ khóa không dấu vẫn được Google khớp với truy vấn có dấu. |
| Slug EN | Tiếng Anh riêng, cấu hình bằng `pathnames` của next-intl | Đáp ứng yêu cầu "quốc tế hơn" (SEO-03, CRO-12) |
| Tiền tố locale | VI không tiền tố, EN là `/en`, giữ như hiện tại | Không làm vỡ URL VI đang có |
| Cookie locale | **Bỏ auto-redirect theo cookie `NEXT_LOCALE`**. URL không tiền tố luôn là tiếng Việt, cookie chỉ dùng để gợi ý bằng banner | Hiện người từng vào /en sẽ bị 307 khi mở link VI được chia sẻ (critic, reverified) |
| Kiểu redirect | **301 một bước**, không chuỗi (http → https, www → apex, slug cũ → mới, tất cả trong 1 hop) | `redirects()` của Next với `permanent: true` trả **308**, không phải 301. Muốn 301 thì dùng `statusCode: 301`, hoặc đặt ở openresty |
| Giữ URL có giá trị | Trước khi đổi bất kỳ bài nào, lấy click 90 ngày từ Search Console. **Bài nào có traffic tự nhiên đáng kể thì giữ nguyên URL cũ** và chỉ đổi breadcrumb | Hiện **chưa có dữ liệu traffic** (critic: gaps). Không đoán thay dữ liệu |

### 10.3 Bảng ánh xạ URL cũ → mới (34 URL trong sitemap hiện tại)

Nguồn danh sách: `research/raw/urls.txt`. Tất cả là **301**, trừ hai dòng ghi chú khác.

> **Bảng này chỉ là phần sitemap, chưa đủ.** Trước khi cutover phải kiểm kê thêm từ Search Console (trang đã index, trang được link nhiều), access log openresty 90 ngày và crawl nội bộ (hơn 70 URL `/images/*` đã thấy khi crawl). Ảnh đang dùng làm og:image (`/images/og-cover.jpg`, `/images/news/*`, `/images/vn-map-workers.svg`, `/images/khang-3d-poster.webp`) giữ nguyên đường dẫn hoặc 301 sang ảnh mới. Biến thể có dấu `/` cuối (`/news/`, `/en/intro/`) cũng phải 1 hop. Cách làm và cấu hình openresty ở `04` mục 2.7.

| # | URL cũ | URL mới | Ghi chú |
|---|---|---|---|
| 1 | `/` | `/` | Giữ |
| 2 | `/intro` | `/ve-chung-toi` | |
| 3 | `/services` | `/dich-vu` | |
| 4 | `/prices` | `/bang-gia` | Chính sách 4 phần đang nằm trong accordion được tách ra `/chinh-sach-bao-hanh` và các trang pháp lý |
| 5 | `/news` | `/kien-thuc` | |
| 6 | `/requirement` | `/doi-tac-tho` | Danh sách việc trở thành section `#viec-dang-tuyen` |
| 7 | `/worker-map` | `/doi-tac-tho` | Title cũ "Tuyển thợ & tiêu chuẩn kỹ thuật viên" |
| 8 | `/system-map` | `/mang-luoi` | Title cũ "Hệ thống thợ kỹ thuật toàn quốc". Phần tiêu chuẩn chuyển sang `/doi-tac-tho` |
| 9 | `/contact` | `/lien-he` | |
| 10 | `/news/lap-dat-may-lanh-dung-cach-7-buoc` | `/kien-thuc/lap-dat-may-lanh-dung-cach-7-buoc` | Giữ slug. Kiểm Search Console trước (10.2) |
| 11 | `/news/10-nguyen-nhan-may-lanh-khong-lanh` | `/kien-thuc/10-nguyen-nhan-may-lanh-khong-lanh` | Giữ slug |
| 12 | `/news/rui-ro-lap-dat-may-giat-khong-dung-cach` | `/kien-thuc/rui-ro-lap-dat-may-giat-khong-dung-cach` | Giữ slug |
| 13 | `/news/chuyen-doi-so-trong-lap-dat-toan-quoc` | `/kien-thuc/chuyen-doi-so-trong-lap-dat-toan-quoc` | Giữ slug, xếp lại vào nhóm B2B |
| 14 | `/news/tuong-lai-nganh-dien-lanh-2026` | `/kien-thuc/tuong-lai-nganh-dien-lanh-2026` | Giữ slug |
| 15 | `/news/robot-va-tu-dong-hoa-gia-dinh` | `/kien-thuc/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai` | **Gộp 2 bài robot** (đang tranh từ khóa, CRO-14) |
| 16 | `/news/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai` | `/kien-thuc/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai` | Bài giữ lại sau khi gộp |
| 17 | `/news/ky-nguyen-ai-nhung-nganh-bi-anh-huong` | **410 Gone**, hoặc giữ dưới `/kien-thuc/` | Bài lạc đề. *Giả định: gỡ (410). Chờ anh quyết.* Không 301 về trang không liên quan vì Google coi là soft 404 |
| 18 | `/en` | `/en` | Giữ |
| 19 | `/en/intro` | `/en/about` | |
| 20 | `/en/services` | `/en/services` | Giữ |
| 21 | `/en/prices` | `/en/pricing` | |
| 22 | `/en/news` | `/en/knowledge` | |
| 23 | `/en/requirement` | `/en/technician-partners` | |
| 24 | `/en/worker-map` | `/en/technician-partners` | |
| 25 | `/en/system-map` | `/en/network` | |
| 26 | `/en/contact` | `/en/contact` | Giữ |
| 27 | `/en/news/lap-dat-may-lanh-dung-cach-7-buoc` | `/en/knowledge/how-to-install-an-air-conditioner-in-7-steps` | Slug EN mới |
| 28 | `/en/news/10-nguyen-nhan-may-lanh-khong-lanh` | `/en/knowledge/10-reasons-your-air-conditioner-is-not-cooling` | |
| 29 | `/en/news/rui-ro-lap-dat-may-giat-khong-dung-cach` | `/en/knowledge/risks-of-improper-washing-machine-installation` | |
| 30 | `/en/news/chuyen-doi-so-trong-lap-dat-toan-quoc` | `/en/knowledge/digital-transformation-in-nationwide-installation` | |
| 31 | `/en/news/tuong-lai-nganh-dien-lanh-2026` | `/en/knowledge/hvac-industry-outlook-2026` | |
| 32 | `/en/news/robot-va-tu-dong-hoa-gia-dinh` | `/en/knowledge/home-robots-and-automation-trends` | Gộp như dòng 15 |
| 33 | `/en/news/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai` | `/en/knowledge/home-robots-and-automation-trends` | |
| 34 | `/en/news/ky-nguyen-ai-nhung-nganh-bi-anh-huong` | 410, hoặc theo quyết định dòng 17 | |

Hạ tầng đi kèm, làm ở openresty và gộp vào cùng 1 hop:
- `http://` → `https://`
- `www` → apex (www hiện trả 502)
- Bật `http2` cho server block apex. www đã đàm phán được h2 nên openresty có hỗ trợ (critic).
- HSTS ≥ 1 năm
- `immutable` cho `/_next/static` và asset 3D

Kiểm tra tự động: một test Playwright/curl đi đủ N URL trong `redirect-inventory.csv` (34 dòng trên + phần kiểm kê thêm) × 4 biến thể × có/không dấu `/`, kiểm mã 301 (hoặc 410, cả bản VI và EN), đúng đích và chỉ 1 hop. Sitemap mới có `lastmod` thật.

---

## 11. Hệ thiết kế (design tokens)

### 11.1 Màu: tiến hóa từ xanh #004AAD và cam #EF8426

**Nguyên tắc cốt lõi:** tách cam thành **token nền (fill)** và **token chữ (text)**. Đây là cách giải quyết mâu thuẫn giữa ux-visual (nút cam chữ trắng, cam đậm #C2600F) và tech-seo (nút cam chữ navy, cam đậm #B85A00). Em đã tính lại tỉ lệ tương phản WCAG 2.x:

| Phương án | Tỉ lệ đo | Kết luận |
|---|---|---|
| Chữ trắng trên cam #EF8426 | **2,63:1** | ❌ Trượt cả ngưỡng 3:1 cho chữ lớn. **Cấm** |
| Cam đậm #C2600F (ux-visual) trên trắng | 4,22:1 | ❌ Trượt 4,5:1 cho chữ thường |
| Cam đậm #B85A00 (tech-seo) trên trắng / trên #F2F8FC | 4,67 / **4,36** | ⚠️ Đạt trên trắng, trượt trên nền xanh nhạt của site |
| **Cam chữ #A94F00** trên trắng / #F2F8FC / #FFF4EA | **5,52 / 5,15 / 5,09** | ✅ Chọn làm `orange-700` |
| **Navy #0A1F44 trên cam #EF8426** (chữ nút cam) | **6,19:1** | ✅ Chọn. tech-seo đúng ở điểm này |

Bảng token (tất cả tỉ lệ đã tính, ngưỡng AA: chữ thường 4,5:1, chữ lớn và UI 3:1):

| Token | Hex | Dùng cho | Cặp kiểm | Tỉ lệ |
|---|---|---|---|---|
| `blue-600` (brand) | `#004AAD` | Logo, link, heading nhấn, nút xanh | trên trắng · trên #F2F8FC · chữ trắng trên nó | 8,13 · 7,59 · 8,13 |
| `blue-700` | `#003A8C` | Hover/pressed của nút xanh | chữ trắng trên nó | 10,59 |
| `navy-900` | `#0A1F44` | Dải tối premium, footer, chữ trên nút cam | chữ trắng trên nó | 16,25 |
| `blue-300` | `#7FAAF0` | Link và icon trên nền navy | trên navy | 6,89 |
| `blue-100` | `#E8F1FC` | Nền chip, nền thẻ | chữ blue-600 trên nó | 7,13 |
| `blue-50` | `#F2F8FC` | Nền section sáng (giữ từ site cũ) | chữ navy trên nó | 15,17 |
| `orange-500` (brand) | `#EF8426` | **CHỈ fill**: nền nút CTA, mũ KHANG, cột sáng bản đồ, icon | chữ navy trên nó | 6,19 |
| `orange-400` | `#F59A4A` | Hover của nút cam | chữ navy trên nó | 7,43 |
| `orange-700` | `#A94F00` | **CHỈ chữ** cam trên nền sáng (từ khóa nhấn, eyebrow) | trên trắng · #F2F8FC | 5,52 · 5,15 |
| `orange-200` | `#FFB778` | Chữ cam trên nền navy | trên navy | 9,51 |
| `orange-50` | `#FFF4EA` | Nền badge "Bảo hành" | chữ orange-700 trên nó | 5,09 |
| `ink-900` | `#0F172A` | Chữ chính | trên trắng | 17,85 |
| `slate-600` | `#475569` | Chữ phụ | trên trắng · #F2F8FC | 7,58 · 7,08 |
| `slate-500` | `#64748B` | Viền input, caption (chỉ trên nền trắng) | trên trắng | 4,76 |
| `slate-300` | `#CBD5E1` | Đường kẻ trang trí (không dùng cho viền input) | — | 1,48 (chỉ trang trí) |
| `danger-700` | `#B3261E` | Lỗi form | trên trắng | 6,54 |
| `success-700` | `#1F7A3A` | Thành công | trên trắng | 5,38 |
| `warning-text` | `#8A5A00` | Chữ cảnh báo | trên trắng | 5,93 |

Tỉ lệ diện tích trên một màn hình: **trung tính và trắng ~70% · xanh/navy ~22% · cam ~8%**. Cam chỉ dành cho một CTA chính mỗi màn hình và điểm nhấn của KHANG. Quy tắc phụ:
- **Cấm mọi màu ngoài token.** Các màu vàng đất #DEAB5B, hồng #ff69b4, tím gradient đang có sẽ bị loại (UX-11).
- Không đặt chữ cam lên nền xanh #004AAD (3,1:1). Chỉ chấp nhận với chữ ≥ 24px, và nên tránh hẳn.
- Nút cam trên nền trắng có viền nút chỉ 2,63:1, chưa đạt 3:1 cho thành phần UI. Nhãn chữ navy đủ để nhận biết nút, nhưng **thêm viền 1px `orange-700`** để chắc chắn đạt.
- Focus ring: outline 3px `blue-600`, offset 2px trên nền sáng; `orange-200` trên nền navy.
- CI chạy axe-core. Fail nếu `color-contrast` có lỗi. Hiện lỗi này fail ở mọi lần đo Lighthouse.

### 11.2 Typography tiếng Việt

- **Be Vietnam Pro** qua `next/font/google`: tải lúc build và tự host trên domain của site, không gọi Google lúc chạy.
  - `subsets: ['latin','latin-ext','vietnamese']`, weight 400/500/600/700, `display: 'swap'`, `adjustFontFallback`.
  - Hiện site **không tải web font nào**. Be Vietnam Pro chỉ hiện nếu máy người xem đã cài sẵn (critic, solid_facts).
- Một font cho toàn site. Không dùng font viết tay. Số liệu và giá dùng `font-variant-numeric: tabular-nums`.
- **Dấu tiếng Việt:** line-height của heading ≥ 1,1 (mẫu MD dùng 1,06, dễ chạm dấu ở dòng 2). Tracking âm tối đa −0,02em. Trước khi chốt thang chữ phải test chuỗi "ẦẪỆ Ước Hưởng" ở mọi cỡ heading, xuống 2 dòng, trên Safari iOS và Chrome Android.

| Token | Cỡ (clamp) | LH | Weight | Dùng |
|---|---|---|---|---|
| `display` | clamp(2.5rem, 4.6vw, 4.5rem) | 1.1 | 700 | H1 hero trang chủ |
| `h1` | clamp(2rem, 3.4vw, 3.25rem) | 1.15 | 700 | H1 trang con |
| `h2` | clamp(1.625rem, 2.6vw, 2.5rem) | 1.2 | 600 | Tiêu đề section |
| `h3` | clamp(1.25rem, 1.6vw, 1.5rem) | 1.3 | 600 | Tiêu đề card |
| `lead` | clamp(1.125rem, 1.4vw, 1.375rem) | 1.55 | 500 | Câu dẫn hero/section |
| `body` | 1rem (16px, tối thiểu trên mobile) | 1.65 | 400 | Nội dung |
| `small` | 0.875rem | 1.5 | 400/500 | Chú thích, meta |
| `eyebrow` | 0.75rem, UPPERCASE, tracking 0.14em | 1.4 | 600 | Nhãn section, ≤ 4 từ (chỗ duy nhất được viết hoa) |
| `kpi` | clamp(2.25rem, 4vw, 3.5rem), tabular-nums | 1.0 | 700 | Số liệu |

### 11.3 Lưới, khoảng cách, bo góc, bóng, icon

- **Container:** nội dung tối đa 1280px, dải full-bleed tối đa 1440px. Side gutter `clamp(16px, 4vw, 64px)`, đúng 16px ở 360–390px.
- **Lưới:** 12 cột (≥ 1024, gutter 24px) · 8 cột (768–1023) · 4 cột (< 768, gutter 16px).
- **Khoảng cách (bội số 4):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128. Padding section `clamp(64px, 10vw, 128px)`.
- **Breakpoint phải test tràn ngang:** 360 · 390 · 414 · 768 · 1024 · 1280 · 1366 · 1440 · 1920. Thêm `body { overflow-x: clip }` làm lưới an toàn. Mọi phần tử trang trí dạng absolute đều nằm trong wrapper `overflow: clip`. Gốc các lỗi tràn hiện tại là phần tử px cố định không bị clip: `/` 527px trên viewport 390, `/services` khoảng 1463px trên 1440, `/worker-map` 1068px trên 1024 (critic).
- **Bo góc:** `sm 8` (input, chip) · `md 12` (card nhỏ) · `lg 20` (panel, ảnh) · `xl 28` (thẻ hero) · `pill 999` (nút). Ảnh và card bo cùng `lg`.
- **Bóng (pha navy, không dùng đen thuần):**
  - `shadow-1`: 0 1px 2px rgba(10,31,68,.06), 0 2px 8px rgba(10,31,68,.06)
  - `shadow-2`: 0 8px 24px rgba(10,31,68,.10)
  - `shadow-3`: 0 24px 64px rgba(10,31,68,.14) (thẻ nổi, modal)
- **Icon:** một bộ outline duy nhất, nét 1,5px, lưới 24px (Lucide, giấy phép ISC). Ngoài ra có **6–8 icon 3D** cho nhóm dịch vụ, render chung ánh sáng với KHANG. **Không dùng emoji** trong giao diện.

### 11.4 Quy tắc hình ảnh cho UI (ảnh, mascot, minh họa)

Art direction cho **cảnh 3D của phim** nằm ở mục 6. Mục này áp dụng cho ảnh và minh họa trong các section HTML.

Hiện site lẫn ít nhất 7 ngôn ngữ hình ảnh: mascot chibi, thợ 3D hoạt hình, isometric, stock phương Tây, banner núi tuyết, bản đồ hành chính nhiều màu, emoji (UX-09; `research/screenshots/slices/home--desktop--02.jpg`, `research/screenshots/slices/worker-map--desktop--01.jpg`). Quy tắc mới chia 3 lớp:

| Lớp | Được dùng | Không được dùng |
|---|---|---|
| **Ảnh thật** | Thợ Bluebolt mặc đồng phục, đội điều phối, công trình thật. Chụp cùng tông (nhiệt độ màu trung tính ấm, nền sạch). **Mục "Công trình" và case study chỉ dùng ảnh thật**, có tỉnh và ngày | Ảnh render hoặc AI trong mục "công trình thực tế". Đây là rủi ro niềm tin đã thấy ở mẫu MD |
| **Mascot KHANG 3D** | Một rig, một bộ vật liệu, một setup ánh sáng (key trên-trái, rim xanh `blue-300`, nền sạch). Bộ pose cố định: chào, chỉ tay, cầm cờ lê, CSKH headset, đang suy nghĩ. Chỉ xuất hiện ở 3 vị trí nêu ở mục 6.4 (tượng nhỏ trong shot 0, avatar trên app thợ, CTA cuối/404/empty state) | KHANG ở mọi section. Câu "Hj! Em là…", emoji 🤣 (UX-28) |
| **Minh họa thiết bị** | Máy lạnh, máy giặt cách điệu, **không logo, không kiểu dáng nhận diện của hãng nào** | Logo hãng trên thiết bị. Stock "gia đình phương Tây + robot", "cô gái headset vs robot", núi Himalaya (UX-09, UX-34) |

- **Không đặt chữ trong ảnh** (raster text không dịch được).
- Chữ trên ảnh luôn có scrim hoặc card đặc để đủ tương phản (UX-02).
- Ảnh xuất AVIF/WebP, hero rộng ≥ 2560px cho desktop. Chỉ preload **đúng 1** ảnh hero.
- Logo hãng và sàn đối tác chỉ đưa lên khi **có văn bản đồng ý**.

### 11.5 Giọng văn

| Quy tắc | Sai (đang có) | Đúng |
|---|---|---|
| Sentence case, không VIẾT HOA giữa câu | "Cước phí CẠNH TRANH", "Điều phối THÔNG MINH" | "Cước phí cạnh tranh" |
| Không "?!?", "!!", không giọng teen | "Vấn đề ở đâu?!?", "An toàn - Tiết kiệm - Yên tâm!!" | "Vì sao hãng khó kiểm soát chất lượng lắp đặt?" |
| Không viết tắt nội bộ | "BBSV xác nhận lịch" | "Bluebolt xác nhận lịch" |
| Số luôn có định nghĩa, đơn vị, ngày | "500+ thợ chuyên nghiệp", "3000k+" | "[___] thợ hoạt động trong 90 ngày (cập nhật dd/mm/yyyy)" |
| Không tự khen suông | "tay nghề tuyệt đỉnh", "hài lòng tuyệt đối" | Một con số hoặc bằng chứng thay cho một tính từ |
| Hotline một cách viết | 0902 8080 49 / 0902.808.049 | VI `0902 808 049` · EN `+84 902 808 049` |
| Xưng hô | Lẫn "Em", "Chúng tôi", "BBSV" | "Bluebolt" / "chúng tôi" với khách, "bạn" với thợ |

---

## 12. Motion 2.5D cho phần ngoài phim

Ngữ pháp máy quay (mục 3) áp dụng cho phim. Mục này áp dụng cho mọi thứ còn lại: section sau phim, trang con, micro-interaction.

### 12.1 Token

| Token | Giá trị | Ghi chú |
|---|---|---|
| `ease-entry` | `cubic-bezier(.16,1,.3,1)` | Vào cảnh (học từ MD) |
| `ease-glide` | `cubic-bezier(.32,.72,0,1)` | Hover, micro-interaction |
| `ease-standard` | `cubic-bezier(.65,0,.35,1)` | Chuyển trạng thái |
| `dur-fast / base / medium / slow` | 160 / 240 / 520 / 880 ms | |
| `stagger-card / stagger-word` | 60 / 40 ms | |
| `rise-distance` | desktop 24px · mobile 12px | |

### 12.2 Danh sách hiệu ứng có tên

| Tên | Mô tả | Thời lượng / easing | Desktop ≥1024 + pointer:fine | Tablet / mobile | Reduced-motion |
|---|---|---|---|---|---|
| `hero-intro` | Ảnh hero zoom-out 1,08 → 1, eyebrow → H1 → lead → CTA lần lượt | 1.400ms ảnh; chữ 520ms, cách 60ms | ✅ | ✅ (chỉ chữ, không zoom) | Tắt |
| `rise` | translateY + opacity khi vào khung nhìn | 520ms `ease-entry` | ✅ | ✅ 12px, 400ms (CSS/IO) | Tắt |
| `reveal-words` | H2 hiện từng từ. Tách từ ở server, `aria-label` trên thẻ cha | 40ms/từ | ✅ tối đa 1 lần mỗi màn hình | ❌ dùng `rise` cả dòng | Tắt |
| `curtain` | Ảnh vén bằng clip-path `inset(100% 0 0 0)` → 0, kèm scale 1,05 → 1 | 880ms `ease-entry` | ✅ | ✅ (CSS) | Ảnh hiện ngay |
| `ken-burns` | Ảnh lớn scale 1,08 → 1 và x 2%, gắn theo cuộn, biên độ ≤ 8% | scrub | ✅ | ❌ | Tắt |
| `parallax-layer` | Các lớp hero lệch nhau theo cuộn (yPercent 0 → 8) | scrub | ✅ | ❌ | Tắt |
| `stagger-grid` | Card dịch vụ/bảng giá hiện so le theo `--i` | 520ms + `--i`×60ms | ✅ | ✅ | Tắt |
| `count-up` | KPI chạy từ 0 lên. **Giá trị cuối có sẵn trong HTML SSR.** Cập nhật `textContent` qua rAF, **không setState mỗi frame** (bài học FE-01) | 1.200ms ease-out, 1 lần | ✅ | ✅ | Hiện số cuối |
| `magnetic-cta` | Nút chính hút nhẹ về con trỏ ≤ 6px, vệt sáng quét khi hover, nhấn co 0,98 | 240ms `ease-glide`; vệt sáng 1.100ms | ✅ | ❌ (chỉ phản hồi khi nhấn) | Chỉ đổi màu |
| `tilt-card` | Card nghiêng theo con trỏ ≤ 5°, perspective 1200px | 240ms | ✅ | ❌ | Tắt |
| `page-transition` | React `<ViewTransition>`: crossfade 240ms + morph phần tử chung (card dịch vụ → trang chi tiết) 400ms | `ease-standard` | ✅ | ✅ nếu trình duyệt hỗ trợ (~91,75%), không thì không có hiệu ứng | Tắt |
| `step-caption` | Chữ từng bước của phim hiện bằng `rise` khi shot tới đoạn dừng đọc (mục 3.2, luật 7) | 400ms `ease-entry` | ✅ | ✅ (card cuộn native) | Hiện ngay |
| `map-rise` | Tỉnh mọc khối Bắc → Nam (shot 2 và `/mang-luoi`) | ~1.600ms theo cuộn | ✅ | ✅ trong chuỗi ảnh T-SEQ | Trạng thái cuối |
| `scroll-progress` | Vạch 2px dưới header, CSS `animation-timeline: scroll(root)` | — | Bài viết dài | Bài viết dài | Ẩn |

**Luật cứng:**
1. Chỉ animate `transform`, `opacity`, `clip-path`. Không animate thuộc tính gây layout.
2. **Phần tử LCP (H1 hero, poster) không được bắt đầu ở `opacity:0`**, vì sẽ làm chậm LCP. Chỉ animate transform/clip.
3. **Không animate:** giá, hotline, nội dung pháp lý, trường form, thông báo lỗi.
4. Mỗi màn hình tối đa một hiệu ứng "lớn" (reveal-words, scrub, WebGL).
5. Không hiệu ứng nào chạy vô hạn. Nếu có loop, nó dừng khi ra khỏi viewport. Sẽ bỏ các keyframe hiện có `float-bob`, `snow-spin`, `robot-ripple` (A11Y-03).
6. Nội dung luôn hiện ra nếu JS lỗi. Kiến trúc học từ MotionEngine của MD: `html[data-motion=pending]`, tự gỡ sau 4 s.

### 12.3 Ba tầng motion (ngoài phim; phim dùng 4 tầng ở mục 7.2)

| Tầng | Điều kiện | Được bật |
|---|---|---|
| **Full** | `(min-width:1024px) and (pointer:fine)` + không reduced-motion | GSAP ScrollTrigger (dynamic import), mọi hiệu ứng trên, WebGL theo tier GPU |
| **Lite** | Còn lại (mobile, tablet, cảm ứng) | Chỉ CSS scroll-driven / IntersectionObserver: `rise`, `curtain`, `stagger-grid`, `count-up`, `map-rise` (tier ≥ 2). Không scrub, không pin, không parallax |
| **Still** | `prefers-reduced-motion: reduce` hoặc Save-Data | Không chuyển động, không tải 3D hay video. Poster và SVG |

### 12.4 Quyết định smooth scroll

**Quyết định: KHÔNG bật smooth scroll mặc định khi ra mắt.** Toàn site dùng cuộn native, GSAP ScrollTrigger chạy trên cuộn native. **Lenis 1.3.26 (MIT) chỉ là tùy chọn cho desktop**, nằm sau feature flag và được đem vào so sánh A/B trong prototype. Lenis chỉ được bật cho production khi đủ cả 3 điều kiện:

1. Anh Duy chọn bản có Lenis trong so sánh A/B mù (cùng trang, có và không có Lenis).
2. TBT lab và INP không vượt ngân sách (mục 8) khi bật.
3. Tắt cứng trên `/mang-luoi`, `/bang-gia`, mọi trang có form, và khi mở modal.

Lý do và cách giải quyết mâu thuẫn trong research:

| Nguồn | Ý kiến | Em xử lý |
|---|---|---|
| tech-3d | Lenis cho desktop | Đồng ý giới hạn desktop, nhưng không bật mặc định |
| tiktok-sample | Mức liên quan "trung bình". Chỉ làm sau khi hạ TBT, cho anh so A/B | Làm đúng như vậy: A/B trong prototype |
| benchmark | Scrolljacking là anti-pattern (NN/g) | Lenis làm mượt bánh xe, không chiếm thứ tự nội dung. Pin/scrub dài thì vẫn cấm trên mobile |
| Mẫu MD | GSAP ScrollSmoother 1.15 | **Không dùng ScrollSmoother.** Nó bọc nội dung trong wrapper `position:fixed` + transform, làm hỏng `position: sticky` (cần cho phim và lớp ảnh sticky trên mobile) và có bóng ma khi lướt nhanh (video t≈14 s, `research/agent-notes/creative-technologist/tiktok-frames/`) |

Cảm giác "mượt" chủ yếu đến từ easing tốt, ảnh không giật và không có long task. Smooth scroll không phải nguồn chính.

---

## 13. Storyboard trang chủ và khung các trang

### 13.1 Header và thanh hành động mobile (dùng chung toàn site) — P0

```
DESKTOP (sticky, nền trắng, có bóng khi cuộn)
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Bluebolt]  Giải pháp ▾  Dịch vụ  Bảng giá  Mạng lưới  Đối tác thợ  Kiến thức│
│                                       VI|EN   ☎ 0902 808 049  [Nhận báo giá] │
└──────────────────────────────────────────────────────────────────────────────┘
  Giải pháp ▾ = mega menu: Hãng điện máy · Sàn TMĐT & bán lẻ · (link) Hỗ trợ khách lẻ

MOBILE
┌──────────────────────────┐            thanh dính đáy (safe-area)
│ [Bluebolt]      ☎   ☰   │            ┌──────────┬──────────┬──────────────┐
└──────────────────────────┘            │  Gọi     │  Zalo    │ Nhận báo giá │
                                        └──────────┴──────────┴──────────────┘
  Trên /doi-tac-tho, nút phải đổi thành "Đăng ký thợ"
```

Một header cho mọi trang (hiện home mobile không có hamburger, UX-01/UX-33). Bỏ ô tìm kiếm toàn site và widget "Products" (UX-19).

Trong vùng phim, header **trong suốt, chữ trắng** trên cảnh tối. Ra khỏi phim thì chuyển về nền trắng có bóng.

### 13.2 Phim trang chủ, desktop (≥ 1024 px, T-FULL / T-LITE) — P0 (độ dài theo prototype được chọn)

Ký hiệu: `[▓]` = canvas toàn khung, `│ HTML │` = lớp chữ HTML thật, `◉` = thanh chương.

> Storyboard dưới vẽ đủ 6 shot của C. **A+** dùng shot 0 → 1 → `screen-hold` (máy dừng khi màn hình lớn phủ ~85–90% bề ngang, website cuộn trên màn hình 60–100 vh, laptop còn ở mép dưới, phòng đã tối) → handoff sang HeroScreen (H2) → "Ba cửa vào". **B** chèn shot 2 trước handoff. Khung đầu là POV người ngồi, phòng sáng dịu, dàn lạnh thấy trọn (mục 4), không phải phòng tối. Câu khẳng định (34 tỉnh, chuẩn hãng, E-KYC, bảo hành) đọc từ `content/claims.ts`, chưa có bằng chứng thì không hiển thị.

```
SHOT 0 — PHÒNG ĐIỀU PHỐI · establish + handheld · 0–100 vh · LCP = H1
┌──────────────────────────────────────────────────────────────────────────────┐
│ [header trong suốt]                                                        ◉ │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓○ │
│ │ MẠNG LƯỚI LẮP ĐẶT [__ TỈNH/THÀNH]│ ▓▓▓▓  ┌───────────────┐ màn hình lớn  ○ │
│ │ Hạ tầng lắp đặt toàn quốc        │ ▓▓▓▓  │ bản đồ VN · • • │ (xa, chéo)  ○ │
│ │ cho hãng điện máy                │ ▓▓▓▓  └───────────────┘               ○ │
│ │ Lắp chuẩn hãng, điều phối thợ    │ ▓▓   ┌─────────┐  ☕ [dàn lạnh+đồ nghề]○ │
│ │ gần nhất, nghiệm thu bằng ảnh.   │ ▓▓   │dashboard│ laptop (gần, chéo 32°) │
│ │ [Nhận báo giá →] (Đối tác thợ)   │ ▓▓   └─────────┘  ánh xanh hắt lên bàn  │
│ │ Bỏ qua phần giới thiệu ↓         │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────────────────────────────────────────────────────┘
 Lớp HTML có scrim navy 0 → 70% từ trái. H1 (duy nhất của trang) do server render, không bao giờ bắt đầu ở
 opacity 0. Link "Bỏ qua phần giới thiệu ↓" nhìn thấy được, nhảy tới #ba-cua-vao. Eyebrow chờ anh xác nhận phạm vi.

SHOT 1 — MỘT ĐƠN VỪA ĐẾN · dolly-in 32° → 0° · 100–200 vh
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▓▓ màn hình lớn mờ dần phía sau (trôi chậm hơn = thị sai) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ◉ │
│        ┌────────────────────────────────────────────┐   │ 01               │ │
│        │ DASHBOARD ĐIỀU PHỐI      [Giao diện minh họa]│   │ Tiếp nhận đơn    │ │
│        │ ┌ Đơn mới ─────────────────────────┐ ← trượt │   │ Đơn từ Hãng/Sàn  │ │
│        │ │ Lắp điều hòa 12.000 BTU · Thủ Đức│   vào   │   │ vào hệ thống qua │ │
│        │ └──────────────────────────────────┘         │   │ kênh đã thống    │ │
│        └────────────────────────────────────────────┘   │ nhất.            │ │
│                    laptop gần chính diện                  (rise khi dừng)   │
└──────────────────────────────────────────────────────────────────────────────┘

SHOT 2 — TÌM THỢ GẦN NHẤT · push-through màn hình lớn → crane top-down · 200–320 vh
┌──────────────────────────────────────────────────────────────────────────────┐
│ │ 02 Điều phối thợ        │          ▲ Hoàng Sa (Đà Nẵng)                   ◉ │
│ │ Hệ thống chọn thợ gần   │      ▓▓▓▓▓  ● ● (ghim thợ cam)                     │
│ │ nhất, đúng kỹ năng.     │        ▓▓▓▓▓▓●                                     │
│ │ [__] thợ · [__]/34 tỉnh │          ▓▓▓▓  ⟍ đường nối đơn → thợ                │
│ │ (KPI K1, K2, count-up)  │            ▓▓▓▓▓●          ▲ Trường Sa (Khánh Hòa)  │
│ │ [Xem mạng lưới →]       │              ▓▓▓●▓                                  │
└──────────────────────────────────────────────────────────────────────────────┘
 Tỉnh mọc khối Bắc → Nam. Khung luôn chứa toàn quốc + 2 quần đảo (fit theo bbox).

SHOT 3 — TỚI NHÀ KHÁCH · crane ngược, cắt qua cửa sổ · 320–420 vh
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▓▓ phòng khách giờ vàng, nắng xiên ▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │ 03                 │ ◉ │
│   ┌──────────┐                                      │ Xác nhận lịch hẹn  │   │
│   │ APP THỢ  │  ← điện thoại tiền cảnh              │ Thợ gọi khách xác  │   │
│   │ 14:00 hôm│                                      │ nhận giờ, địa điểm │   │
│   │ nay      │                                      │ SLA vùng: [__] h   │   │
│   │[Đã gọi ✓]│                                      └────────────────────┘   │
│   └──────────┘                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

SHOT 4 — LẮP CHUẨN HÃNG · orbit 55° quanh dàn lạnh · 420–520 vh
┌──────────────────────────────────────────────────────────────────────────────┐
│ │ 04 Lắp đặt & nghiệm thu │      ╔══════════════════╗ dàn lạnh tách lớp   ◉ │
│ │ • Thợ xác minh E-KYC    │      ║  ▭▭▭▭▭▭▭▭▭▭▭▭▭  ║ rồi ghép lại           │
│ │ • Đúng chuẩn kỹ thuật   │      ╚════════╤═════════╝                        │
│ │   của hãng              │               ╰──── ống đồng chạy ra ban công ──▶ │
│ │ • Ảnh trước / sau       │                                                  │
│ │ [Tiêu chuẩn thợ →]      │                                                  │
└──────────────────────────────────────────────────────────────────────────────┘

SHOT 5 — NGHIỆM THU & ĐỐI SOÁT · rack-focus → cắt về laptop → dolly-in + push-through · 520–660 vh
┌──────────────────────────────────────────────────────────────────────────────┐
│ (a) máy lạnh mờ ░░░░░  ┌──────────┐ ← nét      │ 05 Đối soát & bảo hành │ ◉ │
│                        │NGHIỆM THU│            │ Báo cáo, đối soát với  │   │
│                        │ [ảnh] ✓  │            │ Hãng/Sàn. Khách đăng   │   │
│                        │ Ký: ____ │            │ ký bảo hành 7 ngày.    │   │
│                        └──────────┘            │ [Đặt lịch demo 30']    │   │
│ (b) laptop: BÁO CÁO ĐỐI SOÁT THÁNG → lấp khung → crossfade 200 ms →         │
│     ══════════════ HANDOFF: section HTML "Ba cửa vào" (cuộn native) ══════  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 13.3 Phim trang chủ, mobile (màn nhỏ hoặc dọc, T-SEQ) — P0

Cùng các shot của phương án đã chọn, cùng góc máy, nhưng là **video dọc 9:16** render sẵn, cuộn để tua (chuỗi ảnh là dự phòng). Chữ **không đè lên ảnh**: video chiếm nửa trên (sticky 55svh), chữ từng bước là card cuộn native ở nửa dưới. Bố cục khung dọc render riêng, không cắt từ khung ngang: khung cuối chỉ lấy laptop cộng 2/3 màn hình (prototype hiện để nửa trên tối trống và chữ trong màn hình bị cắt mép, `prototype/shots/mode-mobile-scrub50.png`). Khung dọc hợp với **điện thoại app thợ ở tiền cảnh** hơn là monitor ngang. Không đặt badge "Prototype" trong vùng nội dung.

```
SHOT 0 (màn hình đầu)         SHOT 1–5 (mỗi shot ~80 vh)       SAU HANDOFF
┌──────────────────────┐      ┌──────────────────────┐        ┌──────────────────────┐
│ [Bluebolt]    ☎  ☰  │      │ [Bluebolt]    ☎  ☰  │        │ BA CỬA VÀO           │
│ MẠNG LƯỚI [__] TỈNH  │      │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ sticky │ ┌──────────────────┐ │
│ Hạ tầng lắp đặt      │      │▓ video tua         ▓▓│ 55svh  │ │ Hãng & Sàn     → │ │
│ toàn quốc cho hãng   │      │▓ theo tiến độ cuộn ▓▓│        │ └──────────────────┘ │
│ điện máy             │      │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│        │ ┌──────────────────┐ │
│ Lắp chuẩn hãng, ...  │      ├──────────────────────┤        │ │ Thợ kỹ thuật   → │ │
│ [Nhận báo giá →]     │      │ 02 Điều phối thợ     │ card   │ └──────────────────┘ │
│ (Đối tác thợ)        │      │ Hệ thống chọn thợ... │ cuộn   │ ┌──────────────────┐ │
│ Bỏ qua giới thiệu ↓  │      │ [__] thợ · [__]/34   │ native │ │ Khách lẻ       → │ │
│▓▓▓ poster shot 0 ▓▓▓▓│      │ ● ● ○ ○ ○ (chương)   │        │ └──────────────────┘ │
├──────┬──────┬────────┤      ├──────┬──────┬────────┤        ├──────┬──────┬────────┤
│ Gọi  │ Zalo │Báo giá │      │ Gọi  │ Zalo │Báo giá │        │ Gọi  │ Zalo │Báo giá │
└──────┴──────┴────────┘      └──────┴──────┴────────┘        └──────┴──────┴────────┘
 Chữ trên nền đặc, poster bên dưới. Mọi bản đồ phải thấy cả Hoàng Sa, Trường Sa ở 360 px, nhãn ≥ 11 px, không bị
 phần tử nào che (NFR-MAP-01 ở 04).
```

T-STILL (reduced-motion): giống mobile, nhưng nửa trên là **một ảnh tĩnh** mỗi bước, không sticky và không scrub.

### 13.4 Các section sau phim (cuộn native, motion 2.5D)

Shot 1–5 đã kể quy trình 5 bước và bản đồ, nên **trang chủ không lặp lại** khối quy trình và khối bản đồ ở dưới. Các section còn lại giữ như bản v1, có chỉnh nhỏ.

```
P1 BA CỬA VÀO — P0 (đích của handoff, id="ba-cua-vao")
┌───────────────────────┬───────────────────────┬───────────────────────┐
│ HÃNG & SÀN            │ THỢ KỸ THUẬT          │ KHÁCH LẺ              │
│ [ảnh thật/3D icon]    │ [ảnh thợ thật]        │ [KHANG CSKH]          │
│ Phủ 34 tỉnh, SLA,     │ Đơn ổn định, thu nhập │ Gọi, Zalo, đăng ký    │
│ đối soát VAT          │ minh bạch             │ bảo hành 7 ngày       │
│ [Giải pháp cho hãng →]│ [Đăng ký đối tác →]   │ [Hỗ trợ khách lẻ →]   │
└───────────────────────┴───────────────────────┴───────────────────────┘
Ảnh và chữ tách vùng, không để bullet đè ảnh (UX-35). Mobile: 3 card xếp dọc, gọn.

P2 DẢI TIN CẬY — P0 (logo: P1, chờ phép). KPI K1–K2 đã xuất hiện ở shot 2; dải này nhắc lại đủ 4 KPI
┌──────────────────────────────────────────────────────────────────────────────┐
│ [KPI 1] [KPI 2] [KPI 3] [KPI 4]   ← bộ KPI mục 14.2, count-up                │
│ Đối tác: [logo][logo][logo][logo] → (chỉ hiện khi có văn bản đồng ý)         │
└──────────────────────────────────────────────────────────────────────────────┘
Mobile: KPI dạng lưới 2×2. Logo chạy ngang chậm, dừng khi reduced-motion.

P3 VẤN ĐỀ → GIẢI PHÁP — P0 (thay 6 ô xanh rỗng, UX-17)
┌──────────────────────────────┬───────────────────────────────────────────────┐
│ Vì sao hãng khó kiểm soát     │ ① Một đầu mối cho 34 tỉnh          [bằng chứng]│
│ chất lượng lắp đặt?  (h2,     │ ② Thợ xác minh E-KYC, chuẩn hãng   [bằng chứng]│
│ reveal-words)                 │ ③ Nghiệm thu bằng ảnh trên app     [bằng chứng]│
│ 3 nỗi đau gạch đầu dòng       │ ④ Đối soát và hóa đơn minh bạch    [bằng chứng]│
└──────────────────────────────┴───────────────────────────────────────────────┘
Mỗi lợi ích đi kèm 1 con số hoặc 1 ảnh thật. Mobile: danh sách gọn, không dùng ô 200px.

P4 DỊCH VỤ — P0
┌────────────┬────────────┬────────────┬────────────┐
│ Lắp đặt     │ Lắp đặt     │ Bảo trì     │ Lắp robot   │  icon 3D + 1 dòng + link
│ điều hòa    │ điện máy    │ định kỳ     │ hút bụi     │  (stagger-grid, morph sang chi tiết)
└────────────┴────────────┴────────────┴────────────┘

P5 BẰNG CHỨNG — P1 (chờ phép)
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Video Bluebolt × Panasonic]   │  Case study: "Hãng X — N tỉnh trong M tuần"  │
│ (facade: ảnh + nút play,       │  1 chỉ số kết quả + trích dẫn người thật     │
│  chỉ tải video khi bấm)        │                                              │
└──────────────────────────────────────────────────────────────────────────────┘

P6 TIÊU CHUẨN THỢ BLUEBOLT — P1
  4 nhóm tiêu chuẩn (bằng cấp · kỹ năng · tác phong · an toàn TCVN/QCVN) dạng badge.
  Ghi chú: trích dẫn TCVN 5687:2024 và QCVN 25:2025/BKHCN chưa được kiểm chứng.

P7 KIẾN THỨC — P1
  3 card bài mới nhất: category · ngày · thời gian đọc · excerpt 2 dòng.

P8 CTA CUỐI — P0 (form: chờ contract)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Sẵn sàng triển khai lắp đặt tại 34 tỉnh?   [Nhận báo giá]  [Đặt lịch demo 30']│
│ [KHANG cầm cờ lê, poster render, góc phải]                                   │
│ Form B2B: tên · công ty · chức vụ · SĐT · email công ty · ngành hàng ·        │
│           sản lượng/tháng · khu vực   → màn hình cảm ơn ghi thời gian gọi lại │
└──────────────────────────────────────────────────────────────────────────────┘
Mỗi trang chỉ có MỘT khối CTA cuối (UX-32).

P9 FOOTER — P0 (nền navy-900)
  4 cột: Giải pháp · Dịch vụ · Công ty · Pháp lý | pháp nhân + MST + địa chỉ |
  hotline · email · Zalo OA | © dòng mới | BỎ STK ngân hàng, BỎ "Sẽ cập nhật sau!",
  BỎ icon mạng xã hội chưa có link thật. Mobile: accordion.
```

### 13.5 Khung các trang khác

| Trang | Khối chính (theo thứ tự) | Shot / motion | Ưu tiên |
|---|---|---|---|
| `/giai-phap/hang-dien-may` | Hero B2B + CTA demo → nỗi đau của hãng → bảng SLA theo vùng → quy trình 5 bước (HTML, ảnh tĩnh từ phim) → đối soát & VAT (giải thích chuyện hóa đơn vật tư) → case study → so sánh tự quản / địa phương / Bluebolt → FAQ B2B → form B2B | Hero: video loop `dolly-in` laptop dashboard (7.5). count-up | P0 |
| `/giai-phap/san-tmdt-ban-le` | Hero → sơ đồ tích hợp (đơn từ sàn → Bluebolt → thợ → trạng thái trả về sàn) → khung giá theo nhóm thiết bị → SLA → khiếu nại/đổi thợ → form "Thảo luận tích hợp" | Hero: loop báo cáo đối soát. Sơ đồ luồng animate bằng SVG | P0 |
| `/giai-phap` (hub) | Hai thẻ lớn + bảng so sánh | 2.5D | P1 |
| `/dich-vu` + chi tiết | Hub 4 nhóm. Chi tiết: phạm vi, thiết bị, đã gồm / chưa gồm, bảo hành (bảng SLA chung), quy trình, FAQ, CTA | `/dich-vu/lap-dat-dieu-hoa`: loop `orbit` dàn lạnh. Hub: view transition card → chi tiết | P0 (hub + điều hòa) / P1 / P2 |
| `/bang-gia` | "Khung giá vật tư tham khảo (thợ thu tại chỗ)": bảng lọc theo thiết bị/vùng, VAT, ngày hiệu lực, tải PDF → giá theo hợp đồng cho B2B + form → link chính sách bảo hành | **Không motion, không shot.** Không Lenis | P0 |
| `/mang-luoi` | Bản đồ 34 tỉnh tương tác → bảng 34 tỉnh có tìm kiếm → SLA theo vùng → CTA "Triển khai tại tỉnh của bạn" | **WebGL live** (cùng scene shot 2, hover/tap từng tỉnh). Fallback SVG + bảng | P0 (SVG + bảng) / P1 (WebGL) |
| `/doi-tac-tho` | Hero thợ + "Đơn ổn định, thu nhập minh bạch" → thu nhập tham khảo (số thật) → cách nhận tiền, phí nền tảng, ví → lộ trình gia nhập 4 bước → tiêu chuẩn → việc đang tuyển → lời chứng thực → FAQ → **form 4 trường** + link tải app | Hero: ảnh/video thật thợ cầm app (ưu tiên), hoặc loop app thợ từ shot 3. rise, stagger | P0 |
| `/ho-tro-khach-hang` | Gọi/Zalo → đăng ký bảo hành 7 ngày (form) → thời hạn bảo hành → "Bluebolt không yêu cầu chuyển khoản cá nhân cho thợ" | 2.5D | P1 (giả định nhánh A) |
| `/tra-cuu` | Mã đơn + SĐT → trạng thái, tên thợ, lịch hẹn | — | **P2, cần backend/API**, chưa kiểm chứng app BBSV có API |
| `/ve-chung-toi` | Sứ mệnh → KPI → mốc phát triển → đội ngũ, văn phòng (ảnh thật) → pháp nhân, MST → đối tác | Hero: ảnh tĩnh phòng điều phối (khung cuối shot 0). KHANG pose nhẹ | P1 |
| `/kien-thuc` + bài | Hub 3 nhóm. Bài: giữ template 7 bước (UX-27), marker xanh, mục lục sticky, scroll-progress, schema Article/FAQ | scroll-progress | P1 |
| `/lien-he` | 3 kênh theo bộ phận → địa chỉ chữ + bản đồ facade → bảng giờ hoạt động | — | P0 |
| Pháp lý (3 trang) | Template văn bản có mục lục, nội dung do pháp chế viết | — | P0 (template) |
| 404 | KHANG "đang tìm" + 3 link chính | — | P1 |
| `/en/*` | Như bản VI. Texture màn hình trong cảnh chụp ở locale `en` | Như bản VI | P0 cho các trang P0 |

> **Quy trình công ty:** form (B2B, thợ, bảo hành), `/tra-cuu`, CMS và API **chưa được code** cho tới khi `/contract <feature>` được APPROVED, theo thứ tự /demo-scope → /ba → /contract → /dev → /qa. Prototype phim và các trang tĩnh dùng dữ liệu mẫu thì làm được trước để duyệt bằng mắt, nhưng không nối backend.

---

## 14. Một quy trình chuẩn và một bộ KPI

### 14.1 Quy trình vận hành chuẩn: **5 bước**

Hiện site có 4 phiên bản (UX-13), và các agent lại đề xuất 4, 6 hoặc 7 bước:

| Phiên bản | Bước | Vấn đề |
|---|---|---|
| Trang chủ | 6: Khách mua → Hãng tạo đơn → BBSV xác nhận lịch → BBSV điều phối thợ → Lắp đặt & Nghiệm thu → Đối soát & Thanh toán | "Khách mua hàng" không phải việc của Bluebolt. Xác nhận lịch đứng trước điều phối là ngược với chính sách |
| /requirement | 6, nhưng điều phối thợ rồi thợ mới xác nhận lịch | Khác trang chủ |
| /system-map | 6: Tiếp nhận → Phân công → Xác nhận → Thực hiện → Nghiệm thu & Bảo hành → Thanh toán (khách trả tiền mặt) | Lệch mô hình B2B |
| /worker-map | 4 (góc nhìn thợ) | Là lộ trình của thợ, không phải quy trình đơn |
| benchmark: "7 bước" | Đây là **quy trình kỹ thuật** lắp máy lạnh (bài viết) | Khác loại. Giữ trong bài `/kien-thuc`, không dùng làm quy trình vận hành |

**Chốt (đề xuất):**

| # | Bước | Ai làm | Mô tả ngắn (VI) | EN |
|---|---|---|---|---|
| 01 | **Tiếp nhận đơn** | Hãng/Sàn → Bluebolt | Đơn lắp đặt đi vào hệ thống qua kênh đã thống nhất (API, file hoặc portal) | Order intake |
| 02 | **Điều phối thợ** | Bluebolt | Hệ thống chọn thợ gần nhất, đúng kỹ năng và lịch trống | Technician dispatch |
| 03 | **Xác nhận lịch hẹn** | Thợ ↔ Khách | Thợ gọi khách xác nhận thời gian và địa điểm | Appointment confirmation |
| 04 | **Lắp đặt & nghiệm thu** | Thợ + Khách | Lắp theo chuẩn hãng, nghiệm thu bằng ảnh trên app | Installation & sign-off |
| 05 | **Đối soát & bảo hành** | Bluebolt → Hãng/Sàn, Khách | Báo cáo và đối soát với Hãng/Sàn. Khách đăng ký bảo hành trong 7 ngày | Reconciliation & warranty |

"Khách mua hàng" là **sự kiện kích hoạt** (bước 00, hiển thị nhạt), không được đếm là một bước.

Vì sao chọn 5: đủ để thấy điểm cam kết SLA (bước 02–03) mà vẫn ngắn hơn 6. Bản 4 bước gộp mất bước xác nhận lịch, đúng là chỗ Hãng cần đo.

> *Giả định, chờ anh xác nhận:* thứ tự 02 → 03 (điều phối trước, thợ xác nhận lịch sau) theo Chính sách Phần 3: "chậm liên hệ với khách trong ngày nhận đơn", "BBSV không điều phối được thợ trong 36 tiếng" (`research/agent-notes/content-cro/policy-vi-parts.json`). Kênh nhận đơn ở bước 01 (API/file/portal) cũng chưa được kiểm chứng.

Thợ có **lộ trình gia nhập 4 bước** riêng (Đăng ký → E-KYC → Đào tạo → Nhận đơn), dùng cùng một component nhưng **không gọi là "quy trình vận hành"**.

### 14.2 Bộ KPI duy nhất (placeholder, chờ số thật)

Mọi trang và cả 2 ngôn ngữ đọc từ **một nguồn**: `content/stats.ts`, sau này là CMS. Mỗi số có định nghĩa và ngày cập nhật. Site hiện đang tự mâu thuẫn: 500+ / 1.500+ / "3000k+" / 460 thợ, 63 và 34 tỉnh (UX-03, CRO-03).

| Mã | Nhãn VI | Nhãn EN | Định nghĩa đề xuất | Giá trị | Hiện ở |
|---|---|---|---|---|---|
| K1 | Thợ đang hoạt động | Active technicians | Thợ có ≥ 1 đơn hoàn thành trong 90 ngày | `[___]` chờ anh | Trang chủ, /mang-luoi, /doi-tac-tho |
| K2 | Tỉnh/thành có thợ | Provinces covered | Số đơn vị hành chính cấp tỉnh (trên 34) có ≥ 1 thợ K1 | `[__]/34` | Trang chủ, /mang-luoi |
| K3 | Đơn hoàn thành 12 tháng | Jobs completed (12 mo) | Đơn đã nghiệm thu trong 12 tháng gần nhất | `[___]` | Trang chủ, /giai-phap/* |
| K4 | Hãng & Sàn đang hợp tác | Brand & retail partners | Đối tác có hợp đồng hiệu lực | `[__]` (logo chỉ hiện khi có phép) | Trang chủ, /ve-chung-toi |
| K5 | Tỷ lệ đúng hẹn | On-time rate | % đơn thợ đến trong khung đã xác nhận | `[__]%`, **chỉ hiện khi đo được** | /giai-phap/* |
| K6 | Thời gian xác nhận lịch trung bình | Avg. time to confirm | Từ lúc nhận đơn tới khi thợ xác nhận | `[__] giờ`, chỉ khi đo được | /giai-phap/* |

Trang chủ hiện tối đa 4 KPI (K1–K4). Thiếu số nào thì **ẩn ô đó**, không dùng số ước.

Bảng SLA dùng chung (cũng là placeholder). Cột "đang ghi" lấy từ chính sách hiện hành để anh đối chiếu:

| Hạng mục | Đang ghi ở các nơi trên site | Giá trị chuẩn |
|---|---|---|
| Giờ hotline | "24/7" (footer) và "9–18h T2–T6" (/contact) | `[chờ anh]` |
| Giờ tiếp nhận đơn | Chính sách: T2–T6 09:00–16:30, T7 09:00–12:00, CN/Lễ không nhận | `[chờ anh]` |
| Thời gian hoàn thành | "trong 24h" (trang chủ) và 24h nội thành HN/HCM, 36h ngoại thành/tỉnh, tối đa 48h (chính sách) | `[chờ anh, theo vùng]` |
| Bảo hành lắp mới | 02 tháng (chính sách) và 12 tháng (bài viết) | `[chờ anh]` |
| Bảo hành sửa chữa / vệ sinh | 03 tháng / 01 tháng (chính sách) | `[chờ anh]` |

Có thể đặt tên chương trình bảo hành theo pattern của benchmark (ví dụ "Bluebolt An Tâm"). Tên cuối do anh chọn.

---

## 15. Nội dung và asset cần anh/đội cung cấp

| # | Hạng mục | Ai | Cần trước | Chặn việc gì |
|---|---|---|---|---|
| 1 | Duyệt **3 style frame** (khung đầu POV ban ngày, pha `screen-hold`, section bản đồ): ánh sáng, vật liệu, palette | Anh Duy | Tuần 2 (16/10) | Toàn bộ cảnh 3D, ngày 3D artist bắt đầu. Sửa ở đây rẻ nhất |
| 2 | Chọn phim **A+ / B / Q** (+ có Lenis hay không, handoff thật hay cắt trắng) | Anh Duy | Tuần 3 (~21/10), sau khi có prototype | Phạm vi production, ngân sách asset |
| 3 | Vai trò B2C: nhánh A hay B (mục 1.3) | Anh Duy | Tuần 1 | Hero, `/ho-tro-khach-hang`, `/bang-gia`, contract form |
| 4 | Bộ KPI K1–K6 kèm định nghĩa và ngày | Anh Duy + vận hành | Tuần 1–2 | Shot 2, dải KPI, mọi trang B2B |
| 5 | **Số thợ theo từng tỉnh** (tối thiểu "tỉnh có / chưa có thợ") và cách chia vùng | Vận hành/điều phối | Tuần 2 | Shot 2, `/mang-luoi` |
| 6 | Bảng SLA và bảo hành chuẩn (mục 14.2) | Anh Duy + pháp chế | Tuần 2 | Shot 3, /dich-vu, /chinh-sach-bao-hanh, giải pháp |
| 7 | Xác nhận thứ tự quy trình 5 bước và kênh nhận đơn (API/file/portal) | Anh Duy | Tuần 1 | **Kịch bản cả 6 shot** |
| 8 | Chọn tagline T1/T2/T3, tên chương trình bảo hành, tên thương hiệu chính | Anh Duy | Tuần 1 | H1 shot 0, footer, metadata |
| 9 | Xác nhận **bản quyền KHANG** (ảnh + `khang-3d.glb`) | Anh Duy | Tuần 1 | KHANG trong phim (mục 6.4) |
| 10 | Buổi chụp ảnh thật: thợ đồng phục (≥ 6 người, nhiều vùng), đội điều phối, 6–10 công trình trước/sau, văn phòng | Bluebolt + nhiếp ảnh | Tuần 2–4 | Section sau phim, `/doi-tac-tho`, `/ve-chung-toi`, case study |
| 11 | **Quay thử Q** (1–2 giờ, điện thoại, phòng điều phối thật, đúng cú máy POV của video) + đồng ý sử dụng hình ảnh của người trong cảnh. Nếu chọn Q: buổi quay chính thức sau khi site HTML chạy trên staging | Bluebolt | Thử: tuần 1–2. Chính thức: sau G4 | Prototype Q (mục 9) |
| 12 | 3D artist dựng bộ bàn điều phối POV (không rig KHANG khi chưa có quyền). Hợp đồng chuyển giao quyền tác phẩm và file nguồn | Anh Duy duyệt chi phí | Ký sau khi duyệt style frame, làm 19/10 → 13/11 | Cần cho A+/B/C để đạt chất lượng thương mại; không cần nếu chọn Q. Chi phí **chưa kiểm chứng**, phải xin báo giá |
| 13 | **Ảnh chụp màn hình hoặc quyền quay dashboard Hãng, app thợ, báo cáo đối soát thật** | Đội sản phẩm | Tuần 2 | Màn hình trong cảnh (mục 5). Không có thì dùng giao diện minh họa, ghi rõ "minh họa" |
| 14 | Văn bản đồng ý dùng logo hãng/sàn + video Bluebolt × Panasonic | Kinh doanh B2B | Càng sớm càng tốt | Dải logo, bằng chứng. Không có thì section ẩn |
| 15 | 2–3 case study có số liệu + trích dẫn người thật có chức danh | Kinh doanh B2B | Tuần 3–4 | Bằng chứng, `/giai-phap/*` |
| 16 | Thu nhập tham khảo của thợ, phí nền tảng/ví, chu kỳ thanh toán, link tải app | Vận hành thợ | Tuần 2 | `/doi-tac-tho` |
| 17 | Danh sách việc đang tuyển thật (mã, khu vực, hạn) | HR | Tuần 3 | Section việc đang tuyển |
| 18 | Người viết/biên tập **EN bản ngữ** (cả chữ trên màn hình trong cảnh) | Anh Duy thuê | Tuần 3–5 | Toàn bộ `/en`, texture EN |
| 19 | Pháp chế: chính sách bảo mật theo **Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và nghị định hướng dẫn** (thay NĐ 13/2023; pháp chế xác nhận số hiệu), hồ sơ đánh giá tác động, điều khoản, claim quảng cáo, **xác nhận yêu cầu bản đồ chủ quyền** | Pháp chế | Tuần 2–4 | 3 trang pháp lý, câu đồng ý dưới form, phát hành shot 2 và `/mang-luoi` |
| 20 | Quyền truy cập: repo site hiện tại, quyền deploy, openresty, Search Console, GA4 | Anh Duy | Tuần 1 | Bảng 301, sửa hạ tầng, baseline đo hiệu quả |
| 21 | Zalo OA, Google Business Profile, mạng xã hội thật | Marketing | Tuần 3 | Footer, thanh dính đáy, JSON-LD |
| 22 | Quyết định bài lạc đề (AI, 2 bài robot): gỡ (410) hay giữ | Anh Duy | Tuần 2 | Bảng 301 dòng 15–17, 32–34 |
| 23 | Máy thật để test: laptop có GPU tích hợp phổ thông, Android tầm trung (Galaxy A06/A16 hoặc Redmi 4–6 triệu), iPhone 11–13 | Đội nội bộ | Tuần 2 | Chốt tầng thiết bị, NFR khung hình và bộ nhớ |

---

## 16. Ước lượng effort

> **Đã được thay bằng `04` mục 5** (ước lượng đầy đủ, giờ người, lịch, thứ tự quy trình). Phần dưới giữ lại để đối chiếu cách tính ban đầu: số 110–150 giờ chỉ tính phim và trang tĩnh, 3D artist ghi "tùy chọn", thứ tự "prototype trước, /demo-scope sau" là bản cũ. Số chốt: A+ ≈ 271, B ≈ 281, C ≈ 295, Q ≈ 244 giờ Claude Code; việc người ≈ 208 giờ + 50–80 giờ 3D artist; launch tuần 10.

### 16.1 Giờ build của Claude Code (bản đầu, lỗi thời)

Quy đổi: giờ người làm truyền thống chia cho hệ số nén theo loại việc. Hệ số: nội dung ~10×, trang lặp khuôn ~5×, logic mới ~3×, chạm thế giới thật ~1,5×, duyệt với anh ~1×. **Đây là ước lượng, chưa phải số đo.** Chưa tính form, API, CMS (cần contract riêng).

**a) Prototype (làm trước, để anh chọn)**

| Hạng mục | Loại việc | Giờ người (ước) | Hệ số | **Giờ Claude Code** |
|---|---|---|---|---|
| 3 style frame (shot 0, 2, 4) | Logic mới | 6 | 3× | 2 |
| A: cảnh phòng điều phối thủ tục, camera rig (`establish`, `dolly-in`, `handheld`), handoff, 1 màn hình trong cảnh | Logic mới | 21 | 3× | 7 |
| A: render chuỗi ảnh mobile + poster, đo trọng lượng | Thế giới thật | 3 | 1,5× | 2 |
| **A tổng** (gồm style frame) | | | | **~11** |
| B thêm: `push-through` sang màn hình lớn, `crane` xuống bản đồ (dùng lại POC), ghim thợ, render thêm | Logic mới + thế giới thật | 15 + 1,5 | 3× / 1,5× | +6 → **~17** |
| C thêm: cảnh nhà khách, `orbit` máy lạnh tách lớp, app thợ, `rack-focus`, quay về laptop báo cáo, render thêm | Logic mới + thế giới thật | 24 + 3 | 3× / 1,5× | +10 → **~27** |

**b) Production (sau khi anh chọn, tính cho phương án C; ghi chú A/B ở cuối)**

| Hạng mục | Loại việc | Giờ người (ước) | Hệ số | **Giờ Claude Code** |
|---|---|---|---|---|
| Design tokens + Tailwind `@theme` + ~12 primitive | Khuôn lặp | 30 | 5× | 6 |
| Motion 2.5D cho phần sau phim và trang con (mục 12) | Logic mới | 15 | 3× | 5 |
| Film engine production: 4 tầng thiết bị, timeline, thanh chương, skip link, context lost, a11y | Logic mới | 36 | 3× | 12 |
| Hoàn thiện cảnh: ánh sáng, vật liệu, KTX2, LOD, tải dần theo shot | Thế giới thật | 15 | 1,5× | 10 |
| Màn hình trong cảnh: 5 component UI + chụp texture VI/EN | Logic mới | 24 | 3× | 8 |
| Bản đồ: shot 2 + `/mang-luoi` tương tác + SVG fallback + bảng 34 tỉnh | Logic mới | 30 | 3× | 10 |
| Pipeline render chuỗi ảnh mobile, ảnh tĩnh, video loop trang con; encode; player scrub | Thế giới thật | 18 | 1,5× | 12 |
| Hero shot trang con (4 loop từ cùng cảnh) | Khuôn lặp | 20 | 5× | 4 |
| Template ~12 loại trang VI (mục 13.5) | Khuôn lặp | 75 | 5× | 15 |
| Bản EN: pathnames, glossary, kiểm thiếu khóa | Khuôn lặp | 20 | 5× | 4 |
| Viết lại copy VI, nháp EN, microcopy, alt, JSON-LD | Nội dung | 60 | 10× | 6 |
| Bảng 301 cho 34 URL + test redirect | Khuôn lặp | 8 | 5× | 2 |
| Test thật: Safari/iOS, Android tầm trung, laptop GPU tích hợp, tràn ngang 9 breakpoint, Lighthouse CI, đo fps và bộ nhớ | Thế giới thật | 30 | 1,5× | 20 |
| Deploy staging + openresty (301, h2, HSTS, cache immutable) | Thế giới thật | 9 | 1,5× | 6 |
| Vòng duyệt với anh (style frame, prototype, design system, 2 vòng trang) | Duyệt | 12 | 1× | 12 |
| **Tổng production (C)** | | **~402** | | **~132** |

Tổng theo phương án, **gồm cả prototype** (đã trừ khoảng 10 giờ prototype được dùng lại vào production):

| Phương án | Prototype | Production | **Tổng Claude Code (ước)** |
|---|---|---|---|
| A | 11 | ~105 (bỏ bản đồ trong phim, cảnh nhà khách; `/mang-luoi` vẫn có) | **~110 giờ** |
| B | 17 | ~118 | **~130 giờ** |
| C | 27 | ~132 | **~150 giờ** |

Một dev vận hành Claude Code tương đương khoảng **3–4,5 tuần lịch**, nếu tính cả thời gian chờ duyệt và chờ render.

### 16.2 Việc người: đường găng của lịch dự án

| Việc người | Giờ công người (ước) | Lịch (ước) |
|---|---|---|
| Duyệt style frame + prototype + trang (phía anh) | ~10 | 2–5 ngày mỗi vòng |
| Chốt KPI, SLA, bảo hành, quy trình, số thợ theo tỉnh | ~10 | 1–2 tuần |
| Màn hình thật của dashboard/app/báo cáo (đội sản phẩm) | ~8 | 1–2 tuần |
| Chụp ảnh thật + chọn ảnh | ~20 | 1–3 tuần |
| *(Tùy chọn)* quay phòng điều phối thật | ~8 | 1 buổi + dựng |
| *(Tùy chọn)* 3D artist (cảnh photoreal / rig KHANG) | ~30–40 (bên ngoài) | 2–4 tuần |
| Xin phép logo / video đối tác | ~6 | **2–6 tuần, không kiểm soát được** |
| Viết EN bản ngữ | ~16 | 1–2 tuần |
| Pháp chế (3 trang + bản đồ chủ quyền) | ~12 | 1–3 tuần |
| **Tổng** | **~130 giờ** (gồm phần tùy chọn) | **5–7 tuần**, chạy song song một phần |

**Tỷ lệ build : việc người ≈ 130 : 130 giờ (≈ 1 : 1) với phương án B. Về lịch: khoảng 3–4 tuần build so với 5–7 tuần việc người.** Lịch dự án do việc người quyết định. Tuần 1 nên mở ngay các luồng: xin phép logo, đặt lịch chụp ảnh, xin màn hình thật của dashboard/app, gửi câu hỏi KPI/SLA. Claude Code dựng style frame và prototype song song trong lúc chờ.

### 16.3 Thứ tự thực thi gợi ý

1. **Tuần 1:**
   - Style frame + prototype A, nhánh `feat/s0-0.1-film-prototype-a`. Mở rộng lên B/C ở `feat/s0-0.2-film-prototype-bc`.
   - Design tokens, nhánh `feat/s0-0.3-design-tokens`.
   - Gửi anh mục 15 (dòng 1–9, 13, 20).
2. **Sau khi anh chọn phim:**
   - Chạy /demo-scope để có cây trang và P0/P1/P2 theo mục 13.
   - Chạy /ba để có SRS cho form và các trang B2B.
   - Chạy /contract cho từng form, `/tra-cuu` và CMS.
   - Agents: ux-designer chi tiết hóa storyboard từng shot và wireframe trang con; schema-designer và api-designer lo form lead.
3. **Build:**
   - Film engine và cảnh trước, vì đây là phần rủi ro nhất. Trang tĩnh song song.
   - feature-builder chỉ nhận phần động sau khi contract APPROVED.
   - Commit theo chuẩn, ví dụ `feat(web): add dolly-in camera rig for dispatch room shot`.
4. **QA:**
   - performance-tester kiểm ngân sách (mục 8, 17), trên máy thật.
   - security-auditor kiểm form và openresty trước go-live.
   - code-reviewer kiểm theo checklist rule git.

---

## 17. Tiêu chí nghiệm thu thiết kế (NFR đo được, đề xuất, cần ký trước khi build)

> **Đã được thay bằng `04` mục 7** (NFR chốt, tách lab cho BBNT và field hậu launch, throttling mặc định Slow 4G). Bảng dưới đã chỉnh các dòng lệch rõ nhất cho khớp `04`.

| ID | Chỉ số | Pass | Tool | Điều kiện |
|---|---|---|---|---|
| D-PERF-01 | LCP mobile trang chủ | Lab ≤ 2,5 s (BBNT); field p75 ≤ 2,5 s (theo dõi hậu launch) | Lighthouse 12 mobile + web-vitals RUM | Staging, preset mặc định (Slow 4G giả lập, CPU 4×); field đo sau 28 ngày |
| D-PERF-02 | Lighthouse Performance mobile | ≥ 85 cho mọi trang P0 | Lighthouse CI | 3 lần chạy, lấy median |
| D-PERF-03 | TBT desktop trang chủ | ≤ 200 ms trên Lighthouse CI (tầng T-STILL); trace trên laptop GPU tích hợp: tổng long task ≤ 300 ms, không task > 200 ms | Lighthouse desktop + Chrome trace | Xem `04` NFR-PERF-05 |
| D-PERF-04 | Trọng lượng trang chủ mobile trước khi cuộn | ≤ 600 KB byte truyền | Playwright `response.sizes()` (không dùng `total-byte-weight`) | Tới load + 5 s, không tương tác |
| D-PERF-05 | Trọng lượng phim | Desktop A+/B T-FULL ≤ 2,2 MB (C ≤ 2,5 MB) · video mobile ≤ 110 KB/s phim, tải dần theo shot | Playwright đếm byte theo request | Cuộn hết phim |
| D-PERF-06 | Khung hình phim desktop | T-LITE p95 ≤ 20 ms (T-FULL ≤ 16,7 ms trên máy cao) | Playwright + `requestAnimationFrame` trace | Laptop GPU tích hợp tham chiếu (mục 15 dòng 23), cuộn đều 30 s |
| D-PERF-07 | Phản hồi khi cuộn | INP ≤ 200 ms; không long task > 100 ms trong lúc cuộn phim | web-vitals + Performance trace | Android tầm trung, T-SEQ |
| D-PERF-08 | Bộ nhớ mobile | Tab không bị trình duyệt tải lại khi cuộn hết phim 3 lần | Thủ công trên iPhone 11 + Android tầm trung | Safari iOS, Chrome Android |
| D-COMP-01 | Không tràn ngang | `scrollWidth ≤ clientWidth` ở 9 breakpoint × mọi route | Playwright CI | VI + EN |
| D-A11Y-01 | Tương phản | 0 lỗi `color-contrast` (kể cả chữ trên scrim của phim) | axe-core CI | Mọi trang P0 |
| D-A11Y-02 | Reduced-motion | 0 request GLB/chuỗi ảnh/video, 0 scrub, 0 pin | Playwright `reducedMotion: 'reduce'` | Trang chủ, `/mang-luoi`, hero trang con |
| D-A11Y-03 | Bỏ qua phim | Link "Bỏ qua phần giới thiệu" nhìn thấy được, là phần tử focus đầu tiên sau header, đưa tới section "Ba cửa vào" và phần tử đích nhìn thấy được | Playwright bàn phím | Desktop + mobile |
| D-A11Y-04 | Nội dung không phụ thuộc canvas, không phụ thuộc cuộn | Tắt JS: đủ H1, 5 bước, KPI, CTA, ảnh tĩnh. Googlebot smartphone không cuộn: đúng 1 H1, nội dung hiện (opacity ≥ 0,9) | Playwright có/không JS | Trang chủ, mọi tầng |
| D-SEO-01 | Redirect | N/N URL trong redirect-inventory (34 dòng sitemap + phần kiểm kê thêm) × 4 biến thể × có/không dấu `/` trả 301 (hoặc 410 đã duyệt), 1 hop, đúng đích | Script curl CI | Sau deploy staging |
| D-MAP-01 | Chủ quyền bản đồ | Hoàng Sa và Trường Sa nằm trọn trong khung, không bị phần tử nào che, nhãn ≥ 11 px và tương phản ≥ 4,5:1, ở 9/9 breakpoint, **ở mọi biểu diễn** (SVG, WebGL, video, texture, poster, OG) | Ảnh chụp Playwright + getBoundingClientRect + duyệt người | Pháp chế ký xác nhận |

---

## 18. Câu hỏi mở (không tự trả lời thay anh)

Em đã dùng **giả định** để thiết kế, chỗ nào giả định đều có ghi rõ:

1. Anh chọn phim A+, B hay Q (mục 9)? Handoff thật hay cắt trắng? Phòng điều phối thật có đủ đẹp để quay (Q) không, nhân sự có đồng ý xuất hiện không?
2. Style frame: "cách điệu sạch" (dựng trong code) có đủ không, hay anh muốn photoreal (cần 3D artist, chi phí chưa rõ)?
3. Đội sản phẩm có cho dùng màn hình thật của dashboard Hãng, app thợ, báo cáo đối soát không? Nếu không, giao diện minh họa có được không?
4. Bộ số liệu chính thức và số thợ theo tỉnh (mục 14.2).
5. SLA, giờ phục vụ, thời hạn bảo hành chuẩn. Có trực 24/7 thật không?
6. Có nhận B2C trực tiếp không (mục 1.3)?
7. Repo, quyền deploy, openresty, CMS, người cập nhật nội dung sau bàn giao.
8. Lead hiện đi về đâu? Có GA4/Search Console không?
9. Quyền dùng logo và video Panasonic. Hãng mục tiêu là Việt hay FDI Nhật/Hàn/Trung, có cần JA/KO không?
10. Bản quyền KHANG và vai trò KHANG trong phim (mục 6.4) có hợp ý anh không?
11. Có được sửa nóng site hiện tại trước redesign không: footer "Procleaning", form /system-map hỏng, CTA chết, tràn ngang, https/HSTS/www, GLB 3,7 MB, STK ngân hàng.
12. Đổi URL theo IA mới hay giữ? Slug có dấu hay không dấu? EN dùng slug riêng không (mục 10.2)?
13. Video TikTok chỉ là cảm hứng hay anh cân nhắc thuê XimiTech (có tin genk.vn 23/07/2026)? Tên thương hiệu chính là gì?
14. Phạm vi, ngân sách, mốc thời gian và mức NFR anh chấp nhận để nghiệm thu (mục 17).

---

Cập nhật: 01/10/2026 — đã qua vòng phản biện
