# Kế hoạch thiết kế và triển khai đăng nhập MasterEnglish

**Ngày:** 29/10/2026  
**Phạm vi:** `/login` và các thành phần dùng chung của khu vực tài khoản.  
**Mục tiêu:** Tạo màn hình đăng nhập rõ ràng, đẹp trên máy tính và điện thoại, có đầy đủ trạng thái tương tác; sau đó kết nối phiên đăng nhập thật theo thiết kế bảo mật của dự án.

## 1. Hiện trạng và căn cứ

- Web đã có `/dang-nhap`, `/dang-ky`, `/quen-mat-khau`; cả ba dùng `AuthScreen` và `useAuthForm`. Biểu mẫu hiện chỉ kiểm tra tại trình duyệt và hiển thị thông báo bản xem trước.
- Giao diện đang dùng hai cột: mảng nhận diện thương hiệu màu indigo bên trái, biểu mẫu bên phải. Giữ ngôn ngữ thiết kế indigo, lime, nền sáng và kiểu chữ đang dùng trên toàn site.
- Backend hiện có `GET /api/v1/auth/csrf` và cơ chế CSRF cho SPA; chưa có controller đăng nhập. SRS v5.0 xác định `/api/v1/auth/login`, `/api/v1/users/me`, phiên bằng cookie HttpOnly và refresh rotation là yêu cầu của giai đoạn hoàn thiện xác thực.
- Tài liệu thiết kế mẫu cũ có đề cập Google/Apple, nhưng dự án chưa có hợp đồng OAuth. Chỉ hiển thị nút đăng nhập mạng xã hội khi luồng tương ứng được triển khai thật.

## 2. Thiết kế màn hình

### Bố cục

- **Desktop:** giữ bố cục hai cột; khối trái mang thương hiệu, một thông điệp ngắn và họa tiết chữ cái; khối phải tập trung vào biểu mẫu, chiều rộng đọc thoải mái, không kéo giãn theo màn hình lớn.
- **Tablet và mobile:** chuyển về một cột; logo và đường về trang chủ ở đầu; ẩn phần trang trí lớn để biểu mẫu xuất hiện sớm. Các nút và ô nhập đủ lớn để chạm; không phát sinh cuộn ngang.
- Sửa lại nhịp khoảng cách, độ tương phản và hiển thị dấu tiếng Việt ở mọi cỡ màn hình. Dùng font hỗ trợ tiếng Việt cho phần chữ nghiêng trang trí.

### Nội dung và thao tác

1. Tiêu đề “Chào mừng trở lại” và mô tả ngắn về việc tiếp tục học.
2. Ô email, ô mật khẩu có nút Hiện/Ẩn, liên kết “Quên mật khẩu?”.
3. Nút “Đăng nhập” là hành động chính; liên kết “Tạo tài khoản” đặt ngay dưới biểu mẫu.
4. Tab Đăng nhập/Tạo tài khoản phản ánh đúng route và luôn nhận biết được trạng thái đang chọn.
5. Nếu người dùng đi từ một trang học cần đăng nhập, sau khi thành công quay lại đúng trang đó; chỉ chấp nhận đường dẫn nội bộ hợp lệ.

### Trạng thái cần thiết

| Trạng thái | Cách thể hiện |
| --- | --- |
| Chưa nhập | Nhãn và gợi ý rõ ràng; không hiển thị lỗi sớm |
| Sai định dạng hoặc thiếu dữ liệu | Lỗi cạnh trường liên quan, `aria-invalid`, đưa focus tới trường lỗi đầu tiên |
| Đang gửi | Khóa thao tác gửi lặp; nút hiển thị tiến trình ngắn gọn |
| Sai email hoặc mật khẩu | Thông báo chung, không tiết lộ tài khoản có tồn tại hay không |
| Mất mạng hoặc máy chủ lỗi | Thông báo có nút thử lại; giữ email, xóa mật khẩu khi cần |
| Quá nhiều lần thử | Diễn đạt thời gian chờ theo phản hồi máy chủ nếu có |
| Thành công | Cập nhật trạng thái phiên rồi điều hướng; không hiện thông báo thành công giả |

## 3. Chia mã nguồn

