# Bộ Quy Tắc Thiết Kế & Viết Giao Diện — MasterEnglish Design System

**Phạm vi áp dụng:** Toàn bộ `masterenglish-web` (`marketing`, `auth`, `learning`, `vocabulary`, `toeic`, `admin`) cùng tầng dùng chung (`src/components/`, `src/styles/`, `src/lib/`).  
**Ngăn xếp công nghệ:** Next.js 16.4.6 · React 19.3 · Tailwind CSS v4 (chỉ nạp phần reset `@import "tailwindcss"`, không dùng class tiện ích) · TypeScript · Cloudflare Pages Static Export (`out/`) & Standalone.

> **Nguyên tắc tài liệu:** Mọi token, tên class và tên component nêu trong phần nội dung chính của tài liệu này **phải khớp 100% với mã nguồn hiện có**. Bất kỳ đề xuất bổ sung token hoặc tái cấu trúc nào chưa có trong mã đều được tách riêng ở **Phụ lục A** và chỉ được chuyển lên quy chuẩn chính sau khi code đã merge.

---

## 1. DNA Thẩm Mỹ, Triết Lý & Ma Trận 9 Trang Tham Khảo

### 1.1. Tuyên ngôn Thẩm mỹ: *Japanese Interactive Pastel & Adaptive Glassmorphism*
* **Bản sắc cốt lõi:** *Nhí nhảnh — Kính trong suốt — Cảm hứng anime Nhật nguyên bản — Chuyển động mượt nhưng siêu nhẹ.* Giao diện gợi cảm giác một cuốn sổ học tập trên nền giấy ấm có ánh sáng pastel dịu, giúp người học tiếng Anh mỗi ngày thoải mái, không bị mỏi mắt hay áp lực.
* **Tách bạch giữa Thị giác và Câu chữ:**
  * **Thị giác, linh vật & chuyển động:** Bo tròn lớn, màu pastel tươi sáng, tương tác đàn hồi lò xo (`--spring`), giàu chiều sâu.
  * **Câu chữ & thông tin:** Điềm đạm, gần gũi, rõ ràng, ngắn gọn và trung thực tuyệt đối — không khoa trương.
  * **Khẩu hiệu giữ nguyên:** *"Học có hướng. Tiến bộ có lý do."*

### 1.2. Ma Trận Chắt Lọc Từ 9 Trang Web Tham Khảo
Mọi thiết kế mới trên cả 6 phân hệ phải bám sát cột **MƯỢN** và tránh tuyệt đối cột **TRÁNH**:

| Nguồn tham khảo | Yếu tố BẮT BUỘC MƯỢN | Yếu tố BẮT BUỘC TRÁNH | Hiện thực hóa trong `masterenglish-web` |
| :--- | :--- | :--- | :--- |
| **A1 Gallery** | Thẻ bo tròn lớn (`24px–28px`), nút viên thuốc (`999px`), dải gradient pastel làm điểm nhấn. | Nền tối sâu (`#101211`) làm lệch thương hiệu sáng và gây mỏi mắt khi đọc/luyện tiếng Anh. | `.glass-card`, `.btn-pill`, bảng màu pastel trong `src/styles/base.css`. |
| **Remote** | Tiêu đề display cỡ lớn rõ ràng, gradient pastel mượt, thẻ nền trong mờ. | Dải "đánh giá 4.5 sao", con số người dùng ảo, hàng logo đối tác khi chưa có dữ liệu thật. | Typography `clamp()` ở Hero & Learning; cấm social proof giả. |
| **Tines** | Linh vật nhỏ biểu cảm phủ lên sản phẩm học thuật nghiêm túc; cụm nhấn nghiêng có chân (`<em>`). | Hàng logo doanh nghiệp B2B khô cứng. | `<Mascot />` ở Hero, Auth Stage, màn trống/403; `Lora Italic` cho `<em>`. |
| **details.co.jp** | Thẻ kính nổi có chiều sâu đặt trên nền loang/hình minh họa. | Nền tối `#1e1e1e`, giọng điệu trang trọng lạnh lùng, bố cục đánh đố kiểu triển lãm. | `.glass-card` / `.lp-glass` nổi trên `.app-pastel-bg`; ưu tiên rõ ràng thông tin. |
| **whatever.co** | Giao diện tối giản, thoáng đãng bao quanh hình minh họa/linh vật; nhãn chip viền mảnh. | Hero bằng video nền gây nặng trang và tụt tốc độ tải trên di động. | Khoảng trắng rộng, `<SampleTag />`, `<StatusBadge />`, thẻ CEFR/loại từ. |
| **junni** | Cá tính tinh nghịch ở chi tiết nhỏ; màn mở đầu siêu ngắn (`<= 1.2s`) chỉ chạy lần đầu (`localStorage`), luôn có nút bỏ qua **`SKIP ✳`**. | Màn mở đầu kéo dài chặn nội dung chính gây hại LCP & SEO. | `IntroSplash` mang sẵn `hidden` trong HTML tĩnh; chỉ mở qua JS ở lần đầu. |
| **garden-eight** | Dải chữ khổng lồ trượt ngang theo cuộn (`NGHE · ĐỌC · NHỚ`); con trỏ tròn tùy biến phản hồi mượt trên desktop. | Three.js / WebGL nặng gây hao pin, giật trên điện thoại và hỏng trợ năng. | `WhySection` marquee + `CustomCursor` (chỉ `pointer: fine`, không ẩn con trỏ thật). |
| **forumflashstudy.com** | Ngôn ngữ EdTech Việt hóa gần gũi: nền giấy kem ấm, nhân vật kèm thẻ từ bay lơ lửng, ẩn dụ tiến độ tự nhiên, nút thao tác rõ ràng. | Kho số liệu lớn (`101 bài`, `250 bài`…) khi sản phẩm chưa có số liệu thật tương đương. | Hero Stage, Learning Home, Vocabulary Deck & Flashcard SM-2. |
| **Form & Motion (3D Pastel SaaS)** | Sân khấu Hero có chiều sâu 3D tương tác theo chuột/cuộn kết hợp màu pastel dịu và chuyển động chuyển trạng thái có "hồn". | **Cái bẫy "đầu voi đuôi chuột"**: đầu tư Hero thật đẹp nhưng để các trang nội bộ (`/login`, `/learn`, `/admin`) rời rạc, lệch khoảng cách trên mobile. | Đồng bộ token, chuyển trang mượt và kiểm thử 4 kích thước màn hình trên mọi route. |

