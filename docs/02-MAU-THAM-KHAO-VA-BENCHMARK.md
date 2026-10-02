# 02 — Mẫu tham khảo và Benchmark

> Dự án: làm lại lapdattoanquoc.vn (Bluebolt Services, Công ty CP Công nghệ Tia Chớp Xanh)
> Ngày lập: 01/10/2026 · **Phiên bản v2:** viết lại Phần A theo làm rõ của anh Duy (thay bản v1 "mổ xẻ site mẫu")
> Nguồn: `research/research-results.json` (6 agent nghiên cứu + critic), khung hình video trong `research/tiktok/`, số đo benchmark mới trong `research/benchmark-cinematic/`
> Đường dẫn trong tài liệu tính từ thư mục `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/`.
> Người đọc: anh Duy (quyết định), dev vận hành Claude Code (thực thi). Đọc cùng `03-DINH-HUONG-THIET-KE-3D.md` (v2, hướng điện ảnh).

---

## Làm rõ của anh Duy (điểm xuất phát của bản này)

> "Không làm giống site TikTok (mddecorpro.com) mà [giống] **cái video quảng cáo** thiết kế website ấy."

Vì vậy tài liệu này **không** lấy bố cục, màu xanh rêu, ảnh nội thất hay giọng "The Art of…" của mddecorpro.com. Thứ được phân tích là **ngôn ngữ máy quay** của video: góc máy, chuyển động máy, ánh sáng, chiều sâu. Bài học kỹ thuật từ site mẫu (GSAP, hiệu năng) chỉ còn ở **Phụ lục A** cuối Phần A.

## Tóm tắt 6 dòng

1. Video là **một cú máy liền 47 giây, không cắt cảnh**, quay tay bằng điện thoại. Đo bằng ffmpeg: ở ngưỡng 0,25 có 0 điểm cắt (`research/tiktok/sheets/scene-detect.txt`).
2. Toàn bộ "phép thuật" nằm trong **6 giây đầu**: cảnh rộng chéo góc → máy vòng và tiến về chính diện → khung cân lại → màn hình lớn chiếm ngang khung → phòng tối dần. Từ giây ~6,5 trở đi máy gần như đứng yên và website chạy trên màn hình.
3. Cảm giác 3D/premium đến từ 5 thứ: **thị sai giữa tiền cảnh (laptop, tay) và hậu cảnh (màn hình lớn)**, **trục máy đi từ chéo về chính diện**, **màn hình thành nguồn sáng chính** (độ sáng phòng giảm ~50% trong 1,5 giây, đo được), **một cú máy liền**, **rung tay của người thật**. Video **không** có độ sâu trường ảnh (DOF) rõ và **không** chui vào màn hình. Đó là hai phần ta mở rộng thêm.
4. Mỗi yếu tố chuyển được thành một tương tác web: camera rig theo cuộn, `establish`, `dolly-in`, `handheld`, screen glow + exposure ramp, screen-to-page handoff, device-in-scene (bảng A5). Tên cú máy khớp với `03-DINH-HUONG-THIET-KE-3D.md` mục 3.
5. 4 cấp 3D (Phần B) vẫn giữ. Với hướng điện ảnh: phim trang chủ chạy **T4 trên desktop đủ GPU** và **T3 (chuỗi ảnh/video cuộn) trên mobile**. Phần còn lại của site là T1 + T2.
6. Benchmark bổ sung nhóm "cinematic scroll / device-in-scene" (mục C1, nhóm 4), **tự kiểm bằng Chromium headless ngày 01/10/2026**. Trang AirPods Pro của Apple có video tua theo cuộn (đã đo). Nhiều site WebGL đoạt giải chiếm quyền cuộn (chiều cao trang = chiều cao màn hình). Bluebolt **không** đi theo cách đó.

---

# PHẦN A — Ngôn ngữ máy quay của video mẫu

## A1. Video là gì (chỉ phần liên quan tới máy quay)

| Hạng mục | Dữ kiện | Nguồn |
|---|---|---|
| Video | TikTok @doximitech, 47s, 576×1024 (dọc 9:16), 30fps | `research/tiktok/sample.info.json` |
| Cách quay | Điện thoại cầm tay. **Một cú máy liền**, không cắt | `research/tiktok/sheets/scene-detect.txt` |
| Đạo cụ trong cảnh | Bàn đá sáng màu, laptop mở trình soạn code (tiền cảnh), màn hình rời lớn chạy trình duyệt (hậu cảnh), tay người trên trackpad, phòng khách có cửa sổ, rèm, tranh treo tường | `research/tiktok/sheets/camera_keyframes_0-0.33-0.67-1-2-4-5-6s.jpg` |
| Lớp chữ | Một caption trắng cố định ở trên suốt 47s ("Hoàn thành dự án website cho…"). Chữ **không** di chuyển cùng máy | `research/tiktok/sheets/camera_full_1fps_0-47s.jpg` |
| Nội dung trên màn hình | Website được thao tác: trang chủ (F5 lúc ~2,3s) → Giới thiệu → Dịch vụ → Công trình → Thư viện → Liên hệ → bản EN | `research/agent-notes/creative-technologist/tiktok-frames/` |

**Bộ khung hình đã cắt cho bản này** (mới, nằm trong `research/tiktok/sheets/`):

| File | Nội dung |
|---|---|
| `camera_keyframes_0-0.33-0.67-1-2-4-5-6s.jpg` | 8 khung chọn lọc ở 0 / 0,33 / 0,67 / 1 / 2 / 4 / 5 / 6s, độ phân giải cao hơn. **File nên xem đầu tiên** |
| `camera_6fps_0-4s.jpg` | 24 khung, 6 khung/giây, đoạn máy chuyển động mạnh nhất |
| `camera_3fps_4-10s.jpg` | 18 khung, 3 khung/giây, đoạn màn hình chiếm khung và phòng tối đi |
| `camera_full_1fps_0-47s.jpg` | 47 khung, 1 khung/giây, toàn video: thấy rõ máy đứng yên sau giây ~6 |
| `camera_0-8s.jpg` | (đã có) 16 khung, 2 khung/giây, 0–8s |
| `exposure_0-12s.txt` | Số đo độ sáng phòng theo thời gian (mục A3) |
| `scene-detect.txt` | Kết quả dò điểm cắt cảnh (mục A3) |

## A2. Bảng shot theo thời gian

Video chỉ có một cú máy liền, nên "shot" ở đây là **các pha** của cú máy đó. Góc độ và tỉ lệ là **ước bằng mắt** từ khung hình. Chỉ các số ở mục A3 là số đo.

| # | Thời điểm | Loại cảnh | Chuyển động máy | Ánh sáng | Chiều sâu / thị sai | Khung bằng chứng |
|---|---|---|---|---|---|---|
| 1 | **0–0,5s** | **Cảnh rộng chéo góc** (establishing). Máy cao, chúc xuống khoảng 40–45°, lệch phải trục bàn. Thấy cả phòng: cửa sổ, rèm, tranh, trần | Máy bắt đầu vòng sang trái. Khung **nghiêng ngang vài độ** (màn hình lớn lệch góc). Tay trên trackpad nhòe chuyển động | Phòng sáng ánh ngày. Màn hình chưa phải nguồn sáng nổi bật | Laptop nhỏ ở góc dưới-trái. Màn hình lớn ở trên-trái, nhìn xiên nên thấy rõ phối cảnh của mặt phẳng màn hình | keyframes ô 1–2; `camera_6fps_0-4s.jpg` hàng 1 |
| 2 | **0,5–1,5s** | Cảnh trung, đang "đến nơi" | **Vòng cung + dolly-in:** máy vòng về trục chính diện, hạ thấp và tiến lại. Đây là đoạn máy di chuyển nhanh nhất | Bắt đầu thấy màn hình rực hơn so với phòng | **Thị sai rõ nhất:** laptop (gần) trượt từ góc trái vào giữa khung và to lên nhanh. Màn hình lớn (xa) dịch ít hơn | keyframes ô 3–4; `camera_6fps_0-4s.jpg` hàng 1–2 |
| 3 | **1,5–4s** | Cảnh trung, gần chính diện | **Ổn định và cân khung:** góc nghiêng ngang được cân dần về 0. Lố nhẹ sang trái quanh giây 2 rồi về giữa. Tiếp tục tiến chậm | Như trên | Laptop ở giữa nửa dưới khung, làm **tiền cảnh neo tỉ lệ**. Tay vẫn ở mép dưới | keyframes ô 5; `camera_6fps_0-4s.jpg` hàng 2–4 |
| 3b | ~2,3s | (sự kiện trên màn hình) | Máy gần như đã tới. **Trang được F5, hero chạy lại hiệu ứng mở đầu** đúng lúc máy đến nơi | — | — | `camera_6fps_0-4s.jpg` hàng 3 ("The Art" hiện dần) |
| 4 | **4–6,5s** | **Màn hình chiếm khung:** màn hình lớn phủ gần hết bề ngang khung, laptop vẫn ở dưới | Tiến nốt rồi dừng. Website bắt đầu cuộn (~4,5s) | **Phòng tối đi rõ rệt:** khi trang chuyển sang nền trắng, camera điện thoại tự hạ phơi sáng. Độ sáng trần giảm từ ~108 xuống ~54 trong khoảng 4,75–6,25s (mục A3) | Màn hình là vùng sáng duy nhất. Hai mép khung chìm vào tối, tạo khung viền tự nhiên (vignette) | keyframes ô 6–8; `camera_3fps_4-10s.jpg` |
| 5 | **6,5–47s** | **Giữ khung chính diện** | Gần như đứng yên. Chỉ còn **rung tay nhẹ**, chậm, không có cú giật | Phòng tối, màn hình phát sáng. Độ sáng toàn khung thay đổi theo nội dung trang | Laptop với màn hình code tối ở tiền cảnh, màn hình lớn sáng ở hậu cảnh: **hai mặt phẳng phát sáng ở hai độ sâu** | `camera_full_1fps_0-47s.jpg` (hàng 2–6 gần như giống nhau về bố cục) |

