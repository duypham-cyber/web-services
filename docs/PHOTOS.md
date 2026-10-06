# Ảnh trên website: ảnh minh họa và cách thay bằng ảnh thật (D-31)

Ngày 06/10/2026, anh Duy cho phép thay các khung "chờ ảnh chụp" bằng ảnh tìm được hợp với thị trường Việt Nam (không lấy ảnh của
thương hiệu khác) hoặc ảnh tạo bằng AI. Tài liệu này ghi ảnh nào đang dùng, lấy từ đâu, giấy phép gì, và cách thay khi có ảnh thật.

## Quy tắc đang áp dụng

- **Ảnh minh họa luôn có nhãn.** Ảnh AI hay ảnh stock đều không phải thợ, văn phòng hay công trình thật của Bluebolt. Mỗi khung có
  nhãn nhỏ "Ảnh minh họa" / "Illustrative image" (`components/media/Photo.tsx`). Trang Điều khoản dự kiến ghi đúng điều này
  ("ảnh minh họa có nhãn", `content/legal.ts`).
- **Alt mô tả đúng cái nhìn thấy**, không gọi người trong ảnh là thợ hay nhân viên Bluebolt.
- **Không logo, không chữ** trong ảnh. Thiết bị không thương hiệu, áo xanh trơn. Người và bối cảnh Việt Nam.
- **Không vẽ bản đồ Việt Nam bằng AI.** Mô hình dễ vẽ sai hình dạng hoặc thiếu Hoàng Sa, Trường Sa (NFR-MAP-01).
- **Không dùng ở mục công trình hay case study.** Mục đó chỉ dùng ảnh thật, có tỉnh và ngày (docs/03 mục 11.4).
- Một ảnh có thể xuất hiện ở nhiều trang, nhưng không lặp trong cùng một trang.

## Ảnh đang dùng