> **Quy tắc về yếu tố Anime:** Không trang tham khảo nào là anime thuần túy. Nét anime của MasterEnglish đến từ **Linh vật SVG tách lớp nguyên bản** (`src/components/mascot.tsx`) kết hợp chuyển động lò xo (`--spring`). Không dùng ảnh raster nặng cho linh vật và không mô phỏng nhân vật có bản quyền.

### 1.3. Luật Trung Thực Sản Phẩm (Product Truthfulness — Không Ngoại Lệ)
1. **Không bịa đặt dữ liệu:** Cấm tuyệt đối con số người dùng ảo, điểm đánh giá sao, lời chứng thực giả, logo đối tác chưa có, hay số liệu hệ thống dự phòng giả (khi API chưa tải xong dùng trạng thái tải; khi lỗi hiện thông báo kèm nút thử lại).
2. **Gắn nhãn dữ liệu mẫu:** Mọi khung giao diện mô phỏng trên Landing Page và câu hỏi TOEIC Part 5 mẫu ở `/learn/toeic` **bắt buộc** gắn component `<SampleTag />` (`src/components/sample-tag.tsx` — **`Ví dụ minh họa`**) và chỉ hiển thị đúng các trường dữ liệu có thật trong sản phẩm.
3. **Đúng 3 nhãn trạng thái (`<StatusBadge />` — `src/components/status-badge.tsx`):**
   * `available` (**`Đã có`** — nền `--lime`, chữ `--ink`): Bộ từ vựng, tra từ, sổ tay lưu từ, phát âm từng từ vựng, ôn tập ngắt quãng SM-2 (`Quên / Khó / Đã nhớ`), mục tiêu cá nhân, kết quả học, đăng ký email OTP.
   * `rolling` (**`Đang mở dần`** — nền `--peach`, chữ `--ink`): Luyện đọc TOEIC Part 5 (hiện mới có một câu mẫu).
   * `soon` (**`Sắp ra mắt`** — nền `--lavender`, chữ `--indigo-deep`): Luyện nghe đủ Part 1–4, luyện đọc đủ Part 5–7, ngữ pháp hệ thống, AI Tutor.
4. **Minh bạch giới hạn kỹ năng:** Luôn nêu rõ nền tảng tập trung **Nghe & Đọc** (đúng hai kỹ năng TOEIC L&R) và **chưa có luyện phát âm/nói** (hiện chỉ có audio phát âm mẫu cho từng từ vựng).
5. **Trung thực với hợp đồng API:** Khi `GET /api/v1/vocabulary/progress` chỉ trả tổng `reviewsLast7Days`, chỉ hiển thị con số tổng hợp — tuyệt đối không vẽ biểu đồ 7 cột giả lập theo từng ngày trên `/learn/results`.

---

## 2. Hệ Thống Token Hiện Hành (`src/styles/base.css`)

Mọi màu sắc thương hiệu, nền kính và đường cong chuyển động **phải dùng các biến đang định nghĩa tại `:root` trong `src/styles/base.css`** (không tự đặt mã hex mới khi đã có biến tương ứng, và không viện dẫn tên biến chưa được khai báo trong `base.css`).

### 2.1. Bảng Token Màu Sắc Hiện Có
| Nhóm | Token CSS | Giá trị | Vai trò chuẩn |
| :--- | :--- | :--- | :--- |
| **Nền & Chữ** | `--paper` | `#f7f7f2` | Nền giấy ấm chủ đạo của toàn ứng dụng. |
| | `--ink` | `#20223b` | Màu chữ chính, tiêu đề, nhãn biểu mẫu, icon chính. |
| | `--text-muted` | `#565a72` | **Màu chữ phụ chuẩn trên nền kính** (đạt tương phản `>= 4.5:1`). |
| | `--muted` | `#6c7084` | Chỉ dùng cho chữ lớn (`>= 18px` đậm) hoặc placeholder trên nền đặc; không dùng cho nhãn nhỏ trên nền kính mờ. |
| | `--line` | `#dfe1e0` | Đường kẻ chia mảnh, viền tĩnh. |
| **Thương hiệu** | `--indigo` | `#5a54e8` | Màu nhấn chính (Primary CTA, trạng thái active, liên kết trọng tâm, vòng `:focus-visible`). |
| | `--indigo-deep` | `#3933a8` | Kicker/eyebrow, nhãn `SampleTag`, chữ màu tím đậm trên nền pastel nhạt. |
| | `--lime` | `#d9f586` | Ngôi sao `✳`, badge `Đã có`, điểm nhấn CEFR, nút `Đã nhớ`, `::selection`. |
| **Pastel Nền** | `--lavender` | `#dedbfd` | Loang nền trên-trái, thẻ phụ, badge `Sắp ra mắt`, nút `Khó`. |
| | `--mint` | `#c7f2dc` | Loang nền phải, trạng thái tích cực dịu, lối tắt Từ vựng. |
| | `--peach` | `#ffe1cb` | Loang nền dưới-trái, badge `Đang mở dần`, nút `Quên`. |
| **Cảnh báo** | `--danger` | `#c0392b` | Chữ/viền lỗi, trạng thái khóa, nút nguy hiểm mềm. |
| | `--danger-soft` | `#ffe3df` | Nền lỗi dịu và nền của `.btn-danger-soft`. |
| **Kính & Motion** | `--glass-line` | viền sáng kính | Viền mảnh của `.glass-card` trên desktop. |
| | `--glass-shadow` | đổ bóng mềm | Đổ bóng đa lớp cho thẻ kính nổi. |
| | `--spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Nút bấm nảy, trượt `.slide-indicator`, lật thẻ 3D. |
| | `--ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Trượt `RouteTransition`, mở modal/accordion. |
| **Nhấn bổ sung** | `--indigo-hover` | `#4b45d6` | Hover của nút chính. |
| | `--indigo-soft` | `#9b95ff` | Đầu sáng của thanh tiến độ gradient, chữ tím nhạt trên nền tối. |
| | `--indigo-glow` | `rgba(90, 84, 232, 0.8)` | Màu bóng đổ dưới nút chính và khối `.slide-indicator`. |
| | `--indigo-wash` | `rgba(90, 84, 232, 0.14)` | Vòng focus của ô nhập, nền tím rất nhạt. |
| | `--lavender-line` / `--lavender-wash` | `#d6d1fb` / `#efedff` | Viền và nền oải hương nhạt trong thẻ từ vựng, thẻ lật. |
| | `--success` | `#277054` | Chữ trạng thái đạt (hoạt động, đã duyệt). |
| | `--border-subtle` | `rgba(32, 34, 59, 0.14)` | Viền ô nhập, nút ghost, đường kẻ bảng trên nền kính. |
| **Nền kính** | `--glass-bg` / `--glass-bg-strong` / `--glass-bg-solid` | `rgba(255,255,255, 0.75 / 0.85 / 0.9)` | Ba độ đục nền trắng cho thẻ phụ, ô nhập và vùng đặc ở màn hẹp. |