**Hai điều video không có** (cần nói rõ để không kỳ vọng sai):

- **Không có độ sâu trường ảnh rõ.** Camera điện thoại cho gần như mọi thứ đều nét. Phần nhòe duy nhất là nhòe chuyển động của tay ở giây đầu. `rack-focus`/DOF trong tài liệu 03 là phần **mở rộng thêm**.
- **Không chui vào màn hình.** Màn hình chỉ phủ gần hết bề ngang, laptop vẫn còn trong khung. "Screen-to-page handoff" là bước ta **thêm vào** để nối phim với trang web thật.

## A3. Số đo hỗ trợ (từ chính file video)

**1. Một cú máy liền.** Dò điểm cắt bằng ffmpeg (`select='gt(scene,T)'`):

| Ngưỡng | Số điểm | Ý nghĩa |
|---|---|---|
| 0,25 | **0** | Không có cắt cảnh nào trong 47s |
| 0,12 | 7 điểm: 24,4 / 27,7 / 31,3 / 34,7 / 36,1 / 40,3 / 43,4s | Trùng lúc website trên màn hình đổi trang. Đó là thay đổi nội dung, không phải cắt máy |

Nguồn: `research/tiktok/sheets/scene-detect.txt`.

**2. Phòng tối đi khi màn hình sáng lên.** Độ sáng trung bình (0–255) của dải trần nhà phía trên caption, đo 4 khung/giây (`research/tiktok/sheets/exposure_0-12s.txt`):

| Thời điểm | Dải trần (phòng) | Hai mép giữa khung | Toàn khung |
|---|---|---|---|
| 0,0s | 102 | 75 | 99 |
| 1,0s | 115 | 67 | 98 |
| 4,0s | 107 | 57 | 99 |
| 5,0s | 100 | 57 | 99 |
| 5,5s | 82 | 50 | 100 |
| 6,0s | 61 | 39 | 91 |
| 6,5s | **55** | **30** | 90 |
| 8,0s | 54 | 36 | 80 |

Đọc số: độ sáng **toàn khung gần như giữ nguyên** (99 → 90) trong khi **phòng giảm khoảng một nửa** (108 → 54). Điện thoại giữ tổng độ sáng ổn định nên khi màn hình trắng ra thì phòng bị kéo tối xuống. Kết quả là cảm giác "đèn trong phòng tắt, chỉ còn màn hình phát sáng". Đây là hiệu ứng **có thể mô phỏng trực tiếp** trên web (exposure ramp, bảng A5).

Giới hạn: đây là số đo trên video đã nén của TikTok, chỉ dùng để mô tả xu hướng. Không đo được góc máy hay biên độ rung tay một cách tin cậy (thử đo bằng mép màn hình bị nhiễu do nội dung trang thay đổi), nên các góc ở A2 là ước bằng mắt.

## A4. Vì sao video gây cảm giác 3D và premium

| # | Cơ chế | Thấy ở đâu trong video | Vì sao có tác dụng |
|---|---|---|---|
| 1 | **Thị sai nhiều lớp** | Pha 2: laptop gần trôi nhanh, màn hình xa trôi chậm | Mắt suy ra chiều sâu từ chênh lệch tốc độ. Đây là tín hiệu 3D mạnh nhất, mạnh hơn bóng đổ hay phối cảnh tĩnh |
| 2 | **Trục máy đi từ chéo về chính diện** | Pha 1 → 3 | Góc chéo cho thấy vật thể có khối và độ dày. Về chính diện tạo cảm giác "đã đến nơi", nội dung bắt đầu. Đây là cấu trúc mở đầu kinh điển: establish → approach → reveal |
| 3 | **Màn hình là nguồn sáng chính** | Pha 4: phòng giảm ~50% độ sáng, màn hình giữ sáng | Tương phản sáng/tối làm màn hình như "phát sáng" và tách khỏi nền. Hai mép khung tối thành viền tự nhiên, kéo mắt vào giữa |
| 4 | **Một cú máy liền, không cắt** | Toàn video | Liền mạch nghĩa là không gian có thật và nhất quán. Người xem "ở trong phòng", không phải xem một chuỗi slide |
| 5 | **Rung tay của người thật** | Pha 5 | Chuyển động nhỏ, chậm, không đều cho biết có người cầm máy. Đó là khác biệt giữa "quay" và "render lạnh" |
| 6 | **Tiền cảnh neo tỉ lệ** | Laptop + tay ở nửa dưới suốt video | Có vật quen thuộc ở gần thì não đoán được màn hình lớn to cỡ nào và cách bao xa |
| 7 | **Thiết bị thật, giao diện thật** | Màn hình có thanh trình duyệt, tab, menu hệ điều hành | Website được "đặt vào đời thực", trông như sản phẩm đang chạy, không phải mockup |
| 8 | **Nhịp: máy dừng rồi nội dung mới chạy** | F5 ở ~2,3s khi máy vừa tới; cuộn trang bắt đầu ~4,5s khi máy đã dừng | Hai chuyển động lớn (máy và nội dung) không chồng lên nhau, nên mắt không bị quá tải. Chuyển động có thứ tự cho cảm giác "đắt" |
| 9 | **Chữ cố định, không đi theo máy** | Caption trên cùng đứng yên 47s | Chữ luôn đọc được, chuyển động chỉ thuộc về cảnh |

## A5. Chuyển từng yếu tố thành tương tác web

Tên cú máy, tầng thiết bị (T-FULL / T-LITE / T-SEQ / T-STILL) và token khớp với `03-DINH-HUONG-THIET-KE-3D.md` mục 3 và 7.2.

Cột giờ là **giờ Claude Code để build riêng phần đó**, **ước lượng tài liệu này**. Hệ số nén so với người: logic mới ~3×, chạm thế giới thật ~1,5×. Giờ chốt cho cả dự án nằm ở `04` mục 5. Hai bảng không cộng dồn.