| id (`content/photos.ts`) | Nội dung | Nguồn · giấy phép | Dùng ở |
|---|---|---|---|
| `kho-hang-dien-may` | Nhân viên kiểm đơn bằng máy tính bảng trong kho thùng hàng điện máy | Canva AI · Canva AI Product Terms | Trang chủ (thẻ Hãng & sàn), /giai-phap (thẻ hãng), hero /giai-phap/hang-dien-may |
| `tho-nhan-don-xe-may` | Thợ trên xe máy chở thùng đồ nghề và thang, xem đơn trên điện thoại | Canva AI | Trang chủ (thẻ Thợ), hero /dich-vu, bước 02 quy trình |
| `tho-huong-dan-khach` | Thợ hướng dẫn một gia đình dùng điều hòa vừa lắp | Canva AI | Trang chủ (thẻ Khách lẻ), /giai-phap (thẻ sàn), hero /giai-phap/san-tmdt-ban-le, bước 03 |
| `phong-dieu-phoi` | Hai điều phối viên đeo tai nghe làm việc trước màn hình | Canva AI | Hero /giai-phap, hero /ve-chung-toi, bước 01 |
| `tho-lap-dieu-hoa` | Thợ lắp dàn lạnh điều hòa treo tường trong căn hộ | Canva AI | Thẻ và hero /dich-vu/lap-dat-dieu-hoa, bước 04, bìa bài "Lắp máy lạnh đúng cách" |
| `ve-sinh-loc-may-lanh` | Tay thợ rút tấm lưới lọc bám bụi khỏi dàn lạnh | FLUX.1 [schnell] · Apache-2.0 | Thẻ và hero /dich-vu/bao-tri-dinh-ky, bìa bài "10 nguyên nhân máy lạnh không lạnh" |
| `lap-dat-dien-may` | Tivi trên giá treo xoay, vách ốp vân đá (không người) | [Pexels · Max Vakhtbovych](https://www.pexels.com/photo/interior-of-modern-living-room-with-tv-on-wall-6636297/) · Pexels License | Thẻ và hero /dich-vu/lap-dat-dien-may |
| `robot-hut-bui` | Robot hút bụi trắng trên sàn gỗ xương cá (không người) | [Pexels · Ron Lach](https://www.pexels.com/photo/desk-area-and-cleaning-robot-on-floor-10567498/) · Pexels License | Thẻ và hero /dich-vu/lap-dat-robot-hut-bui |
| `doi-soat-cuoi-ngay` | Nhân viên làm việc với máy tính buổi tối, đèn bàn ấm | [Pexels · Vitaly Gariev](https://www.pexels.com/photo/focused-professional-working-at-computer-desk-39853305/) · Pexels License | Bước 05 quy trình (/giai-phap/hang-dien-may) |
| `van-phong` | Chậu cây trên tủ gỗ, văn phòng mở phía sau được làm mờ | [Pexels · Mikhail Nilov](https://www.pexels.com/photo/potted-plants-in-an-office-8297857/) · Pexels License | Khối "Thông tin doanh nghiệp" ở /ve-chung-toi |
| `dan-nong-mat-tien` | Cục nóng điều hòa trong lồng lam trên tòa nhà ốp gạch (không người) | [Unsplash · ali syaaban](https://unsplash.com/photos/brown-and-white-concrete-buildings-during-daytime-kKRStYVnmGA) · Unsplash License | Bìa bài "Tương lai ngành điện lạnh 2026" |

**Chưa có ảnh:** bìa bài "Rủi ro lắp máy giặt không đúng cách". Khoảng 30 ảnh máy giặt cửa trước miễn phí đã soát đều lộ thương hiệu
đọc được (Electrolux, Samsung, Siemens, Hotpoint, Sharp, Indesit…). Bài này vẫn hiện thân bài ngay, không có khung ảnh. Cần chụp thật
hoặc tạo ảnh AI khi có hạn mức.

Ảnh stock được chọn qua hai vòng: một agent tìm, một agent khác phóng to từng góc ảnh để soát logo, chữ, và đối chiếu giấy phép
trên trang gốc. Vòng soát đã loại 4 ảnh văn phòng vì có logo ViewSonic, Dell, điều hòa Daikin và nhãn ghế. Ảnh robot kiểu Roomba
(iRobot) cũng bị loại vì kiểu dáng nhận ra được hãng, dù không có logo. Pexels License cho dùng thương mại, không bắt buộc ghi tên
tác giả; bảng trên vẫn ghi để tra lại.

Bản gốc nằm ở `assets/photos/`. Thiết kế Canva chứa các ảnh AI: "Bluebolt web — ảnh minh họa AI (06/10/2026)" trên tài khoản Canva của
dự án; có thể xoá sau khi đã có ảnh thật.

## Thay bằng ảnh thật

1. Chép ảnh gốc (JPEG/WebP, cạnh dài ≥ 1600 px, đã chỉnh màu) vào `assets/photos/`.
2. Trong `content/photos.ts`, sửa mục tương ứng:
   - `master`, `width`, `height` theo ảnh mới;
   - `alt` mô tả ảnh thật;
   - `illustrative: false` (nhãn "Ảnh minh họa" tự mất);
   - `source` ghi người chụp, ngày chụp.
3. Chạy `node scripts/build-photos.mjs`. Script xuất AVIF + WebP ở 640, 1024 và bề rộng gốc vào `public/images/photos/`, kèm bản 16:9
   cho bìa bài viết. Script báo lỗi nếu kích thước sai hoặc bản 1024 px vượt 90 KB (ngân sách ảnh điện thoại, `budgets.json`).
4. Kiểm bằng `node scripts/build-photos.mjs --check`, rồi build và triển khai như thường lệ (`docs/PREVIEW.md`).

Không phải sửa trang hay component. Khung nào dùng ảnh nào: `components/solutions/kit/MediaFrame.tsx` (`KIT_PHOTOS`),
`components/home/DoorsSection.tsx`, `app/[locale]/ve-chung-toi/page.tsx`, `app/[locale]/dich-vu/page.tsx`, và trường `hero` trong
`content/articles/<bài>.ts`.

## Các nguồn đã thử ngày 06/10/2026

- **Canva AI:** chất lượng tốt nhất, nhưng hết hạn mức sau 5 ảnh. Muốn tải bản đầy đủ phải đặt ảnh vào một thiết kế rồi xuất trang
  (tool chỉ trả ảnh thu nhỏ 200 px).
- **FLUX.1 [schnell] qua Space Hugging Face:** ảnh dùng được nhưng hay tự vẽ chữ/logo lên thiết bị, phải lọc. Hạn mức GPU cho máy
  không đăng nhập hết sau vài ảnh.
- **FLUX.1 [dev]:** sạch hơn schnell nhưng mỗi ảnh 60–90 giây, cũng chung hạn mức.
- **Pollinations:** không dùng. Bản miễn phí trả ảnh 888 px, sai cảnh, có watermark.
- **Stock miễn phí (Pexels, Unsplash, Pixabay):** ảnh thợ gần như toàn bối cảnh Ấn Độ, Mexico, Hồng Kông. Chỉ hợp với cảnh không
  người (thiết bị, văn phòng, mặt tiền).