### 2.2. Quy Tắc Tương Phản WCAG AA (Bắt Buộc)
* **Trên nền `--lime` (`#d9f586`), `--mint` (`#c7f2dc`), `--peach` (`#ffe1cb`), `--lavender` (`#dedbfd`):** Bắt buộc dùng chữ `--ink` (`#20223b`) hoặc `--indigo-deep` (`#3933a8`). **Cấm tuyệt đối chữ trắng trên nền `--lime` hoặc pastel nhạt.**
* **Trên nền `--indigo` (`#5a54e8`):** Luôn dùng chữ trắng `#ffffff`.
* **Trên nền kính bán trong suốt:** Luôn dùng `--text-muted` (`#565a72`) cho mô tả và metadata; cấm dùng màu xám nhạt như `#777` hoặc `#888`.

### 2.3. Hình Học, Thời Lượng & Thứ Tự Lớp
*Quy tắc chung: giá trị nào lặp từ 3 lần trở lên phải là token; giá trị dùng một hai lần (bo `12px`–`14px` của ô nhập, màu một lần) được viết trực tiếp. Tránh thêm token chỉ dùng một chỗ.*
* **Bo góc (token trong `base.css`):** `--radius-xl` `28px` (thẻ kính lớn, modal, sidebar, banner), `--radius-lg` `24px`, `--radius-md` `20px` (thẻ con, thẻ từ vựng, khay tab), `--radius-sm` `16px` (ô nhập, phương án trắc nghiệm), `--radius-pill` `999px` (nút, badge, chip, thanh trượt). Dưới `16px` viết trực tiếp.
* **Thời lượng:** `--dur-fast` `0.2s` (hover, nút), `--dur-base` `0.3s` (đổi màu, mở/đóng nhỏ). `RouteTransition` chạy `0.26s` và `.slide-indicator` `0.42s` (viết trực tiếp trong `ui.css`).
* **Thứ tự `z-index`:** `--z-sticky` `30` (topbar), `--z-splash` `9999` (`IntroSplash`), `--z-cursor` `10000` (`CustomCursor`); các số khác hiện viết trực tiếp. Chi tiết thứ tự: Nền `.app-pastel-bg::before` ở `-1`; nội dung thường ở `1`; thanh sticky/topbar ở tầng thấp (`10–40`); dropdown như `AccountMenu` cao hơn topbar; `<dialog>` nằm trên top layer gốc của trình duyệt; `IntroSplash` và `CustomCursor` ở tầng trên cùng chỉ trên Landing.

---

## 3. Hệ Thống Kiểu Chữ Tiếng Việt & Phiên Âm IPA

### 3.1. Cấu Hình Tập Trung (`src/lib/fonts.ts` & `src/app/layout.tsx`)
* Phông chữ được nạp **một lần duy nhất** tại `src/lib/fonts.ts` và gắn vào `<html>` trong `src/app/layout.tsx` cho toàn bộ 6 phân hệ. Không khai báo lại phông riêng trong feature.
* **Bắt buộc** tải đủ hai subset `["vietnamese", "latin"]` (vì subset `vietnamese` chỉ chứa phần dấu).
  * **Phông chính (`--font-sans`):** **Nunito** (`500`, `600`, `700`, `800`, `900`).
  * **Phông nhấn (`--font-serif`):** **Lora Italic** (`600`), chỉ dùng cho thẻ `<em>` bên trong tiêu đề lớn. **Cấm dùng Georgia nghiêng** vì làm vỡ dấu tiếng Việt (`ế`, `ộ`, `ậ`).
* **Phiên âm IPA (`.ipa-text`):** Bắt buộc dùng `"Segoe UI", "Noto Sans", "DejaVu Sans", Arial, sans-serif` vì `Nunito` thiếu ký tự ngữ âm quốc tế (`/ˈʃedʒuːl/`).

### 3.2. Luật Hiển Thị Tiếng Việt & Số Liệu
* Tiêu đề lớn (`<h1>`): Dùng `clamp()`, `line-height >= 1.15`, `text-wrap: balance`, **cấm `-webkit-text-stroke`** trên Nunito và cấm `line-height: 1.0` để tránh cắt dấu tiếng Việt hoa. Mỗi trang chỉ có **duy nhất 1 thẻ `<h1>`**.
* Văn bản nội dung: `15px–16px`, `line-height: 1.6`, đoạn đọc dài giới hạn khoảng `65ch`.
* Ô nhập liệu (`input`, `select`, `textarea`) trên màn hình nhỏ (`<= 600px`): bắt buộc `font-size >= 16px` để iOS Safari không tự phóng to khi focus.
* Số liệu thay đổi động (đồng hồ OTP, điểm TOEIC, số thẻ, KPI): luôn bật `font-variant-numeric: tabular-nums`.

