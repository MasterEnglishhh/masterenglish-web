# MasterEnglish Web

Nền tảng giao diện Next.js 16.4.3 và React 19.3. Trang chủ ở `/`; không gian học ở `/learn` với các trang Từ vựng (`/learn/vocabulary`), Ôn tập (`/learn/review`), Ngữ pháp (`/learn/grammar`), Luyện TOEIC (`/learn/toeic`), Kết quả (`/learn/results`) và AI Tutor (`/learn/ai-tutor`). Các trang tài khoản gồm `/login`, `/register` và `/forgot-password` (hỗ trợ tự động chuyển hướng từ các route tiếng Việt cũ).

## Cấu trúc mã nguồn

```text
src/
  app/                         Đường dẫn, layout và metadata của Next.js
  components/                  Thành phần dùng chung: logo, biểu tượng, hiệu ứng
  features/
    auth/components/           Giao diện tài khoản
    auth/hooks/                Trạng thái và kiểm tra biểu mẫu tài khoản
    auth/types/                Kiểu của luồng tài khoản
    learning/components/       Điều hướng và bài học mẫu
    learning/data/             Dữ liệu minh họa cho không gian học
    learning/hooks/            Luồng lật thẻ và làm câu TOEIC mẫu
    learning/types/            Kiểu thẻ từ, câu TOEIC và điều hướng
    marketing/components/      Trang chủ, header và footer
    marketing/data/            Danh mục trên trang chủ
    marketing/types/           Kiểu danh mục trang chủ
  styles/                      CSS nền, trang chủ, học tập, tài khoản, responsive
public/                        Tài nguyên tĩnh được phục vụ trực tiếp
demo/                          Bản mẫu HTML độc lập
docs/                          Tài liệu thiết kế và kế hoạch
```

Giữ `src/app` gọn cho các file định tuyến. Thành phần dùng ở nhiều khu vực đặt trong `src/components`; giao diện, hook, dữ liệu và type của từng khu vực đặt trong `src/features`. Hook xử lý trạng thái và hành động của biểu mẫu hoặc bài học mẫu; component hiển thị giao diện. Các mảng dữ liệu minh họa dùng `satisfies` để được kiểm tra type mà vẫn giữ literal type. Type dùng chung toàn ứng dụng chỉ cần thêm khi nhiều tính năng thực sự cùng sử dụng. `src/app/globals.css` nạp Tailwind; các lớp giao diện nằm trong `src/styles` và được nhập theo thứ tự từ `src/app/layout.tsx`. Alias `@/` trỏ tới `src/`.

Thẻ từ có hai mặt cố định trong DOM và chuyển giữa hai mặt bằng `rotateY` từ trái sang phải. Nút vẫn dùng được bằng bàn phím; CSS tắt chuyển động khi hệ điều hành bật giảm hiệu ứng.