| # | Yếu tố trong video | Tương tác web | Cách làm | Tầng áp dụng | Giờ Claude Code (loại) | Luật / rủi ro |
|---|---|---|---|---|---|---|
| 1 | Người cầm máy di chuyển | **Camera rig theo cuộn:** cuộn = máy đi trên một đường ray định sẵn | GSAP ScrollTrigger, 1 timeline, mỗi shot là 1 label. Đường máy là spline (CatmullRom) cho vị trí và điểm nhìn. `scrub: 0.8` để mượt mà không chiếm bánh xe chuột | T-FULL, T-LITE (realtime). T-SEQ dùng cùng tiến độ cuộn để tua khung | 4–6 (logic mới) | Cuộn native, không scroll-jacking. Bàn phím, thanh cuộn, trackpad đều chạy đúng |
| 2 | Pha 1: cảnh rộng chéo góc | **`establish`:** trạng thái khi vào trang. Lệch trục 30–35°, cao ngang mắt người ngồi | Tham số `CAMERA.establish` (03 mục 3.3). Khung đầu cũng là **poster LCP** dạng ảnh | Mọi tầng (T-STILL chỉ có poster) | Gộp trong #1 | Poster phải là phần tử LCP hoặc đứng sau H1. Canvas không bao giờ là LCP |
| 3 | Pha 2: vòng + tiến về chính diện | **`dolly-in` có xoay:** khoảng cách 3× → 1,15×, yaw 32° → 0°, FOV 46° → 38° | Nội suy theo tiến độ cuộn, easing `cubic-bezier(.45,0,.2,1)` | T-FULL, T-LITE, T-SEQ | Gộp trong #1 | Mỗi shot chỉ một cú máy chính (03 mục 3.2) |
| 4 | Pha 3: khung nghiêng được cân lại | **Giữ nghiêng 2–4° ở khung `establish`, cân về 0° trước khi màn hình chiếm khung** (như video). Sau đó chân trời thẳng | `establish.rollDeg: -3`, `dollyIn.rollTo: 0`; handheld `maxRollDeg: 0.5` | Mọi tầng | 0 | Bản đầu bỏ hẳn nghiêng ngang; vòng phản biện chỉ ra video có nghiêng và prototype (roll −3,2° → 0) đúng với video hơn, nên đã sửa (`03` mục 3.2 luật 6). Không nghiêng theo cuộn ở giữa phim |
| 5 | Thị sai laptop gần / màn hình xa | **Thị sai thật trong cảnh 3D:** đặt thiết bị ở 2–3 độ sâu khác nhau (laptop gần, màn hình lớn xa, cửa sổ xa nhất) | Thị sai tự có khi máy 3D di chuyển. Trên T-SEQ, thị sai đã nằm sẵn trong khung render | T-FULL, T-LITE, T-SEQ | 0 (do bố cục cảnh) | Bố cục cảnh phải có tiền cảnh. Thiếu tiền cảnh thì dolly-in chỉ còn là "zoom ảnh" |
| 6 | Pha 5: rung tay | **`handheld` sway:** rung rất nhỏ chồng lên mọi cú máy **khi đang cuộn**, tắt dần 1,5 s sau khi dừng | Nhiễu simplex 2 tầng: xoay ±0,15–0,25°, tịnh tiến ±2–4 mm, 0,3–0,6 Hz | T-FULL, T-LITE. T-SEQ có sẵn trong khung | 0,5–1 (logic mới) | Tắt khi `prefers-reduced-motion`. Video rung cả khi đứng yên, nhưng trên web rung liên tục buộc GPU vẽ 60 fps lúc người xem đứng đọc (nóng máy, hỏng INP, guard FPS vô nghĩa), nên chỉ rung khi cuộn (`04` mục 6.1 luật 4) |
| 7 | Pha 4: phòng tối, màn hình phát sáng | **Screen glow + exposure ramp:** màn hình là vật liệu tự phát sáng (emissive) và hắt sáng xanh lên mặt bàn. Khi màn hình chiếm khung, độ sáng môi trường giảm khoảng 40–50% | Màn hình: `MeshBasicMaterial` + `toneMapped=false`, một đèn `RectAreaLight` cùng kích thước đặt trước màn hình. Phòng: nội suy `toneMappingExposure` hoặc cường độ đèn môi trường theo tiến độ cuộn. Thêm vignette nhẹ | T-FULL (bloom nhẹ), T-LITE (không bloom). T-SEQ: có sẵn trong khung render | 1–2 (logic mới) | Số "giảm ~50%" lấy từ đo ở A3, là **điểm xuất phát**. Chữ HTML đè lên cảnh tối phải đạt tương phản AA |
| 8 | (Video không có) | **Độ sâu trường ảnh, `rack-focus`:** đổi vùng nét từ thiết bị này sang thiết bị khác | Postprocessing DOF, chỉ bật ở T-FULL. T-LITE dùng 2 lớp ảnh nét/mờ cắt sẵn | T-FULL | 1–2 (logic mới) | **Phần mở rộng**, không phải chép video. Dùng tiết chế, tối đa 1 lần mỗi phim. DOF tốn GPU nhất trong danh sách này |
| 9 | Pha 4: màn hình lấp gần hết khung | **Screen-to-page handoff:** khi màn hình trong cảnh phủ ≥98% viewport thì crossfade 200 ms sang section HTML thật y hệt, rồi trả lại cuộn native | Texture màn hình chính là ảnh chụp của section HTML kế tiếp (Playwright chụp lúc build). Chi tiết ở 03 mục 7.4 | T-FULL, T-LITE, T-SEQ. T-STILL không cần | 3–5 (logic mới) | **Phần mở rộng.** Chỗ dễ lộ nhất (lệch tỉ lệ khung). Phương án dự phòng: cắt sang trắng 1 khung, giống lúc video đổi trang |
| 10 | Màn hình thật chạy website thật | **Device-in-scene showcase:** laptop điều phối, màn hình bản đồ, điện thoại app thợ là nơi nội dung xuất hiện | Mỗi màn hình là một React component (`<DispatchDashboard>`, `<TechnicianApp>`, `<ReconReport>`) dùng chung design tokens, chụp thành texture AVIF lúc build. Danh sách thiết bị ở 03 mục 5 | Mọi tầng | 4–6 cho 3 màn hình (trang lặp khuôn + logic mới) | Giao diện minh họa phải ghi "Giao diện minh họa". Không logo hãng khi chưa có văn bản đồng ý. Không dựng thiết bị nhận ra được thương hiệu (không làm giống MacBook) |
| 11 | F5 đúng lúc máy tới | **Nội dung trên màn hình chạy khi máy dừng:** UI trong thiết bị (thẻ đơn mới trượt vào, số đếm) chỉ chạy ở đoạn dừng đọc cuối mỗi shot | Label "hold" trong timeline (`holdVh: 25`) | T-FULL, T-LITE. T-SEQ: khung render sẵn | Gộp trong #1 | Không để máy và UI cùng chuyển động lớn một lúc (A4 #8) |
| 12 | Caption đứng yên | **Lớp chữ HTML cố định** cạnh cảnh: H1, bước 01–05, KPI. Chữ hiện bằng `rise` khi shot dừng và đứng yên để đọc | HTML SSR thật, `<ol>` các bước. Canvas `aria-hidden` | Mọi tầng | Gộp trong trang (03 mục 13) | Chữ, số, nút **không bao giờ** vẽ trong canvas (SEO, a11y, dịch EN) |
| 13 | Một cú máy liền | **Một canvas, một không gian liên tục.** Hai shot cách xa nhau thì "cắt qua một màn hình" (match cut) thay vì bay dài | Đổi cảnh bằng mount/unmount group trong cùng context WebGL | T-FULL, T-LITE | Gộp trong #1 | Không tạo canvas mới giữa phim. Ra khỏi vùng phim thì dừng render |
| 14 | Video dọc quay bằng điện thoại | **Mobile: video hoặc chuỗi ảnh render từ cùng cảnh, cuộn để tua** | `scripts/render-film.mjs`: Playwright chụp từng khung → ffmpeg → chuỗi AVIF/WebP (vẽ lên canvas 2D) hoặc video H.264 nhiều keyframe (tua bằng `currentTime`). Bố cục khung dọc 9:16 render riêng, không cắt từ khung ngang | T-SEQ | 4–6 (thế giới thật: render, nén, test Safari/iOS) | Video tua bằng `currentTime` trên iOS cần keyframe dày (GOP ngắn) mới mượt. **Chưa đo trên máy thật.** Prototype phải so sánh chuỗi ảnh và video trên iPhone + Android tầm trung |
| 15 | (Phương án thật) | **Quay thật (phương án Q)** phòng điều phối Bluebolt bằng điện thoại có gimbal, đúng như cách video mẫu được quay; màn hình phát site mới thật (hoặc ghép hậu kỳ) | Quay 1 buổi, dựng hậu kỳ, encode video tua theo cuộn cho **cả desktop và mobile** | Mọi tầng trừ T-STILL (dùng ảnh tĩnh từ footage) | Prototype: 2 (TG). Production: G5 ≈ 31 giờ (`04` mục 5.1) | **Ngang hàng A+/B** trong lựa chọn (`03` mục 9). Không cần WebGL hay 3D artist. Cần phòng và thợ trông chuyên nghiệp, quyền hình ảnh nhân sự. Giả định chờ anh xác nhận: có phòng điều phối thật đủ đẹp để quay |

**Ghi chú ước lượng:** các dòng có giờ cộng lại khoảng 20–31 giờ Claude Code nếu làm đủ mọi yếu tố cho production. Đây **không** phải lịch dự án. Đường găng là việc người: duyệt style frame, số liệu thật để hiện trên các màn hình, quyết định quay thật hay render, test máy thật, các vòng duyệt với anh Duy.

## A6. Những gì cố ý không sao chép