---

## 4. Nền Pastel & Bề Mặt Kính Thích Ứng

### 4.1. Nền Ứng Dụng (`.app-pastel-bg`)
* Nền giấy `--paper` (`#f7f7f2`) kết hợp lớp giả `::before` cố định (`position: fixed; inset: 0; z-index: -1; pointer-events: none;`) phủ 3 vòng `radial-gradient` loang từ `--lavender`, `--mint`, `--peach` để trình duyệt không vẽ lại khi cuộn.
* Landing Page và Auth dùng độ phủ pastel nổi bật hơn; khu vực học tập (`/learn/*`) và quản trị (`/admin/*`) giữ sắc độ dịu hơn để ưu tiên sự tập trung khi đọc và thao tác bảng dữ liệu.

### 4.2. Quy Tắc Thẻ Kính Thích Ứng (`.glass-card` trong `src/styles/ui.css` & `.lp-glass` trong `marketing.css`)
* **Mobile (`< 768px`):**
  * Dùng nền bán trong suốt độ đục cao (`rgba(255, 255, 255, 0.9)`), bo góc `24px`, viền rõ.
  * **Tắt hoàn toàn `backdrop-filter`** để giữ 60fps và tiết kiệm pin trên điện thoại tầm trung/yếu.
* **Desktop (`>= 768px`):**
  * Dùng nền trong mờ (`rgba(255, 255, 255, 0.62)` cho ứng dụng, `0.55` cho thẻ Hero landing), bo góc `28px`, viền `1px solid var(--glass-line)`, `backdrop-filter: blur(12px) saturate(1.2)`, đổ bóng `var(--glass-shadow)`.
* **Bảng dữ liệu mật độ cao (Admin & Danh sách từ dài):** Dùng thẻ kính với độ đục nền cao hơn ở vùng bảng (`rgba(255, 255, 255, 0.82–0.88)`) ngay trong CSS của bảng để giữ chữ nhiều cột sắc nét (không cần tạo class mới nếu `.glass-card` + lớp cục bộ đã đủ).

---

## 5. Nhận Diện Thương Hiệu & Linh Vật SVG Tách Lớp (`src/components/`)

### 5.1. Logo `masterenglish` (`src/components/brand.tsx`)
* Toàn bộ 6 phân hệ dùng chung `BrandMark`, `BrandLogo`, `Brand` từ `src/components/brand.tsx` (Phương án A: chữ `m` bong bóng thoại kèm ngôi sao 4 cánh `✳`, chữ `master` màu `--ink` và `english` màu `--indigo` viết thường liền nhau).
* Hỗ trợ biến thể đơn sắc (`monochrome`), đọc rõ ở `16×16px` (`public/icon.svg`), và gắn badge `ADMIN` nhỏ bên cạnh trong cổng quản trị. Cấm dùng lại logo hộp vuông cũ.

### 5.2. Linh Vật SVG Tách Lớp (`src/components/mascot.tsx` & `src/styles/identity.css`)
* **Bám vào `data-*`, không bám `id`:** Toàn bộ animation trong `identity.css` và `usePageMotion` phải chọn qua thuộc tính `data-part`, `data-hand`, `data-ear`, `data-mouth`, `data-extra` để sau này có thể thay ruột vector vẽ đẹp hơn (từ Figma + SVGOMG) mà không đổi mã điều khiển.
* **Chống trùng ID DOM:** Khi một trang hiển thị từ 2 linh vật trở lên, **bắt buộc** truyền `idSuffix` duy nhất cho từng `<Mascot />`.
* **4 biểu cảm chuẩn theo ngữ cảnh:**
  * `happy`: Hero Landing, Đăng nhập (`/login`), Banner `/learn`, trạng thái chờ tải `.page-loading`.
  * `celebrating`: Đăng ký (`/register`), hoàn thành lượt ôn Flashcard SM-2, Kêu gọi cuối Landing Page.
  * `thinking`: Quên mật khẩu (`/forgot-password`), Dành cho ai, AI Tutor xem trước, trạng thái rỗng/không có kết quả, màn 403 (`RequireAdmin`) & lỗi mạng.
  * `sleepy`: Khối "Đang xây dựng / Sắp ra mắt", trạng thái đã hết thẻ đến hạn ôn hôm nay ở `/learn/review`.

---

## 6. Hệ Thống Chuyển Động, Sân Khấu 3D & Chuyển Trang Mượt

### 6.1. Nguyên Tắc Hiệu Năng & Trợ Năng Bắt Buộc
1. **Chỉ animate trên thuộc tính GPU:** Chỉ dùng `transform`, `translate`, `opacity`. **Cấm `transition: all`** — luôn liệt kê cụ thể các thuộc tính cần chuyển đổi (`transform`, `opacity`, `background-color`, `border-color`, `box-shadow`).
2. **Zero-Re-render cho chuyển động liên tục:** Cấm lưu tọa độ chuột hay vị trí cuộn vào `useState`. Cập nhật trực tiếp biến CSS (`--mx`, `--my`, `--sp`) qua một vòng `requestAnimationFrame` duy nhất trong `usePageMotion`, chỉ ghi lên các phần tử gắn `data-motion="pointer|scroll|both"`.
3. **Tạm dừng thông minh:**
   * Tự dừng `requestAnimationFrame` khi `document.hidden` hoặc khi nội suy đã hội tụ.
   * Mọi khối chứa hoạt ảnh lặp vô hạn phải gắn `data-pause` để `IntersectionObserver` gán `.is-offscreen` tạm dừng CPU khi ra ngoài khung nhìn.
