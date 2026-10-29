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

**Trạng thái bản xem trước:** nội dung thẻ từ, bài ngữ pháp và câu TOEIC là dữ liệu minh họa. Lật thẻ, đánh giá ghi nhớ và xem lời giải chỉ thay đổi trong phiên trình duyệt; không lưu tiến độ hay kết quả. Các trang Ôn tập, Kết quả và AI Tutor hiển thị trạng thái chờ dữ liệu. Biểu mẫu đăng nhập gọi API sau khi lấy mã CSRF; backend hiện chưa có endpoint đăng nhập nên chưa tạo phiên thật. Đăng ký và quên mật khẩu vẫn là giao diện bản xem trước. Phân quyền Learner/Content Admin/System Admin, media thật và các luồng học tập có lưu dữ liệu sẽ được nối với backend ở giai đoạn tiếp theo.
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