Cách chia theo tính năng tham khảo [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md); ranh giới server/client và cách tổ chức route theo tài liệu [Next.js](https://nextjs.org/docs/app/getting-started/project-structure) và [React custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks).

Chạy local bằng `npm run dev`, mở `http://127.0.0.1:3000`. Chạy `npm run lint`, `npm run test` và `npm run build` trước khi tích hợp thay đổi. Cần đặt `BACKEND_URL` trong `.env.local` để cấu hình rewrite `/api/*` cho biểu mẫu đăng nhập.

**Trạng thái bản xem trước:** nội dung thẻ từ, bài ngữ pháp và câu TOEIC là dữ liệu minh họa. Lật thẻ, đánh giá ghi nhớ và xem lời giải chỉ thay đổi trong phiên trình duyệt; không lưu tiến độ hay kết quả. Các trang Ôn tập, Kết quả và AI Tutor hiển thị trạng thái chờ dữ liệu. Đăng ký kèm OTP, quên/đặt lại mật khẩu, đăng nhập, khôi phục phiên và đăng xuất đã nối API thật. Phân quyền Learner/Content Admin/System Admin, media thật và các luồng học tập có lưu dữ liệu sẽ được nối với backend ở giai đoạn tiếp theo.

## Xác thực với backend

Sao chép `.env.example` thành `.env.local`, đặt `BACKEND_URL=http://127.0.0.1:8080`, chạy backend với profile `local`, rồi chạy `npm run dev`. Mở `http://127.0.0.1:3000` và dùng tài khoản đang hoạt động, đã xác minh email trong database backend. Frontend không tạo tài khoản hoặc phiên giả. Backend cần cho phép origin frontend; dùng nhất quán `127.0.0.1` hoặc `localhost` và tắt cookie Secure chỉ trong môi trường HTTP local.

Browser gọi URL tương đối qua rewrite `/api/*`:

- `GET /api/v1/auth/csrf`: bootstrap trước mỗi thao tác auth, gửi token qua header do backend trả về. Ưu tiên giá trị cuối của cookie `XSRF-TOKEN` trong trình duyệt để khớp khi backend cấp lại cookie; không gửi POST nếu bootstrap thất bại. Nếu bị 403 thì bootstrap lại và thử lại tối đa một lần.
- `POST /api/v1/auth/login`: gửi email/mật khẩu, nhận `UserProfileResponse`; access/refresh token chỉ nằm trong cookie HttpOnly do backend cấp.
- `GET /api/v1/users/me`: khôi phục tài khoản khi tải trang, quay lại tab và định kỳ 5 phút khi đang đăng nhập. Nếu nhận 401, gọi `POST /api/v1/auth/refresh` rồi đọc lại profile một lần. Các lần kiểm tra đồng thời trong một tab dùng chung request để tránh xoay refresh token trùng.
- `POST /api/v1/auth/logout`: thu hồi phiên, xóa cookie và chuyển về đăng nhập. Nếu thất bại, giữ tài khoản hiện tại và hiển thị lỗi để thử lại.

`AuthSessionProvider` giữ thông tin tài khoản trong bộ nhớ React, không lưu token vào localStorage. Web Locks (trên HTTPS hoặc localhost) phối hợp login/refresh/logout giữa các tab; trước khi xoay refresh token, tab chờ kiểm tra lại cookie đã được tab khác làm mới hay chưa. `/learn` và các trang con có chặn giao diện khi chưa xác thực, đưa người dùng về `/login?redirect=...` và quay lại đúng trang sau đăng nhập. Đây là kiểm soát điều hướng phía client; backend vẫn phải xác thực/phân quyền mọi API dữ liệu. Lỗi mạng/máy chủ khi kiểm tra phiên có nút thử lại và không bị coi là hết phiên. HTTP 401 đăng nhập hiện thông báo chung, 429 dùng `Retry-After` để đếm ngược, lỗi validation gắn vào trường tương ứng.

Trang `/register` có biểu mẫu họ/tên (tối đa 30 ký tự mỗi phần), email, mật khẩu và xác nhận. Mật khẩu NFC cần ít nhất 15 Unicode code point và tối đa 72 byte UTF-8; không ép chữ/số/ký tự đặc biệt. Backend kiểm tra mật khẩu phổ biến/đã lộ. `POST /api/v1/auth/register` trả lượt đăng ký thật rồi frontend chuyển sang nhập OTP 6 số, có hỗ trợ dán mã và đếm ngược 5 phút. `POST /api/v1/auth/register/resend` gửi lại sau tối thiểu 60 giây; backend giữ hạn mức cả khi tải lại trang hoặc bắt đầu lại. `POST /api/v1/auth/register/verify` thành công chuyển về `/login?registered=1&redirect=...`, hiển thị xác minh thành công và giữ trang đích; không tự đăng nhập trước khi nhập mật khẩu. Lỗi gửi và lỗi xác minh có thời gian chờ riêng. Password được xóa khỏi state sau khi tạo challenge; không lưu password/OTP/challenge vào localStorage/sessionStorage. Layout dùng được trên điện thoại.

Để thử OTP local, chạy Mailpit trong repo API và xem mã ở `http://127.0.0.1:8025`. Khóa JWT/OTP, mật khẩu SMTP chỉ đặt ở `.env` backend, không đặt trong frontend hoặc `NEXT_PUBLIC_*`. Xem [hướng dẫn cấu hình](../masterenglish-api/docs/REGISTRATION_SETUP.md).

Trang `/forgot-password` có ba bước email → OTP → mật khẩu mới. API `/api/v1/auth/password/forgot`, `/verify`, `/reset` giữ CSRF và hạn mức; reset grant chỉ nằm trong bộ nhớ, có hạn 5 phút, không xuất hiện trong URL/storage. Đặt lại thành công xóa user cache, chuyển về login với thông báo thành công và giữ redirect an toàn. Dùng lại cấu hình Gmail/SMTP backend, không cần thêm biến frontend. Chi tiết: [quên mật khẩu](../masterenglish-api/docs/PASSWORD_RESET_SETUP.md).

## Docker cho triển khai EC2

Chạy từ repo `masterenglish-web`, cần Docker đang hoạt động:

```powershell
docker build --build-arg BACKEND_URL=http://api:8080 --tag masterenglish-web:local .
docker run --rm --publish 127.0.0.1:3000:3000 masterenglish-web:local
```

Dockerfile cài thư viện theo `package-lock.json`, chạy `npm run build` trên Linux
với Node.js 24 rồi đưa output `standalone`, `.next/static` và `public` vào image
chạy bằng user `node`. Truy cập `http://127.0.0.1:3000` để kiểm tra trang chủ.
Kiểm tra gọi API cần backend cùng Docker network và có hostname `api`.

`BACKEND_URL` là build argument để tạo rewrite `/api/*`, mặc định
`http://api:8080`; Docker Compose production trong repo Infra cần đặt tên service
backend là `api`. Không cần backend đang chạy khi build frontend hiện tại.
Rewrite được ghi vào output lúc build, nên thay `BACKEND_URL` lúc chạy container
không cập nhật đích rewrite; khi đổi địa chỉ backend phải build lại image.
Chạy `npm run dev` trên Windows vẫn dùng `BACKEND_URL` trong môi trường local
của frontend như trước.

`.dockerignore` loại `.env*`, private key, Git history và output/dependencies
trên máy local khỏi build context. Image được build trực tiếp trên Linux, không
dùng output standalone tạo trên Windows.

Workflow `Frontend CI` cài dependencies, chạy lint, build Docker image (bên trong
có bước build Next.js và kiểm tra TypeScript), sau đó khởi động container và gửi
HTTP request tới `/`. Container kiểm tra được dọn khi bước này kết thúc. Bước
này chưa kiểm tra luồng frontend gọi API. Khi push `main`, workflow tự xuất bản
đúng image vừa kiểm tra lên GHCR như bên dưới.

## Xuất bản image lên GHCR

Sau mỗi push lên `main`, **Frontend CI** tự cài dependencies, chạy lint, build
Docker image với `BACKEND_URL=http://api:8080`, khởi động image và kiểm tra trang
`/`. Bước build bên trong Docker cũng kiểm tra TypeScript. Kiểm tra HTTP có
retry cho lỗi kết nối khi ứng dụng đang khởi động; nếu vẫn không hoạt động trong
thời gian chờ thì workflow thất bại.

Job `publish` chỉ chạy khi job `verify` thành công. Nó nhận nguyên image đã
kiểm tra trong cùng workflow run qua artifact, không build lại image, rồi đẩy
lên GHCR. Artifact trung chuyển giữ 1 ngày; image trên GHCR tồn tại độc lập.
Pull request và lần chạy thủ công **Frontend CI** chỉ kiểm tra/build, không
xuất bản image.

Không cần bấm Publish sau mỗi push nữa. Workflow **Publish frontend image**
thủ công vẫn giữ để xuất bản lại từ `main` khi cần. Workflow đó chạy lại lint,
build và smoke test, nên lần build mới có thể cho digest khác dù cùng commit.

Image có dạng `ghcr.io/masterenglishhh/masterenglish-web:sha-<commit SHA đầy đủ>`.
Job xuất bản dùng `GITHUB_TOKEN` GitHub tự cấp cùng quyền `packages: write`;
job kiểm tra chỉ có `contents: read`. Không cần thêm token hoặc secret cho bước
xuất bản này. Label source liên kết package với repo Web.

Trong trang Summary của lượt chạy thành công, lấy dòng **Deploy by digest** dạng
`ghcr.io/masterenglishhh/masterenglish-web@sha256:...` để cố định đúng nội dung
image khi triển khai. Image vẫn có tag theo commit để truy vết source. Sau khi
**Frontend CI** xanh, lấy dòng **Deploy by digest** từ Summary của job Publish,
rồi chọn image này ở workflow **Deploy production** trong repo Infra.
Production tiếp tục triển khai bằng nút chạy thủ công, không tự cập nhật khi
push code.