4. **Ngân sách hiệu năng:** Không cài thư viện animation ngoài (Framer Motion, GSAP, Three.js). JS chuyển động Landing `< 30 KB` gzip, tổng ảnh `< 300 KB`, không video nền, không WebGL.
5. **Chế độ giảm chuyển động (`@media (prefers-reduced-motion: reduce)`):**
   * Tắt 100% animation lặp, parallax, nghiêng/lật 3D, `SparkleCanvas`, `IntroSplash`, `CustomCursor`, và `lp-confetti`.
   * Đặt thời lượng chuyển đổi của `.slide-indicator` và `RouteTransition` về `0s`/`none`.

### 6.2. Kiến Trúc Chuyển Trang & Thanh Trượt Mượt (Persistent Shell)
1. **Giữ Shell không bị unmount:** Các route chia sẻ cùng thanh điều hướng bắt buộc nằm chung một `layout.tsx`:
   * `src/app/(auth)/layout.tsx` (dùng chung cho `/login`, `/register`, `/forgot-password`).
   * `src/app/learn/layout.tsx` (`LearningShell`).
   * `src/app/admin/layout.tsx` (`AdminLayoutShell`).
2. **Thanh chỉ báo trượt (`src/lib/use-sliding-indicator.ts`):**
   * Dùng `<span className="slide-indicator" aria-hidden="true" />` làm con trực tiếp của container `position: relative`.
   * Giữ nền tĩnh dự phòng trên mục active cho tới khi container nhận `data-slide="on"`.
   * Lần đo đầu tiên **không chạy transition** (`0s`), chỉ bật `data-slide-ready="true"` sau khung hình đầu tiên. Không tắt transition bên trong `ResizeObserver`.
   * Khi route hiện tại không khớp mục nào (ví dụ `/forgot-password` đối với thanh tab `Đăng nhập / Tạo tài khoản`), ẩn chỉ báo mượt tại chỗ bằng `opacity: 0`.
3. **Trượt nội dung theo hướng (`src/components/route-transition.tsx`):**
   * Truyền `transitionKey`, `order: number`, và `axis` (`"x"` cho tab ngang Auth/Từ vựng; `"y"` cho sidebar dọc Learning/Admin).
   * Animation một chiều trên một cây DOM duy nhất (`key={transitionKey}`) để không trùng `id` input/label. Phần tử cha của vùng trượt ngang tự nhận `overflow-x: clip` qua `:has(> .route-transition[data-axis="x"])` trong `ui.css` (không dùng `overflow: hidden` để không làm hỏng `position: sticky`; kiểm thử e2e đo độ tràn ngang ở 360px giữa lúc chuyển).

---

## 7. Quy Chuẩn Component Tương Tác & Trạng Thái

### 7.1. Hệ Thống Nút Bấm Chuẩn (`src/styles/ui.css`)
`.btn-pill` là gốc chung; mã hiện dùng trực tiếp một biến thể (đã mang sẵn kiểu gốc) cho mọi nút mới. Chọn đúng một biến thể:
* **`.btn-primary`:** Nền `--indigo`, chữ trắng `#fff`, nảy `--spring` — tối đa **1 nút chính** trong mỗi khung nhìn.
* **`.btn-lime`:** Nền `--lime`, chữ `--ink` — dùng cho điểm nhấn khích lệ (banner Spotlight `/learn`, trạng thái `Đã nhớ`).
* **`.btn-ghost`:** Nền sáng/trong suốt, viền mảnh, chữ `--ink` — hành động phụ (`Xem cách học`, `Hủy`, `Đóng`).
* **`.btn-danger-soft`:** Nền `--danger-soft`, chữ `--danger` — thao tác nhạy cảm (`Đăng xuất`, `Khóa tài khoản`, `Thu hồi phiên`, `Từ chối`).
* **Quy tắc chuyển đổi từ lớp cũ:** Không viết thêm `.button`, `.button-dark`, `.button-light`, `.button-lime` ở bất kỳ màn hình mới nào; các vị trí cũ còn sót (nút gửi của form auth, `RequireAuth`, form mục tiêu ở `/learn/account`, `PronunciationPlayer`) sẽ được thay sang biến thể mới trong một PR riêng (xem Phụ lục A).
* **Vùng chạm & Chống bấm đúp:** Mọi nút/tab/link trên thiết bị cảm ứng (`@media (pointer: coarse)`) phải đạt tối thiểu `44×44px`; khóa sự kiện khi `isSubmitting` và giữ ổn định chiều rộng nút.

### 7.2. Biểu Mẫu & Hộp Thoại
* **Khu vực Auth (`src/features/auth/`):** Tiếp tục sử dụng component `AuthField` và class `.auth-field` hiện có (đang dùng đồng nhất trên toàn bộ luồng Đăng nhập, Đăng ký, Quên mật khẩu, OTP và Cài đặt tài khoản) — đảm bảo nhất quán về `aria-invalid`, `aria-describedby`, lỗi trường ngay dưới input, hộp lỗi tổng quát có `role="alert"`, và tự động focus về trường lỗi đầu tiên.
* **Khu vực ngoài Auth (`learning`, `vocabulary`, `admin`):** Sử dụng các class trường biểu mẫu sẵn có trong `src/styles/ui.css` hoặc CSS của đúng feature đó; không tạo hệ input thứ ba hoặc viết inline style tĩnh.
* **Hộp thoại (`src/components/dialog.tsx` & `src/styles/dialog.css`):** Luôn dùng `<Dialog>` dựng trên phần tử `<dialog>` gốc (bo `28px`, mở `--spring`, đóng bằng `Esc` trừ khi `busy`, chặn đóng nhầm khi kéo bôi đen từ trong ra backdrop, tự trả focus về nút kích hoạt qua `useFocusReturn`). Cấm `window.alert()`, `confirm()`, `prompt()`.