```text
src/app/login/page.tsx
src/features/auth/components/auth-layout.tsx
src/features/auth/components/auth-art.tsx
src/features/auth/components/login-form.tsx
src/features/auth/components/auth-field.tsx
src/features/auth/hooks/use-login-form.ts
src/features/auth/lib/auth-client.ts
src/features/auth/types/auth.ts
src/styles/auth.css
src/styles/responsive.css
```

- `page.tsx` giữ metadata và route; `auth-layout` chứa khung chung; `login-form` chỉ chứa giao diện và hành vi đăng nhập.
- `use-login-form` quản lý giá trị, kiểm tra, trạng thái gửi và lỗi. `auth-client` là một nơi duy nhất gọi API và chuẩn hóa lỗi. Type mô tả yêu cầu, kết quả và trạng thái biểu mẫu; tránh dùng `any`.
- Tách phần đăng ký và quên mật khẩu khỏi `AuthScreen` khi chỉnh sửa chúng, để logic riêng của từng luồng không tiếp tục dồn vào một component.

## 4. Các bước thực hiện

### Giai đoạn A — Giao diện và hành vi

1. Chốt bố cục desktop/mobile bằng màn hình hiện có; chỉnh typography, khoảng cách, focus, hover và lỗi nhập liệu.
2. Tách `AuthScreen` theo cấu trúc trên; giữ liên kết giữa ba route hoạt động.
3. Xây `use-login-form` với kiểm tra email và mật khẩu, hiển thị lỗi đúng trường, trạng thái gửi và điều hướng an toàn.
4. Dùng lớp `auth-client` với hợp đồng có kiểu; trong khi API chưa sẵn sàng, giao diện phải báo rõ rằng chưa thể đăng nhập. Không tạo phiên hoặc chuyển vào trang học như thể đã xác thực.

### Giai đoạn B — Đăng nhập thật (phụ thuộc backend)

1. Thống nhất request/response và mã lỗi của `POST /api/v1/auth/login`, `GET /api/v1/users/me`, refresh và logout; xác định cách phản hồi khi tài khoản chưa xác minh, bị khóa hoặc bị giới hạn lượt thử.
2. Trước request ghi dữ liệu, lấy CSRF từ `GET /api/v1/auth/csrf`; gửi cookie cùng header `X-XSRF-TOKEN` qua đường dẫn `/api/*` hiện có. Sau đăng nhập, lấy thông tin người dùng và điều hướng theo quyền thực tế từ máy chủ.
3. Giữ access/refresh token trong cookie HttpOnly do backend cấp; không lưu token hoặc mật khẩu trong localStorage. Xử lý hết hạn phiên, refresh, đăng xuất và quay lại trang đăng nhập.
4. Đồng bộ header và khu học tập với trạng thái phiên; bảo vệ route và dữ liệu theo quyền ở backend, giao diện chỉ phản ánh quyền đã nhận.

## 5. Tiêu chí hoàn thành

- Desktop, mobile và bàn phím đều dùng được; có focus rõ, nhãn biểu mẫu, thông báo lỗi dễ hiểu và không tràn bố cục.
- Mọi đường dẫn Đăng nhập, Tạo tài khoản, Quên mật khẩu và Về trang chủ hoạt động đúng.
- Trước khi backend sẵn sàng, người dùng không bị dẫn tới một phiên đăng nhập giả.
- Khi backend sẵn sàng, đăng nhập thành công tạo phiên cookie thật; tải lại trang vẫn nhận đúng người dùng; sai mật khẩu, mất mạng, hết hạn phiên và đăng xuất đều được xử lý.
- `npm run lint`, `npm run build` đạt; kiểm tra trực tiếp ở desktop/mobile và ít nhất các luồng bàn phím, sai dữ liệu, thành công, lỗi máy chủ.

## 6. Tài liệu liên quan

- `docs/EnglishMaster_SRS_SDD_v5_0.md` ở thư mục gốc MasterEnglish: M01.02 và mục 6.4.
- `masterenglish-api/docs/LOCAL_SECURITY_SETUP.md`: cách lấy và gửi CSRF qua frontend rewrite.
- `masterenglish-web/docs/superpowers/specs/2026-10-27-masterenglish-ui-prototype-design.md`: ý tưởng giao diện tài khoản ban đầu.