| Không lấy | Lý do | Bluebolt dùng gì thay |
|---|---|---|
| Bố cục, màu (rêu `#10211b`, chanh `#86c832`, kem), ảnh nội thất, chữ viết tay, giọng "The Art of…" của mddecorpro.com | Đó là nhận diện ngành nội thất, và anh đã nói rõ không làm giống site | Xanh `#004AAD` + cam `#EF8426`, giọng "nhanh, chuẩn, minh bạch" (03 mục 11) |
| Cảnh "dev ngồi code" (laptop hiện VS Code) | Câu chuyện của video là "agency vừa làm xong web". Câu chuyện của Bluebolt là **một đơn lắp đặt được xử lý** | Laptop hiện dashboard điều phối của Hãng (03 mục 4–5) |
| Thiết bị nhận ra thương hiệu (MacBook, macOS) | Rủi ro nhãn hiệu, và làm loãng thương hiệu Bluebolt | Thiết bị trung tính, nhôm mờ, không logo (03 mục 6.3) |
| Bàn tay người trong cảnh 3D realtime | Tay 3D dễ thành "thung lũng kỳ lạ" | Cảm giác có người đến từ `handheld`, ly cà phê, sổ tay. Nếu quay thật (A5 #15) thì giữ tay được |
| Nghiêng ngang theo cuộn ở giữa phim | Hợp với video quay tay, không hợp với web cuộn | Chỉ nghiêng 2–4° ở khung đầu rồi cân về 0° (A5 #4) |
| Video tự chạy theo thời gian | Video là thứ để xem. Web là thứ để điều khiển | Máy chỉ đi khi người dùng cuộn (03 mục 3.2, luật 2) |

## A7. Giả định chờ anh xác nhận (liên quan Phần A)

1. Cách hiểu "thứ anh thích là ngôn ngữ máy quay" đúng chưa: cảnh rộng chéo góc → tiến về chính diện → phòng tối, màn hình sáng → website sống trên màn hình?
2. Cảnh nên **cách điệu, dựng bằng code** (rẻ, nhẹ, Claude Code tự làm) hay **photoreal** (cần 3D artist, chi phí chưa có báo giá) hay **quay thật** phòng điều phối (A5 #15)?
3. Anh có muốn giữ "tay người" như video không? Nếu có thì gần như chỉ làm được bằng quay thật.
4. Giao diện trên các màn hình trong cảnh dùng **màn hình thật** của dashboard/app thợ Bluebolt (cần đội sản phẩm cung cấp) hay **giao diện minh họa** có ghi chú?

---

## Phụ lục A — Bài học kỹ thuật từ site mddecorpro.com (thu gọn)

Chỉ giữ phần kỹ thuật có ích. Bản phân tích đầy đủ (16 kỹ thuật motion, token màu, ghi chú về agency) nằm trong `research/research-results.json → research:tiktok-sample` và `research/agent-notes/creative-technologist/`.

| # | Bài học | Bằng chứng | Áp dụng cho Bluebolt |
|---|---|---|---|
| 1 | **Site mẫu không có WebGL.** 0 canvas, 0 lần gọi `getContext` trên 12 trang. Cảm giác mượt đến từ GSAP + easing tốt | `research/agent-notes/creative-technologist/mddecorpro/probe.json` | "Mượt" không bắt buộc phải có 3D. Phần sau phim của Bluebolt dùng motion 2.5D |
| 2 | **GSAP 3.15 + ScrollTrigger + ScrollSmoother + SplitText, nạp động (~144 KB chưa nén), chỉ khi ≥1024px và không bật reduced-motion.** Mobile dùng CSS / IntersectionObserver. Nội dung vẫn hiện khi JS lỗi | `.../mddecorpro/source/film-engine-chunk_gsap-scrolltrigger-smoother.js`, `motion-engine-loader_and_header.js` | Đúng kiến trúc progressive enhancement Bluebolt cần (03 mục 7.2, 12) |
| 3 | **Motion được token hoá:** ease `cubic-bezier(.16,1,.3,1)`, thời lượng .22 / .52 / .88s, stagger chữ .054s | `.../mddecorpro/source/main.css` | Học **cách token hoá**, không chép giá trị màu |
| 4 | **Smooth scroll gây bóng ma khi cuộn nhanh** (video t=14,0s). Film-out làm mờ nội dung | `research/agent-notes/creative-technologist/tiktok-frames/sheet3fps_14-22s_about-page.jpg` | Không film-out giá, hotline, CTA, pháp lý. Phim dùng `scrub`, không dùng smoother chiếm cuộn |
| 5 | **Hiệu năng yếu dù không có 3D:** Lighthouse lab mobile 68 (LCP 3,9s), desktop 50 (TBT 1.210 ms) | `.../mddecorpro/lighthouse/vi-mobile.json`, `vi-desktop.json` | Motion phải đi kèm ngân sách đo được (03 mục 8) |
| 6 | **Lỗi SEO khi bàn giao:** canonical, hreflang, sitemap, robots trỏ `http://localhost:3000` (14 lần trong HTML, 126 lần trong sitemap) | `.../mddecorpro/source/vi.html`, `sitemap.xml`, `robots.txt` | Test CI chặn chuỗi "localhost" trước go-live |
| 7 | **Đánh giá site qua video 576px che mất mobile, tốc độ, SEO** | So sánh video với số đo Lighthouse | Mọi quyết định "mượt" phải có số đo kèm theo |

**So với Bluebolt hiện tại** (lab data, Lighthouse 12.8.2 simulate, headless trên bbsw; `research/lighthouse-summary.txt`):

| Trang | Mobile perf / LCP | Desktop perf / TBT |
|---|---|---|
| mddecorpro `/vi` | 68 / 3,9s | 50 / 1.210 ms |
| lapdattoanquoc.vn `/` | 73 / 5,6s | 60 / **36.430 ms** |
| lapdattoanquoc.vn `/services` | 97 / 2,4s | 100 / 0 ms |

TBT 36.430 ms của trang chủ Bluebolt chủ yếu do `<model-viewer>` render GLB 417.618 tam giác bằng CPU (SwiftShader). Chặn model-viewer thì blocking về 0 (`research/agent-notes/frontend-seo-a11y/longtask-model-viewer.txt`). Số này chưa được trích như hiệu năng người dùng thật cho tới khi đo trên GPU thật hoặc CrUX.

**Về agency trong video (XimiTech):** chỉ ghi dữ kiện. Quan hệ XimiTech – mddecorpro.com chỉ dựa trên caption TikTok, site không ghi credit. Chi tiết và nghi vấn báo chí ở `research:tiktok-sample`, chưa xác minh. Câu hỏi "anh có định thuê agency này không" vẫn mở (C6).

---

# PHẦN B — "3D" có 4 cấp

## B1. Bảng so sánh

| | **T1 — Ảnh render 3D tĩnh** | **T2 — Motion 2.5D** | **T3 — Chuỗi ảnh/video 3D cuộn** | **T4 — WebGL thời gian thực** |
|---|---|---|---|---|
| Là gì | Render/ảnh dàn dựng chung art direction: mascot nhiều pose, dàn lạnh trong căn hộ, icon 3D | Parallax nhiều lớp, Ken Burns, curtain clip-path, chữ hiện so le, card perspective CSS | 60–120 khung ảnh render (hoặc video) tua theo cuộn. **Với hướng điện ảnh: phim trang chủ trên mobile (T-SEQ)** | three.js / React Three Fiber: camera rig theo cuộn, thiết bị trong cảnh, bản đồ 34 tỉnh. **Với hướng điện ảnh: phim trang chủ trên desktop (T-FULL/T-LITE)** |
| Ví dụ | BOXT (chim cánh cụt 3D), Dyson | Site mẫu mddecorpro (phần kỹ thuật), Stripe (phần DOM) | **Apple AirPods Pro: có video tua theo cuộn, đã đo** (C1 nhóm 4) | basement.studio, Shopify Editions, Lusion (C1 nhóm 4); **Bluebolt hiện tại** (model-viewer) |
| Dung lượng thêm | Hero AVIF ≤ ~120–200 KB/ảnh (ước lượng) | GSAP ~144 KB chưa nén (chỉ desktop, theo mẫu). Mobile ~0 (CSS) | Video tua mobile: ngân sách ≤ 110 KB/s phim. Đo thật: 4 s ở 720p/GOP 4 = 933–975 KB, ở 540p/GOP 8 = 303 KB (`04` mục 3.2) | Runtime 3D ~260 KB gz + GLB 352 KB (mobile) / 628 KB (desktop), **đã đo trong POC** |
| Rủi ro mobile | Thấp. Chỉ ảnh hưởng LCP nếu ảnh hero nặng | Thấp nếu mobile dùng CSS. Cao nếu scrub/smooth scroll trên cảm ứng | Trung bình: tải nhiều khung, pin + scrub dễ "kẹt cuộn", tua video trên iOS cần GOP ngắn | **Cao:** POC mobile blocking 928 ms (có 3D) so với 180 ms (không 3D). Site hiện tại desktop TBT 36.430 ms |
| SEO | Tốt (ảnh có alt, chữ ở HTML) | Tốt nếu chữ không bị ẩn khi JS lỗi | Trung tính. Nội dung bước phải nằm trong HTML | Rủi ro nếu chữ/số vẽ trong canvas. Bắt buộc có bản HTML song song |
| A11y | Alt text | Bắt buộc `prefers-reduced-motion` | reduced-motion → ảnh tĩnh từng bước | Canvas `aria-hidden` hoặc `role=img`, điều khiển bàn phím, fallback poster/SVG |
| Cái "wow" | Trung bình–cao | Cao: cảm giác "mượt" | Cao, đúng một chỗ | Rất cao nếu kể chuyện hoặc có chức năng (bản đồ độ phủ). Thấp nếu chỉ trang trí |
| Claude Code làm được | Code hiển thị: có. **Tạo asset đẹp: không** | Có, toàn bộ | Code tua khung: có. Xuất khung từ scene dựng thủ tục: có (Playwright + ffmpeg). Render photoreal: không | Có: R3F, camera rig, shader, bản đồ từ TopoJSON, thiết bị dựng thủ tục, test Playwright. **Không:** rig/animate mascot, đo FPS máy thật |
| Đường găng (người) | Ảnh/render 15–25 tấm, chụp ảnh thợ thật | Duyệt "độ mượt" với anh Duy, test chuột/trackpad | Duyệt style frame, test iPhone + Android thật | Duyệt style frame, số thợ theo tỉnh (**chưa có**), pháp chế bản đồ chủ quyền, test Android tầm trung thật |

## B2. Ước lượng effort theo cấp

Cách tính:

- Giờ Claude Code tách theo loại việc. Hệ số nén so với người: trang lặp khuôn ~5×, logic mới ~3×, chạm thế giới thật ~1,5×, duyệt với anh Duy ~1×.
- Cột "≈ giờ người" = giờ Claude × hệ số. Chỉ để so sánh, không phải cam kết.
- Các con số **không có trong nguồn research** ghi là **"ước lượng tài liệu này"**.

| Cấp | Việc | Loại (hệ số) | Giờ Claude Code | ≈ Giờ người tương đương | Việc người (không nén, đường găng) |
|---|---|---|---|---|---|
| T1 | Khung hiển thị ảnh hero, gradient, next/image, AVIF | Trang lặp khuôn (5×) | 0,5–2 | 2,5–10 | Sản xuất ảnh/render, chụp ảnh thợ thật. Lịch phụ thuộc ekip, **chưa ước lượng** |
| T1 | Tối ưu asset (AVIF 2 kích cỡ, poster) | Thế giới thật (1,5×) | 1–2 | 1,5–3 | — |
| T2 | Motion engine 2.5D cho phần ngoài phim | Logic mới (3×) | 10–15 (theo `research:tiktok-sample`) | 30–45 | — |
| T2 | Test máy thật: chuột Windows, trackpad Mac, Safari/iOS, Android tầm trung | Thế giới thật (1,5×) | 3–4 (ước lượng tài liệu này) | 4,5–6 | Người cầm máy thật |
| T3 | Pipeline render phim mobile (A5 #14) + trình tua khung | Thế giới thật (1,5×) + logic mới (3×) | 4–6 (ước lượng tài liệu này) | 9–15 | Duyệt khung dọc 9:16 |
| T4 | Camera rig + các cú máy + glow/exposure + handoff (A5 #1–13) | Logic mới (3×) | 16–25 (ước lượng tài liệu này) | 48–75 | Duyệt style frame và prototype |
| T4 | Bản đồ 34 tỉnh 3D + SVG fallback + bảng HTML | Logic mới (3×) | 6–10 (ước lượng tài liệu này) | 18–30 | **Số thợ theo tỉnh** (chưa có), pháp chế bản đồ |
| T4 | Test FPS / nhiệt máy trên Galaxy A06/A16, Redmi, iPhone | Thế giới thật (1,5×) | 3–4 (ước lượng tài liệu này) | 4,5–6 | Thiết bị thật hoặc BrowserStack |

**Tỷ lệ build : việc người.** Giờ build tính bằng giờ. Việc người (style frame, số liệu, quyết định quay thật hay render, pháp chế bản đồ, test máy thật, các vòng duyệt) tính bằng **tuần lịch**. Ước tính thô: giờ build chiếm khoảng 1/4–1/3 lịch phần 3D. Cần kiểm lại sau /demo-scope.

## B3. Điểm cần lưu ý riêng cho Bluebolt

- **Site đã có T4 nhưng làm sai cách.** `<model-viewer>` 4.0.0 tải `khang-3d.glb` 3.702.548 byte (417.618 tam giác, 1 mesh, không rig, auto-rotate) ở **trang chủ desktop và /intro ở mọi viewport, kể cả mobile** (critic đã kiểm lại). Không tôn trọng reduced-motion. Canvas nằm trong shadow DOM nên công cụ quét thông thường không thấy.
- **GLB tối ưu được ngay:** còn 628 KB (62.641 tam giác) hoặc 352 KB (25.056 tam giác) bằng gltf-transform. Đã chạy thật (`research/agent-notes/webgl-architect/r3d-measurements.json`, ảnh `r3d-glb-original.png` / `r3d-glb-opt15.png` / `r3d-glb-opt06.png`).
- **POC Next 16.3.8 + R3F đã chạy được:** LCP vẫn là ảnh poster HTML; reduced-motion thì không tải 3D (tổng 176,6 KB). Ảnh: `research/agent-notes/webgl-architect/nextpoc-*.png`. Bản mobile của POC đang **crop mất phần đất liền phía tây**, phải sửa camera trước khi dùng.
- **Bản đồ VN:** TopoJSON 34 tỉnh (MIT) có đủ Hoàng Sa (Đà Nẵng) và Trường Sa (Khánh Hòa), 31,7 KB. Hai quần đảo phải luôn trong khung ở mọi breakpoint và mọi khung của cú `crane`. Cơ sở pháp lý **chưa kiểm chứng**, cần pháp chế xác nhận.
- **Ràng buộc phiên bản:** R3F 9.8.1 yêu cầu React `>=19 <19.4`, phải ghim React 19.3.x. GSAP 3.15 miễn phí mọi plugin cho website thương mại. Nếu sau này dùng GSAP trong portal **thu phí người dùng**, đọc lại điều khoản license.
- **Spline:** chỉ để phác ý tưởng, không nhúng production (runtime ~35,9 MB unpacked, gói Free có watermark).

## B4. Đề xuất (giả định, chờ anh xác nhận)

Đề xuất v1 ("nền T1 + T2, tối đa 1–2 điểm nhấn") được **thay** bằng đề xuất theo hướng điện ảnh:

| Vùng | Cấp 3D | Ghi chú |
|---|---|---|
| Phim trang chủ, desktop đủ GPU | **T4** (một canvas, camera rig theo cuộn) | Tầng T-FULL / T-LITE, có tự hạ cấp theo FPS |
| Phim trang chủ, mobile (màn nhỏ hoặc dọc) | **T3** (video tua render từ cùng cảnh; chuỗi ảnh là dự phòng) | Tầng T-SEQ |
| Reduced-motion, Save-Data, không JS, desktop không đủ GPU | T1 (ảnh tĩnh mỗi shot) | Tầng T-STILL (`04` mục 3.1) |
| `/mang-luoi` | T4 bản đồ tương tác + SVG + bảng 34 tỉnh | Trang duy nhất ngoài trang chủ có WebGL live |
| Hero các trang giải pháp, dịch vụ | T3 (video loop ngắn render từ cảnh) | 03 mục 7.5 |
| Mọi phần còn lại | T1 + T2 | Motion 2.5D token hoá (Phụ lục A, bài học 2–3) |

**Bước tiếp theo:** 3 style frame rồi 3 prototype **A+ (khuyến nghị, sát video nhất), B, Q (quay thật)**. Rủi ro từng bản ở `03-DINH-HUONG-THIET-KE-3D.md` mục 9, giờ ở `04` mục 5 (tới launch: A+ ≈ 271, B ≈ 281, Q ≈ 244 giờ Claude Code). Số A ~11 / B ~17 / C ~27 giờ của bản đầu chỉ là giờ dựng prototype, đã lỗi thời.

Prototype là demo **tĩnh, không có form hay API**, nên nằm trong phạm vi được làm trước /contract. Tính năng động (form lead, tra cứu đơn, CMS) vẫn phải chờ contract APPROVED.

---

# PHẦN C — Benchmark

## C1. Benchmark quốc tế

Số đo `kbAtFold` và LCP ở nhóm 1–3 lấy từ Playwright headless trên bbsw (`research/agent-notes/market-benchmark/bench-intl-both.json`). Đây là lab data, dao động giữa các lần đo (Stripe đo ra 780 ms–7,3s).

### Nhóm 1 — Mô hình gần nhất: mạng lưới lắp đặt / dịch vụ tại nhà

| Tên | URL | Loại | Làm tốt gì | Bài học cho Bluebolt |
|---|---|---|---|---|
| Urban Company (AC service) | https://www.urbancompany.com/bangalore-ac-service-repair | Dịch vụ tại nhà B2C | Giá "Starts at ₹1,599" cho từng hạng mục. 4.78★ / 14.1M bookings. Bảo hành 30 ngày (UC Cover). "Verified Professionals". LCP ~360 ms, không canvas | Khuôn cho trang dịch vụ và bảng giá: giá "từ", thời lượng, số ngày bảo hành, nút đặt |
| Field Nation | https://www.fieldnation.com/ | Marketplace kỹ thuật viên B2B | Số quy mô cụ thể (1M+ work orders/năm, 98% success rate). Tách Buyers và Providers. Dùng Lottie, không WebGL | Khu B2B + trang tuyển thợ: số liệu có định nghĩa |
| HelloTech Partnerships | https://content.hellotech.com/partnerships | Lắp đặt toàn quốc cho doanh nghiệp | H1 "Nationwide tech installation and support for your business". 1 CTA. Ảnh thợ thật trên nền bản đồ mờ có pin | **Gần nhất với định vị Bluebolt.** Ảnh: `research/agent-notes/market-benchmark/shots/content_hellotech_com_partnerships--desktop-fold.jpg` |
| InstallerNet | https://www.installernet.com/network-of-trained-professionals/ | Lắp đặt cho retailer/OEM (Mỹ) | "10,000 installers / 3,500 locations", nhưng chỉ có chữ, không bản đồ | Bản đồ độ phủ của Bluebolt phải đi kèm số liệu nhất quán |
| WorkMarket (ADP) | https://www.workmarket.com/ | Phần mềm quản lý thợ tự do | Testimonial có số đo ("91% reduction in the time per dispatch") | Mỗi case study của hãng có 1 chỉ số kết quả |
| TaskRabbit | https://www.taskrabbit.com/ | Dịch vụ tại nhà + đối tác IKEA | Giá theo dịch vụ ($49, $69). Counter theo hạng mục. TaskProtect | Counter theo thiết bị (số thật) thay cho "500+ / 1,500+" |
| Thumbtack cost guide | https://www.thumbtack.com/p/ac-unit-cost | Minh bạch giá / SEO | H1 chứa khoảng giá ("$1,330-$5,906") | Tin tức thành "cost guide" theo thiết bị/tỉnh |
| Handy | https://www.handy.com/ | Dịch vụ tại nhà B2C | Form đặt ngay trên hero, upfront price, Happiness Guarantee | Form hero, **chỉ khi Bluebolt nhận B2C** (câu hỏi mở) |
| Frontdoor | https://www.frontdoor.com/ | Sửa chữa + chẩn đoán qua video | Video chat với chuyên gia trước khi cử thợ | Ý tưởng "chẩn đoán qua Zalo video", chờ anh xem có vận hành được không |
| Seekster (Thái Lan) | https://www.seekster.co/en/services/ac-cleaning/orders | Dịch vụ máy lạnh ĐNÁ | Giá vệ sinh ฿749/máy, bảo hành 15–30 ngày, gói thuê bao | **Chưa kiểm chứng trực tiếp** (bị chặn HTTP 402) |

### Nhóm 2 — Benchmark 3D trong ngành và dữ liệu độ phủ

| Tên | URL | Loại | Làm tốt gì | Bài học cho Bluebolt |
|---|---|---|---|---|
| BOXT — Air conditioning | https://www.boxt.co.uk/air-conditioning | Lắp điều hoà trọn gói (UK) | Nhân vật 3D render ở hero: cảm giác 3D mà không cần WebGL. Trustpilot 4.7/64,213 reviews. Nhược điểm: ~11,7 MB ở fold, LCP 4–5,5s | Ảnh render dùng cho các trang ngoài phim, nén AVIF. Ảnh: `.../market-benchmark/shots/boxt_co_uk_air_conditioning--desktop-fold.jpg` |
| Daikin UK 3D app | https://www.daikin.co.uk/en_gb/residential/inspiration/3d-app.html | Hãng điều hoà, 3D/AR | 3D có chức năng: hình dung dàn lạnh/dàn nóng trong nhà | Viewer 3D (nếu có) phải giải thích vị trí lắp, chỉ tải khi bấm |
| GitHub Globe | https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/ | Globe WebGL | SVG placeholder trước, crossfade sang canvas. Hạ chất lượng nếu < 55,5 FPS. Có reduced-motion | **Công thức bắt buộc** cho bản đồ VN 3D và cho tự hạ cấp T-LITE → T-SEQ |
| Cloudflare Network | https://www.cloudflare.com/network/ | Chứng minh độ phủ | 348 cities, chia theo vùng, cam kết đo được ("95% … within 50 ms"). Nhược điểm: LCP ~5,5s do WebGL | `/mang-luoi`: số thợ theo vùng + danh sách tỉnh + 1 SLA đo được (cần dữ liệu thật) |
| Shopify Live Globe | https://www.shopify.com/news/live-globe-2024 | Globe dữ liệu thời gian thực | Globe 3D chỉ dùng cho sự kiện, **tách khỏi trang bán hàng** | Bản đồ "đơn đang diễn ra" chỉ làm nếu có API thật |

### Nhóm 3 — "Quốc tế / premium" và logistics

| Tên | URL | Loại | Làm tốt gì | Bài học cho Bluebolt |
|---|---|---|---|---|
| Stripe | https://stripe.com/ | Motion premium | Gradient WebGL có ảnh fallback. Băng logo khách. Hàng KPI | "Quốc tế" đến từ typography lớn, KPI, fallback chu đáo |
| Flexport | https://www.flexport.com/ | Logistics | Mockup dashboard thật. ~640 KB ở fold, LCP 0,7–0,9s, có reduced-motion | Chuẩn hiệu năng tốt nhất nhóm. Ý tưởng gần với device-in-scene: **cho khách B2B thấy công cụ** |
| Maersk | https://www.maersk.com/ | Logistics | Ô tra cứu ngay dưới H1. Nhưng LCP 9,3–10,2s | Pattern ô tra đơn. Phản ví dụ hiệu năng |
| DHL | https://www.dhl.com/us-en/home.html | Logistics | Tracking ở hero, tách cá nhân / doanh nghiệp. LCP mobile ~1,65s | Phân luồng nhóm khách ngay trang chủ |
| Dyson Việt Nam | https://www.dyson.vn/en-VN/ | Điện máy premium | H1 dạng số liệu, ảnh render đẹp. Nhưng ~9,6 MB ở fold, LCP mobile ~5,1s | Tiêu đề bằng số liệu (khi có số thật). Cảnh báo ảnh render nặng |
| Lodisna | https://lodisna.com/ | Logistics kiểu Awwwards | WebGL2 + GSAP. Nhưng **~16,6 MB ở fold, cả trên mobile** | **Phản ví dụ** cho "3D toàn bộ" |

### Nhóm 4 — Cinematic scroll camera / device-in-scene (mới, đã tự kiểm)

**Cách kiểm (01/10/2026):** Chromium headless (playwright-core 1.62.0, viewport 1440×900 và 1280×800, WebGL qua SwiftShader). Với mỗi URL: ghi HTTP status, tiêu đề, URL cuối, số thẻ `<canvas>` và `<video>`, chiều cao trang, chụp ảnh trước và sau khi cuộn. Với trang Apple, chạy thêm phép thử "video tua theo cuộn": cuộn từng nấc 300px, video nào **đang hiện, đang dừng (paused) mà `currentTime` vẫn đổi theo cuộn** ở ≥3 nấc thì tính là scrub. Script và kết quả: `research/benchmark-cinematic/probe-*.js`, `probe-cine-1.json`, `probe-scrub.json`, `probe-shots.json`. Ảnh: `research/benchmark-cinematic/shots/` (xem nhanh `montage.jpg`).

Giới hạn: lab headless, GPU giả lập. "Chiều cao trang = chiều cao màn hình" là dấu hiệu canvas tự xử lý cuộn (scroll-jacking), suy ra từ số đo, chưa đọc mã nguồn. Không trích dẫn giải thưởng của các site này vì chưa tự kiểm.

| Tên | URL (đã kiểm, status 200) | Số đo | Kỹ thuật thấy được | Bài học cho Bluebolt |
|---|---|---|---|---|
| **Apple AirPods Pro 3** | https://www.apple.com/airpods-pro/ | 16 video, 0 canvas, trang cao ~29.000px. **1 video tua theo cuộn (đã đo)** | Video scrub theo vị trí cuộn trong một section dính, cuộn native | **Mẫu chuẩn cho T-SEQ:** phim mobile có thể là video tua theo cuộn thay cho chuỗi ảnh. Cuộn vẫn native. Ảnh: `shots/airpods-0.jpg`, `airpods-1.jpg` |
| Apple MacBook Pro | https://www.apple.com/macbook-pro/ | 14 video, 0 canvas, trang cao ~42.000px. Không phát hiện video scrub | Video phát khi vào khung, không tua theo cuộn | Hero trang con: video loop phát khi vào khung là đủ (03 mục 7.5), không cần scrub ở mọi nơi |
| Apple Vision Pro | https://www.apple.com/apple-vision-pro/ (URL `/vision-pro/` chuyển hướng về đây) | 26 video, 0 canvas. Không phát hiện video scrub | Nhiều video, mỗi section một cảnh | Apple làm "điện ảnh" bằng **video render sẵn**, không bằng WebGL, kể cả trên desktop. Ủng hộ chọn T3 cho mobile |
| **basement.studio** | https://basement.studio/ | 2 canvas, có GSAP, trang cao ~6.300px, **cuộn native** | Hero là cảnh nội thất 3D dạng wireframe (cầu thang, phòng), sau đó là trang web bình thường | **Gần nhất với cấu trúc Bluebolt:** một cảnh 3D ở đầu, rồi trả lại trang web thường với cuộn native. Ảnh: `shots/basement-0.jpg`, `basement-1.jpg` |
| **Shopify Editions** | https://www.shopify.com/editions | 1 canvas, có Lenis, chiều cao trang = chiều cao màn hình | Một căn phòng 3D có kệ, mỗi "edition" là một vật thể trên kệ. **Nội dung sống trong vật thể của cảnh** | Ý tưởng device-in-scene ở quy mô thương hiệu lớn. Nhưng canvas chiếm cuộn: **Bluebolt không theo cách này**. Ảnh: `shots/shopify-editions-0.jpg` |
| Lusion | https://lusion.co/ | 3 canvas, chiều cao trang = chiều cao màn hình, có màn hình tải (đếm %) | Studio 3D, cảnh WebGL toàn trang | Chuẩn "wow" của giới làm 3D, nhưng có màn hình chờ tải và chiếm cuộn. **Phản ví dụ** cho trang dịch vụ cần chuyển đổi |
| Igloo Inc. | https://www.igloo.inc/ | Không đếm được canvas trong DOM chính, ảnh chụp sau cuộn có cảnh 3D wireframe; chiều cao trang = chiều cao màn hình | Camera đi trong một cảnh 3D liên tục | Tham khảo cảm giác "một cú máy liền" (A4 #4). Chiếm cuộn nên không lấy cách điều hướng |
| drei `<Html>` (tài liệu kỹ thuật) | https://drei.docs.pmnd.rs/misc/html | Trang tài liệu | Đặt HTML thật vào cảnh R3F, có `transform` và `occlude` | Cách làm màn hình HTML sống trong thiết bị 3D. Dùng cho prototype. Production ưu tiên texture chụp sẵn (03 mục 5) để nhẹ hơn |
| three.js `css3d_youtube` (ví dụ kỹ thuật) | https://threejs.org/examples/#css3d_youtube | Trang ví dụ | CSS3DRenderer: phần tử HTML được biến đổi 3D cùng camera | Phương án thay thế cho handoff: màn hình là HTML thật ngay từ đầu. Đổi lại khó có ánh sáng/glow |
| CSS-Tricks: cuộn kiểu Apple | https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/ | Bài hướng dẫn | Chuỗi ảnh vẽ lên canvas 2D theo tiến độ cuộn, có preload | Công thức cơ bản cho `SequenceFilm.tsx` (T-SEQ) |
| GSAP ScrollTrigger (tài liệu) | https://gsap.com/docs/v3/Plugins/ScrollTrigger/ | Tài liệu | `scrub`, `pin`, timeline theo cuộn | Nền của camera rig (A5 #1) |

**Rút ra từ nhóm 4:**

1. **Apple làm cảm giác điện ảnh bằng video render sẵn, không bằng WebGL** (0 canvas trên cả 3 trang đã đo). Đây là căn cứ cho T-SEQ trên mobile.
2. **Các site WebGL "wow" nhất đều chiếm quyền cuộn** (Shopify Editions, Lusion, Igloo: chiều cao trang = chiều cao màn hình). Với trang dịch vụ cần người dùng tìm giá, hotline, form thì đây là anti-pattern (C4).
3. **basement.studio là cấu trúc nên theo:** cảnh 3D ở đầu trang, rồi trả lại trang web bình thường. Đó cũng là cấu trúc "phim → handoff → trang thường" của Bluebolt.
4. Chưa thấy site dịch vụ lắp đặt nào (nhóm 1) dùng camera theo cuộn. Đây là cơ hội khác biệt, cũng là rủi ro vì không có mẫu cùng ngành đã chứng minh chuyển đổi tốt.

## C2. Đối thủ / đối tác trong nước

| Tên | URL | Vai trò | Ghi chú (`bench-vn-both.json`) |
|---|---|---|---|
| Điện Máy XANH | https://www.dienmayxanh.com/kinh-nghiem-hay/chinh-sach-giao-hang-lap-dat-1261528 | Retailer tự lắp. Vừa là đối thủ vừa là đối tác tiềm năng lớn nhất | Công khai bảng giá dịch vụ, vật tư và thời gian giao theo km. Trang mobile tràn ngang 796px. Giá ống đồng 170.000đ/m **chưa kiểm chứng trực tiếp** |
| Daikin Việt Nam | https://www.daikin.com.vn/ | Hãng, khách hàng mục tiêu | Bảo hành tới 3 năm, hotline, tra mã lỗi. ~13–14 MB ở fold |
| bTaskee | https://www.btaskee.com/ | App dịch vụ gia đình | Có mảng bảo trì điện máy. LCP ~1s, có reduced-motion. B2C |
| JupViec | https://www.jupviec.vn/ | Giúp việc | 300,000+ khách, phủ 5 tỉnh |
| Vua Thợ | https://vuatho.com/vi | App kết nối thợ gần nhất | B2C, ~8,4 MB ở fold |
| Thợ Điện Máy Xanh | https://www.thodienmayxanh.com/ | Sửa chữa / lắp đặt | **Quan hệ với TGDĐ chưa kiểm chứng**. ~8,5 MB ở fold |
| Thái Anh Service | https://thaianhservice.vn/ | Điện lạnh | ~10 MB ở fold, không có H1 |
| Nguyễn Kim | https://www.nguyenkim.com/bang-gia-dich-vu-lap-dat.html | Retailer có bảng giá công lắp | URL trả 404, **nội dung chưa kiểm chứng** |

**Nhận định định vị (theo `research:benchmark`):** trong 8 site trong nước đã khảo sát, chưa site nào trình bày rõ "mạng lưới lắp đặt white-label toàn quốc cho hãng và sàn TMĐT" với SLA, theo dõi đơn và bản đồ độ phủ có số liệu. Mặt bằng web dịch vụ kỹ thuật VN thường nặng (8–14 MB ở fold) và ít số liệu. Cơ hội khác biệt: **kể chuyện bằng máy quay nhưng vẫn nhẹ và minh bạch**.

Critic lưu ý: mẫu 8 site phần lớn là B2C. Các đối thủ B2B trực tiếp **chưa được khảo sát**. Câu "trong nước chưa có ai" **chưa đủ căn cứ để khẳng định**.

## C3. Pattern nên áp dụng → gắn trang

Tên trang mới theo sitemap đề xuất ở 03 mục 10, **chưa chốt IA và chính sách 301** (câu hỏi mở).

| # | Pattern | Ví dụ | Trang Bluebolt | Mức |
|---|---|---|---|---|
| 1 | Hero: 1 câu giá trị + 1 CTA chính + lối vào theo nhóm khách (Hãng / Sàn / Thợ / [Gia đình]) | HelloTech, DHL | `/`, `/en` | **Must** |
| 1b | Form đặt lịch hoặc ô tra đơn ngay trên hero | Handy, Maersk | `/` | **Có điều kiện:** chỉ khi anh xác nhận nhận B2C trực tiếp và có API tra đơn |
| 2 | **Phim máy quay theo cuộn** ở đầu trang chủ, cuộn native, rồi trả lại trang thường (handoff) | Video mẫu (ngôn ngữ máy), basement.studio (cấu trúc), Apple AirPods (scrub mobile) | `/` | **Must nếu anh duyệt prototype** (03 mục 9) |
| 3 | **Device-in-scene:** dashboard Hãng, app thợ, báo cáo đối soát hiện trên thiết bị trong cảnh | Shopify Editions (nội dung trong vật thể), Flexport (cho thấy công cụ) | `/`, hero các trang giải pháp, `/doi-tac-tho` | **Must** (cần anh chốt màn hình thật hay minh họa) |
| 4 | Bản đồ độ phủ có số theo vùng + bảng HTML. WebGL có SVG fallback | Cloudflare, GitHub globe | `/mang-luoi`, shot 2 trang chủ | **Must** (phụ thuộc số thợ theo tỉnh) |
| 5 | Minh bạch giá: "từ…" theo hạng mục, vật tư theo mét, bảo hành theo ngày | Urban Company, TaskRabbit, Thumbtack | Bảng giá, trang dịch vụ | **Must** |
| 6 | Số liệu theo hạng mục, có định nghĩa, không lặp nhãn | TaskRabbit, Field Nation, Stripe | Hàng KPI trang chủ, giới thiệu | **Must** (chờ anh chốt bộ số) |
| 7 | Bảo hành / bảo đảm có tên thương hiệu | TaskProtect, Handy Guarantee, UC Cover | Hero, dịch vụ, bảng giá, footer | **Must** (chờ chốt thời hạn) |
| 8 | Khu B2B riêng: SLA, lợi ích chi phí, case study có chỉ số | Field Nation, HelloTech, WorkMarket | Các trang giải pháp + EN | **Must** |
| 9 | Hệ motion 2.5D token hoá, progressive enhancement cho phần ngoài phim | Site mẫu (kỹ thuật, Phụ lục A) | Toàn site | **Must** |
| 10 | Tra cứu đơn bằng mã/SĐT | Maersk, DHL | `/tra-cuu` | Should (chưa biết app BBSV có API không) |
| 11 | Hồ sơ thợ: xác minh, chứng chỉ, vinh danh | Urban Company, Field Nation | Giới thiệu, `/doi-tac-tho` | Should (cần thợ đồng ý về ảnh/tên) |
| 12 | Trang tuyển thợ theo lợi ích + 3 bước đăng ký | Field Nation for techs | `/doi-tac-tho` | Should |
| 13 | Trang giá kiêm trang SEO | Thumbtack | Tin tức | Should |
| 14 | Social proof bên thứ ba có số review | BOXT Trustpilot | Dưới phim | Should (chỉ khi có Google Business Profile thật; logo hãng cần văn bản đồng ý) |
| 15 | Đa ngôn ngữ thật: số liệu khớp vi/en, slug EN riêng, **texture màn hình trong cảnh riêng cho EN** | Urban Company, Cloudflare | Toàn site × 2 | Should (cần người viết EN bản ngữ) |
| 16 | Viewer 3D có chức năng, tải khi bấm | Daikin UK | Bài hướng dẫn lắp máy lạnh | Nice |
| 17 | Gói bảo trì định kỳ | Seekster (chưa kiểm chứng), BOXT | Bảng giá | Nice (quyết định kinh doanh) |

## C4. Anti-pattern: site 3D/motion nặng

| Anti-pattern | Bằng chứng đo được | Luật cho Bluebolt |
|---|---|---|
| WebGL / ảnh nặng làm LCP chậm | Maersk LCP 9,3–10,2s; Lodisna ~16,6 MB ở fold; BOXT ~11,7 MB; Cloudflare /network LCP ~5,5s; Dyson VN LCP mobile ~5,1s | Ngân sách ở 03 mục 8.2: JS tải đầu ≤170 KB gz, runtime 3D ≤260 KB gz tải sau LCP, LCP ≤2,5s p75 |
| **Canvas chiếm quyền cuộn, màn hình chờ tải** | Shopify Editions, Lusion, Igloo: chiều cao trang = chiều cao màn hình; Lusion có màn hình đếm % (`research/benchmark-cinematic/probe-shots.json`) | Cuộn native, `scrub` theo vị trí cuộn. Không có màn hình chờ tải: H1 và poster hiện ngay. Có link "Bỏ qua phần giới thiệu" |
| Chính Bluebolt hiện tại | Model-viewer 3,7 MB làm desktop TBT 36.430 ms (lab, SwiftShader). Mobile LCP 5,6s | Gỡ hoặc nén GLB là việc đầu tiên |
| Canvas là LCP, chữ vẽ trong canvas | Rủi ro theo `research:tech-3d` | LCP luôn là H1 hoặc poster HTML. Mọi chữ/số nằm trong HTML (A5 #12) |
| 3D không có fallback | GitHub giải bằng SVG placeholder + hạ cấp theo FPS | 4 tầng T-FULL / T-LITE / T-SEQ / T-STILL (03 mục 7.2) |
| Bỏ qua `prefers-reduced-motion` | GitHub, Apple, Flexport, DHL đều có. lapdattoanquoc.vn đo được **false** | Reduced-motion → T-STILL, tắt `handheld` |
| Pin dài trên mobile | NN/g: người dùng mất phương hướng, tưởng là lỗi | Phim mobile ngắn hơn desktop, có thanh chương và link bỏ qua |
| Máy và nội dung cùng chuyển động lớn | Video mẫu tách rõ: máy dừng rồi trang mới chạy (A4 #8) | Mỗi shot có đoạn dừng đọc 20–30 vh |
| Nghiêng ngang theo cuộn | Gây chóng mặt, cảm giác "trò chơi" | Chân trời luôn thẳng (A5 #4) |
| 3D thay thế thông tin | Bản đồ đẹp nhưng không trả lời "tỉnh tôi có thợ không" | Luôn có danh sách/bảng HTML tìm được |
| Chữ / số đè lên nền phức tạp | Fold mobile Bluebolt: số trắng trên bản đồ nhạt (`research/agent-notes/market-benchmark/shots/lapdattoanquoc_vn--mobile-fold.jpg`) | Chữ trên nền sạch, scrim hoặc card, tương phản AA |
| Tràn ngang | Bluebolt `/` mobile 527px trên 390. Điện Máy Xanh 796px | Test scrollWidth ở 360–1920 cho mọi URL trong CI |
| Số liệu mâu thuẫn trên nền 3D đẹp | 500+ / 1,500+ / 3000k+ thợ. 63 so với 34 tỉnh | Chốt một bộ số trước khi đưa lên màn hình trong cảnh |
| Video hero tự chạy nặng | Apple ~8,6 MB fold desktop với 16 video | Video chỉ tải khi vào khung, không tải khi Save-Data |

## C5. Những gì chưa kiểm chứng

| Mục | Trạng thái |
|---|---|
| Góc máy, tỉ lệ khung, biên độ rung tay trong video (A2) | Ước bằng mắt từ khung hình. Chỉ điểm cắt cảnh và độ sáng phòng là số đo (A3) |
| Tua video bằng `currentTime` mượt trên iOS Safari và Android tầm trung | Chưa đo trên máy thật. Phải đo trong prototype |
| Nhóm 4: cơ chế cuộn của Shopify Editions, Lusion, Igloo | Suy ra từ chiều cao trang = chiều cao màn hình, chưa đọc mã nguồn |
| Giải thưởng của các site nhóm 4 | Không trích vì chưa tự kiểm |
| Igloo Inc. dùng canvas ở đâu | Không đếm được canvas trong DOM chính dù ảnh chụp có cảnh 3D |
| Quan hệ XimiTech – mddecorpro.com | Chỉ dựa trên caption TikTok |
| Seekster: giá, bảo hành, gói thuê bao | Bị chặn 402 |
| Nguyễn Kim bảng giá lắp đặt | URL trả 404 |
| Giá ống đồng Điện Máy Xanh 170.000đ/m | Qua kết quả tìm kiếm |
| Quan hệ Thợ Điện Máy Xanh với TGDĐ | Chưa kiểm |
| Đối thủ B2B white-label trong nước | Chưa khảo sát |
| Chi phí 3D artist (cảnh photoreal, rig mascot) | Chưa có báo giá |
| Cơ sở pháp lý bản đồ chủ quyền | Cần pháp chế xác nhận |
| Mọi số Lighthouse / LCP / kbAtFold | Lab data headless trên bbsw, chưa có CrUX / field data |
| Hiệu năng WebGL trên GPU thật | SwiftShader chỉ cho số tương đối |
| Giờ Claude Code ghi "ước lượng tài liệu này" | Chưa qua /demo-scope, cần kiểm lại |

## C6. Câu hỏi cho anh Duy liên quan tài liệu này

Nhóm nghiên cứu không tự trả lời thay anh.

1. Cách đọc video ở Phần A đã đúng thứ anh thích chưa (POV ban ngày, phòng tối dần, website cuộn trên màn hình)? Anh có đồng ý duyệt **3 style frame** rồi **3 prototype A+/B/Q** (03 mục 9) trước khi chốt không?
2. Cảnh dựng bằng code (cách điệu), photoreal (thuê 3D artist), hay **quay thật** phòng điều phối Bluebolt? Có giữ tay người như video không?
3. Màn hình trong cảnh dùng giao diện thật của dashboard/app thợ (cần đội sản phẩm cung cấp) hay minh họa?
4. Bluebolt có nhận đơn B2C trực tiếp không? Quyết định pattern 1b.
5. Bộ số liệu chính thức (số thợ, số tỉnh, số đơn, số hãng) và số thợ theo từng tỉnh để vẽ bản đồ?
6. Bản quyền mascot KHANG (ảnh và GLB). Ngân sách cho 3D artist, buổi quay/chụp thật?
7. Có được dùng logo hãng/sàn đối tác không (cần văn bản đồng ý)? Hãng mục tiêu là hãng Việt hay FDI?
8. Mức NFR để nghiệm thu, ví dụ: LCP mobile ≤2,5s, Lighthouse mobile ≥85, không tràn ngang ở mọi breakpoint, phim desktop ≥45 fps trên máy tham chiếu?
9. Anh chỉ lấy video làm cảm hứng, hay đang cân nhắc thuê agency trong video?

---

## Phụ lục — Chỉ mục bằng chứng chính

| Nhóm | Đường dẫn |
|---|---|
| Video gốc + metadata | `research/tiktok/sample.mp4`, `sample.info.json`, `sample.description`, `frames/` (47 khung) |
| **Khung hình phân tích máy quay (mới)** | `research/tiktok/sheets/camera_keyframes_0-0.33-0.67-1-2-4-5-6s.jpg`, `camera_6fps_0-4s.jpg`, `camera_3fps_4-10s.jpg`, `camera_full_1fps_0-47s.jpg`, `camera_0-8s.jpg` |
| **Số đo video (mới)** | `research/tiktok/sheets/exposure_0-12s.txt`, `scene-detect.txt` |
| **Benchmark cinematic (mới)** | `research/benchmark-cinematic/` (script `probe-*.js`, kết quả `probe-*.json`, ảnh `shots/`) |
| Khung hình có đánh dấu thời gian (bản v1) | `research/agent-notes/creative-technologist/tiktok-frames/` |
| Site mẫu: probe, source, Lighthouse | `research/agent-notes/creative-technologist/mddecorpro/` |
| POC 3D + đo GLB/bản đồ | `research/agent-notes/webgl-architect/` |
| Long task model-viewer | `research/agent-notes/frontend-seo-a11y/longtask-model-viewer.txt` |
| Benchmark nhóm 1–3 | `research/agent-notes/market-benchmark/bench-intl-both.json`, `bench-vn-both.json`, `shots/`, `full/` |
| Lighthouse site hiện tại | `research/lighthouse-summary.txt`, `research/lighthouse/` |
| Định hướng thiết kế (camera grammar, shot list, kiến trúc, prototype) | `03-DINH-HUONG-THIET-KE-3D.md` |

---

Cập nhật: 01/10/2026 — đã qua vòng phản biện