### 7.3. Trạng Thái Chờ Tải, Rỗng & Lỗi
* **Dùng các thành phần chung trong `src/components/`, không tự viết lại:** `EmptyState` (linh vật hoặc biểu tượng, tiêu đề, một câu mô tả, một hành động), `ErrorState` (`variant="page"` thẻ kính có linh vật cho lỗi tải cả vùng; `variant="inline"` dải báo lỗi gọn cho thao tác nhỏ; luôn có `role="alert"` và nút thử lại), `Skeleton` (`line`, `line-lg`, `line-sm`, `card`; shimmer tắt khi giảm chuyển động) và `Pagination` (đánh số trang từ 1, ẩn khi chỉ có một trang trừ khi có `summary`; adapter 0-index nằm ở nơi gọi).
* Admin dùng thêm `AdminFilterBar` (ô tìm kiếm cùng vùng bộ lọc) cho các bảng.
* **Cấm inline `style={{...}}` cho kiểu tĩnh** (như màu chữ, padding cố định). Chỉ dùng `style={{...}}` cho giá trị tính động từ dữ liệu (tỷ lệ `%` thanh đo, độ trễ pháo giấy).
* **Trạng thái chờ tải trang / `<Suspense fallback>`:** Dùng `.page-loading` kèm `<Mascot expression="happy" className="page-loading-mascot" />`.
* **Trạng thái rỗng:** Dùng `.glass-card.empty-page` kèm `<Mascot expression="thinking" | "sleepy" className="empty-page-mascot" />`, tiêu đề ngắn, giải thích 1 câu và 1 nút hành động.
* **Trạng thái lỗi tải dữ liệu:** Hiển thị thẻ kính báo lỗi thân thiện kèm nút **`Thử lại`**. Tuyệt đối không hiển thị form rỗng đè lên lỗi `GET` (tránh người dùng lưu nhầm ghi đè dữ liệu cũ, đặc biệt ở `GoalCard`).

### 7.4. Bàn Phím & Phím Tắt
* Giữ rõ vòng `:focus-visible` (`outline: 3px solid var(--indigo); outline-offset: 4px`) trên mọi phần tử tương tác.
* Tại khu ôn tập Flashcard (`FlashcardView` và `FlipCardDemo`), duy trì nhất quán phím tắt `Space` (lật thẻ), `1` (`Quên`), `2` (`Khó`), `3` (`Đã nhớ`), `ArrowRight` (xem tiếp ở chế độ preview); chỉ hiển thị nhãn phím gợi ý trên thiết bị có chuột/bàn phím (`@media (hover: hover)`).

---

## 8. Đặc Tả Thiết Kế & Nghiệp Vụ Theo 6 Phân Hệ

1. **Marketing (`/` — `src/features/marketing/`):**
   * Giữ đủ 10 khối: Navbar → Hero (Sân khấu 3D CSS + `SparkleCanvas`) → Vì sao Nghe & Đọc (dải chữ `NGHE · ĐỌC · NHỚ` trượt ngang) → Dành cho ai (`TiltGlassCard`) → Cách học (3 bước + `FlipCardDemo`) → Tính năng (4 mô phỏng UI thật gắn `<SampleTag />`) → Đang xây dựng (`sleepy` + `<StatusBadge status="soon" />`) → Hỏi đáp Accordion → Kêu gọi cuối (`celebrating` + pháo giấy CSS) → Chân trang (không link chết).
   * CTA chính thống nhất toàn trang: **`Bắt đầu miễn phí`** → `/register` (hoặc **`Vào không gian học`** → `/learn` khi client phát hiện đã đăng nhập).
2. **Auth & Tài khoản (`/login`, `/register`, `/forgot-password`, `/learn/account` — `src/features/auth/`):**
   * Khung 2 cột trong `src/app/(auth)/layout.tsx`; `AuthStage` giữ nguyên trên DOM và đổi biểu cảm linh vật theo route; form bọc `RouteTransition axis="x"`.
   * Bảo toàn tuyệt đối CSRF bootstrap (`XSRF-TOKEN`), `credentials: "same-origin"`, `cache: "no-store"`, `navigator.locks` khi refresh, không lưu token/mật khẩu/OTP vào storage, mật khẩu chuẩn hóa NFC (`15` ký tự Unicode – `72` byte UTF-8) chỉ kiểm bằng `checkPassword` trong `lib/password-rules.ts` và hiển thị bằng `PasswordChecklist` ở đăng ký, quên mật khẩu và đổi mật khẩu, đếm ngược `Retry-After` 429, và lọc `?redirect=...` qua `getSafeRedirectUrl`.
   * `AccountMenu`: nút kích hoạt + dropdown `.glass-card`, hỗ trợ `Enter`/`Esc` và trả focus về nút mở.
3. **Learning (`/learn`, `/learn/grammar`, `/learn/ai-tutor` — `src/features/learning/`):**
   * `LearningShell`: sidebar kính cố định bên trái trên desktop (7 mục có `.slide-indicator` trượt dọc) + thanh pill cuộn ngang trên mobile (`.slide-indicator` trượt ngang).
   * `GoalCard` & `GoalEditModal`: tách bạch 4 trạng thái (`isLoading`, `loadError`, `goal === null`, `goal !== null`), bước điểm `5` (`10–990`), `5–240` phút/ngày, tính ngày theo giờ địa phương `toLocalIsoDate`.
   * `GrammarPreview` & `AiTutorPreview`: gắn rõ `<StatusBadge status="soon" />` / `<SampleTag />`.
