# Phong cách giao diện MasterEnglish (landing)

Tài liệu này giữ lại phong cách đã chốt cho landing để các lần phát triển sau làm tiếp cho nhất quán.
Nguồn thật là code trong `src/features/marketing/`; tài liệu chỉ ghi các quyết định và lý do.

## Tinh thần

Nhí nhảnh, trong suốt (kính), kiểu anime Nhật, nhiều chuyển động nhưng nhẹ. Giọng văn giữ nguyên: bình tĩnh, thân thiện, thẳng thắn.
Tên thương hiệu viết thường liền nhau `masterenglish`. Khẩu hiệu: **Học có hướng. Tiến bộ có lý do.**

## Màu

Biến nằm ở `src/styles/base.css` (`:root`). Không dùng mã màu thô ngoài các giá trị dưới đây.

| Vai trò | Giá trị |
| --- | --- |
| Mực (chữ) | `--ink #20223b` |
| Chữ phụ trên nền kính | `--lp-muted #565a72` (đủ tương phản 4,5:1; `--muted` nhạt hơn, không dùng trên kính) |
| Nền giấy | `--paper #f7f7f2`, phủ loang Oải hương `#dedbfd`, Bạc hà `#c7f2dc`, Đào `#ffe1cb` |
| Nhấn chính | Tím `--indigo #5a54e8` (nút chính, liên kết trọng tâm), `--indigo-deep #3933a8` |
| Điểm nhấn phụ | Xanh chanh `--lime #d9f586` (huy hiệu, sao, trạng thái "Đã có") |

Mỗi vùng nhìn chỉ có một nút tím nổi nhất: **Bắt đầu miễn phí**.

## Chữ

- Nunito 500–900, subset `vietnamese` **và** `latin` (subset vietnamese chỉ chứa phần dấu). Tải bằng `next/font` ở `lib/fonts.ts`, chỉ gắn cho landing.
- Từ nhấn mạnh trong tiêu đề dùng `<em>` nghiêng có chân bằng **Lora** nghiêng. Không dùng Georgia: bản nghiêng thiếu glyph tiếng Việt (ế, ộ…) nên dấu bị vỡ.
- Tiêu đề: `clamp()`, `line-height ≥ 1.15`, `text-wrap: balance`, kiểm tra ở 360px để không cắt dấu.
- Phiên âm IPA dùng class `lp-ipa` (phông hệ thống) vì Nunito không có ký tự IPA.
- Không dùng `-webkit-text-stroke` trên Nunito: phông biến đổi có nét chồng nên viền bị rối.

## Kính trong suốt

Class `lp-glass`. Từ 768px: nền `rgba(255,255,255,.55)`, viền trắng mảnh, `backdrop-filter: blur(12px)`, bóng đổ nhiều lớp, bo 28px.
Dưới 768px: nền `.88`, **tắt** `backdrop-filter` để giữ 60fps trên máy yếu.

## Chuyển động

- Chỉ animate `transform`, `translate`, `opacity`. Không animate width/height/top/left.
- Không `useState` cho tọa độ chuột hay vị trí cuộn. `hooks/use-page-motion.ts` có một vòng `requestAnimationFrame` ghi `--mx`, `--my`, `--sp` vào biến CSS.
- Biến CSS được thừa kế nên **chỉ ghi vào phần tử đánh dấu** `data-motion="pointer|scroll|both"`. Ghi vào phần tử gốc làm trình duyệt tính lại style cả trang ở mỗi khung.
- Khối có hoạt ảnh vô hạn thì thêm `data-pause`: ngoài màn hình sẽ bị tạm dừng (class `is-offscreen`).
- Hoạt ảnh vô hạn đắt: giữ ít. Đã đo, hero có quá nhiều làm tụt khung hình. Hạt nhỏ nhấp nháy trong canvas, không bằng CSS.
- Vòng lặp tự dừng khi tab ẩn hoặc giá trị đã ổn định.
- `prefers-reduced-motion: reduce`: tắt toàn bộ hoạt ảnh, bỏ con trỏ tùy biến và màn mở đầu, đưa mọi thứ về tư thế tĩnh. Có test e2e kiểm tra.
- Con trỏ tùy biến chỉ bật với `(hover: hover) and (pointer: fine)` và **không bao giờ ẩn con trỏ thật**.
- Màn mở đầu: chỉ lần đầu (`localStorage me_intro_seen`), 1,2 giây, có nút `SKIP ✳`. HTML tĩnh luôn mang `hidden` nên công cụ tìm kiếm vẫn thấy đủ nội dung.