4. **Vocabulary, Review & Results (`/learn/vocabulary`, `/learn/review`, `/learn/results` — `src/features/vocabulary/`):**
   * 3 tab trượt ngang (`Bộ từ`, `Tra từ`, `Từ đã lưu`) đồng bộ `?view=...` và `?deck=...`; thẻ từ hiện đủ từ vựng, `.ipa-text`, CEFR, loại từ, nghĩa tiếng Việt, `PronunciationPlayer` (khóa `currentAudio` chống phát chồng, hỗ trợ `1x`/`0.8x`), `WordSaveButton`.
   * Flashcard 3D hai mặt cố định trong DOM (`key={wordSenseId}`), giữ nguyên cơ chế lũy đẳng SM-2 (`pendingRequest` giữ `reviewRequestId` khi lỗi mạng/`5xx`, không ép reload khi `429`, chế độ `previewOnly`).
   * `ProgressView`: hiển thị đúng 6 chỉ số từ API + lịch sử ôn tập phân trang.
5. **TOEIC (`/learn/toeic` — `src/features/toeic/`):**
   * Khối giới thiệu 2 phần Listening (`Sắp ra mắt`) & Reading (Part 5 `Đang mở dần`, Part 6–7 `Sắp ra mắt`) + câu Part 5 mẫu gắn `<SampleTag />`.
6. **Admin Portal (`/admin/*` — `src/features/admin/`):**
   * Đồng bộ nền `.app-pastel-bg`, `.glass-card`, `BrandLogo` + badge `ADMIN`, thanh trượt trên cả `AdminSidebar` và `AdminMobileNav`.
   * **RBAC UI đồng bộ:** Cả `AdminSidebar` lẫn `AdminMobileNav` phải cùng lọc danh mục theo `SYSTEM_ADMIN` (ẩn `/admin/users` và `/admin/system` với `CONTENT_ADMIN`).
   * Màn 403 (`RequireAdmin` / `RequireSystemAdmin`) trên `.glass-card` kèm `<Mascot expression="thinking" />`.
   * Mọi hook tìm kiếm/lọc bất đồng bộ (`useAdminUsers`, `useAdminContent`, `useAdminSystem`) dùng `createLatestRequestTracker()`, reset `page` về `1` khi đổi bộ lọc, và chuyển đổi đúng phân trang UI 1-indexed ↔ Spring 0-indexed.

---

## 9. Kiến Trúc CSS Thực Tế, Ranh Giới ESLint & Responsive

### 9.1. Quy Ước CSS Theo Đúng Cấu Trúc Hiện Tại Của Dự Án
1. **Tầng dùng chung (`src/styles/`):**
   * `base.css`: Token `:root`, typography gốc, `.app-pastel-bg`, `.ipa-text`, quy tắc `prefers-reduced-motion`.
   * `ui.css`: `.glass-card`, hệ nút `.btn-*`, `.slide-indicator`, `.route-transition`, `.page-loading`, `.empty-page`, `.error-state`, `.skeleton`, `.pager`.
   * `identity.css`: Animation cho `BrandLogo` và `Mascot` bám theo `data-part`/`data-hand`/`data-ear`/`data-mouth`/`data-extra`.
   * `dialog.css`: Kiểu hiển thị và chuyển động của `<Dialog>`.
2. **Tầng feature (`src/features/<tên>/`):** Tuân thủ đúng quy ước đang dùng của từng feature khi chỉnh sửa hoặc bổ sung:
   * `marketing/styles/marketing.css` → dùng tiền tố `lp-*`.
   * `auth/styles/auth.css` & `account-menu.css` → dùng tiền tố `auth-*` (bao gồm `.auth-field`).
   * `admin/styles/admin.css` → dùng tiền tố `admin-*`.
   * `learning/styles/learning.css` → dùng các lớp ngữ nghĩa hiện có (`.learning-*`, `.goal-*`, v.v.).
   * `vocabulary/components/vocabulary.module.css` & `pronunciation-player.module.css` (CSS Modules cô lập cục bộ) + `vocabulary/styles/vocabulary.css`.
   * `toeic/styles/toeic.css` → dùng các lớp hiện có của khu TOEIC.
   * **Nguyên tắc chung cho tầng feature:** Không định nghĩa lại `.glass-card`, hệ nút `.btn-*`, màu thương hiệu hay `<Dialog>` đã có ở `src/styles/`.

### 9.2. Ranh Giới ESLint & Độ Gọn Tệp
* **Luồng phụ thuộc một chiều (`eslint.config.mjs`):** `src/app/` → `src/features/<tên>/index.ts` → `src/components/` & `src/lib/`. Cấm import chéo feature (ngoại lệ duy nhất: được phép import `@/features/auth` qua `index.ts`). `src/components/` và `src/lib/` tuyệt đối không import `features/` hay `app/`.
* **Giới hạn độ dài (`max-lines: 350`):** Không vượt 350 dòng code (trừ test và types). Giữ mục tiêu dưới 300 dòng bằng cách tách sub-component, hook và client theo trách nhiệm.
* **Tương thích `node --test` & Static Export:** Các tệp trong `src/lib/*.ts` và `src/features/*/lib/*.ts` (cùng `.test.ts`) dùng đường dẫn tương đối có đuôi `.ts`. Mọi component gọi `useSearchParams()` phải nằm trong `<Suspense>`.

### 9.3. 4 Mốc Responsive Bắt Buộc Kiểm Thử
* **`1440px` (Desktop):** Đầy đủ kính mờ `backdrop-filter`, bố cục 2 cột (Hero, Auth, Learn Sidebar, Admin Sidebar), hover & `CustomCursor` trên Landing.
* **`850px` (Tablet ngang):** Cân đối padding và kích thước chữ, không chèn ép thanh điều hướng.
* **`600px` (Tablet dọc / Điện thoại lớn):** Chuyển sang 1 cột gọn gàng, input `>= 16px`, tắt `backdrop-filter`.
* **`360px` (Điện thoại nhỏ gọn):** Tuyệt đối không tràn ngang (`document.documentElement.scrollWidth <= window.innerWidth`), tiếng Việt ngắt dòng không cắt dấu, vùng chạm `>= 44×44px`, bảng quản trị cuộn ngang độc lập trong vùng chứa.

---

## 10. Checklist Nghiệm Thu Trước Khi Merge PR

- [ ] Trạng thái tải, rỗng, lỗi và phân trang dùng `Skeleton`, `EmptyState`, `ErrorState`, `Pagination` chung.
- [ ] Tuân thủ đúng Ma trận 9 trang tham khảo (không nền tối sâu, không video/WebGL nặng, không số liệu/đánh giá giả).
- [ ] Màu thương hiệu, nền kính, bo góc và easing dùng đúng biến hiện có trong `src/styles/base.css`; giá trị mới lặp từ 3 lần trở lên thì thêm token.
- [ ] Nút mới dùng một biến thể `.btn-primary | .btn-lime | .btn-ghost | .btn-danger-soft`; không thêm `.button-dark` / `.button-light` cũ; không dùng inline `style={{...}}` cho kiểu tĩnh.
- [ ] Độ tương phản chữ trên nền kính (`--text-muted`) và nền `--lime` (`--ink`) đạt chuẩn WCAG AA (`>= 4.5:1`).
- [ ] Mobile `< 768px` tắt `backdrop-filter`, input `>= 16px`, vùng chạm `>= 44×44px`.
- [ ] Gắn đủ `<SampleTag />` và `<StatusBadge />` cho mọi phần mẫu/sắp ra mắt; đồng bộ RBAC giữa desktop và mobile ở Admin.
- [ ] Không có `transition: all`; chỉ animate `transform`, `translate`, `opacity`; tắt hoàn toàn chuyển động khi bật `prefers-reduced-motion: reduce`.
- [ ] Mọi tệp dưới 350 dòng, không vi phạm ESLint boundary, pass đầy đủ 5 lệnh:
  ~~~bash
  npm exec -- tsc --noEmit
  npm run lint
  npm test
  npm run build:pages
  npm run test:e2e
  ~~~
- [ ] Đã chụp so sánh 4 bề rộng khi sửa CSS dùng chung, và có test cho logic mới (hook, validator) hoặc e2e cho luồng mới.

---

## 11. Bẫy Đã Gặp & Cách Đo

* `hidden` bị ghi đè nếu class đặt `display`; cần `.lp-splash[hidden] { display: none }`.
* `.lp-root p { margin: 0 }` từng đè `margin-inline: auto` của `.lp-wrap`; dùng `:where(p)`.
* Không tắt transition của khối trượt trong `ResizeObserver`: đổi trang có thể làm thanh cuộn xuất hiện và kích hoạt lần đo giữa lúc đang trượt, khối sẽ nhảy thẳng.
* `Reveal` đổi `transform` của chính nó, không đặt `lp-tilt` lên cùng phần tử.
* Thẻ lật cần `key` theo từ để thẻ mới không "bay ngược" từ trạng thái cũ.
* Ô đang `disabled` (đang gửi) không nhận `focus()`; muốn trả con trỏ về ô OTP sau khi nhập sai phải focus sau khi trạng thái gửi kết thúc.
* Nội dung trượt ngang vào làm trang rộng thêm vài px trong lúc chạy nếu cha không clip (đã bắt được ở tab từ vựng 360px).
* Ở chế độ dev React chạy hiệu ứng hai lần, nên test e2e không được đếm số lần gọi API; dùng cờ bật/tắt lỗi.
* Hoạt ảnh vô hạn đắt: giữ ít; hạt nhỏ nhấp nháy vẽ trong canvas, không bằng CSS.
* Ngân sách đã đo: JS thêm cho landing 8,6 KB gzip so với `/login`; giới hạn 30 KB. CPU chậm 4 lần trong Edge (không GPU) chỉ mang tính tương đối; đo cả cuộn đều lẫn rê chuột.
* Toàn bộ chữ landing nằm trong `data/content.ts`, không viết chuỗi dài trong JSX.

---
4. **Dọn inline style fallback tĩnh:** Thay inline style `#777` ở `src/app/learn/review/page.tsx` sang `.page-loading` + `<Mascot />`.

---

## Phụ Lục A: Hạng Mục Chuẩn Hóa Đề Xuất *(Chưa Có Trong Mã Nguồn — Không Giả Định Đã Tồn Tại)*

Các mục dưới đây là nợ kỹ thuật/mở rộng có thể thực hiện trong các PR dọn dẹp riêng; chỉ cập nhật lên mục 2–9 sau khi đã được triển khai thực tế:
1. **Màu viết cứng còn lại:** Token đã được thêm cho các giá trị lặp (mục 2.1, 2.3). Còn khoảng 135 mã hex và 125 `rgba()` dùng một hai lần (nhiều nhất ở `auth.css`, `vocabulary.module.css`, `marketing.css`); `--warning`, `--success-soft` chưa có vì chưa có giá trị lặp. Hai đỏ `--danger` (`#c0392b`) và `#dc2626` cùng tồn tại, cần thống nhất.
2. **Dọn sạch lớp nút cũ `.button-*`:** Còn 11 vị trí dùng `.button button-dark` / `.button-light` (nút gửi form auth, `RequireAuth`, `account-goal-form`, `PronunciationPlayer`). Chuyển sang `.btn-primary`/`.btn-ghost` rồi xóa quy tắc `.button*` trong `src/styles/ui.css`.
3. **Tailwind chỉ làm reset:** Chưa đo dung lượng CSS do Tailwind sinh ra. Nếu chỉ là preflight, cân nhắc thay bằng reset riêng và gỡ `tailwindcss`, `@tailwindcss/postcss`, `@tailwindcss/turbopack`.
4. **Hai nơi còn đếm lùi trùng ý:** các hook `use-login-form`, `use-register-form`, `use-forgot-password-form` cùng lặp mẫu `syncNow() + retryAfterSeconds` khi bị giới hạn tần suất; có thể gom thành một hook nhỏ.
5. **Hook chưa có test:** `use-register-form`, `use-forgot-password-form`, `use-admin-content`, `use-admin-system` (phần thuần của đăng ký đã có test ở `lib/form-validation.ts` và `lib/password-rules.ts`).