## Linh vật

`components/mascot.tsx`, SVG tách lớp. Mọi chuyển động bám vào thuộc tính `data-part`, `data-hand`, `data-ear`, `data-mouth`, `data-extra`, **không** bám vào id.
Thay ruột SVG bằng bản vẽ chuyên nghiệp hơn vẫn chạy miễn giữ các thuộc tính này. Các id cố định (`mascot-hat`, `ears`, `body`, `hands`, `eyes`, `pupils`, `mouth`) có thêm hậu tố `idSuffix` khi trang có nhiều linh vật.
Biểu cảm: `happy | thinking | celebrating | sleepy`. Chọn qua `expression`; CSS lo phần còn lại.

## Logo

`components/brand-logo.tsx`: chữ "m" trong bong bóng thoại và ngôi sao bốn cánh. `monochrome` dùng `currentColor`. Favicon `public/icon.svg` cùng hình, đã kiểm ở 16px.
Logo này đã được chốt. Component `Brand` ở `src/components/brand.tsx` (dùng ở trang đăng nhập, học, quản trị) **chưa** đổi sang logo mới.

## Luật trung thực sản phẩm (bắt buộc)

- Không số người dùng, điểm đánh giá, lời chứng thực, logo đối tác.
- Mọi giao diện mô phỏng gắn nhãn **"Ví dụ minh họa"** (`SampleTag`) và chỉ dùng đúng trường dữ liệu thật của sản phẩm.
- Trạng thái chỉ có ba nhãn: **Đã có / Đang mở dần / Sắp ra mắt** (`StatusBadge`).
- Chưa có luyện phát âm/nói. Chưa có luyện nghe Part 1–4. Luyện đọc Part 5–7 mới có một câu Part 5 mẫu.
- Không vẽ số liệu mà sản phẩm không có (ví dụ biểu đồ theo từng ngày: màn Tiến độ thật chỉ có tổng 7 ngày).
- Toàn bộ chữ nằm trong `data/content.ts`, không viết chuỗi dài trong JSX.

## Ngân sách và kiểm tra

- JS thêm cho landing dưới 30 KB gzip (đo lúc làm: 8,6 KB so với `/login`); không video, không WebGL, không thư viện animation.
- Không có nút/liên kết nhỏ hơn 44px trên màn cảm ứng; mọi thành phần tương tác có vòng `:focus-visible`.
- Chạy `npm run test:e2e` (Playwright, Edge) sau mỗi thay đổi giao diện landing: 4 bề rộng 1440/850/600/360, không tràn ngang, không lỗi script, chế độ giảm chuyển động, CTA theo phiên, nhãn "Ví dụ minh họa".
- Dùng đúng cách đo đã dùng: CPU chậm 4 lần chỉ mang tính tương đối (Edge không GPU), đo cả cuộn đều lẫn rê chuột.

## Bẫy đã gặp

- `hidden` bị ghi đè nếu class đặt `display`; cần `.lp-splash[hidden] { display: none }`.
- `.lp-root p { margin: 0 }` từng đè `margin-inline: auto` của `.lp-wrap`; dùng `:where(p)`.
- `Reveal` đổi `transform` của chính nó, đừng đặt `lp-tilt` lên cùng phần tử.
- Thẻ lật cần `key` theo từ để thẻ mới không "bay ngược" từ trạng thái cũ.
- `AccountMenu` rộng: ở màn hẹp đặt trong menu thả xuống, không để trên thanh đầu.
