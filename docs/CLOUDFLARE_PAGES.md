# Chuyển frontend sang Cloudflare Pages

## Bản đã chuẩn bị

- `npm run build:pages` tạo static export trong `out/`, không cần backend khi build.
- `functions/api/[[path]].ts` chuyển tiếp `/api/*` đến đúng origin HTTPS trong
  `BACKEND_URL`. Body, query, Origin, CSRF và từng Set-Cookie được giữ; API dùng
  no-store, không theo redirect upstream tự động, lỗi mạng trả thông báo chung.
- `public/_routes.json` chỉ chạy Function cho `/api` và `/api/*`; trang và assets
  được Pages phục vụ trực tiếp. `public/_redirects` giữ các URL tiếng Việt cũ.
- Không đổi auth client sang gọi domain API trực tiếp. Cookie vẫn thuộc hostname
  frontend, nên trình duyệt tiếp tục đọc XSRF-TOKEN và gửi cookie cùng origin.
- `npm run build`, Dockerfile và cách deploy EC2 cũ vẫn hoạt động để chuyển đổi
  theo từng bước. Job `Verify Cloudflare Pages build` bổ sung kiểm tra bản Pages.

## 1. Đưa code lên GitHub

Commit các thay đổi frontend và push lên nhánh sẽ dùng cho Pages. Không commit
`.env.local`, JWT/OTP secret hoặc mật khẩu Gmail. Đợi CI của bản Pages thành công.
Không cần chuyển code hay cấu hình email trong repo API cho bước này.

## 2. Tạo Pages project

Cloudflare dashboard → Workers & Pages → Create application → Pages → Import an
existing Git repository. Cho phép Cloudflare truy cập repo `masterenglish-web`.

| Thiết lập | Giá trị |
| --- | --- |
| Repository | `masterenglish-web` |
| Production branch | `main` |
| Root directory | Để trống nếu repo chỉ chứa frontend |
| Framework preset | `Next.js (Static HTML Export)` |
| Build command | `npm run lint && npm test && npm run build:pages` |
| Build output directory | `out` |

Trong phần biến môi trường của **Production**, thêm:

```env
NODE_VERSION=24
BACKEND_URL=https://apimaster.trinhdanghuy.id.vn
```

`BACKEND_URL` là origin API, không thêm `/api`, đường dẫn, query hay credential.
Đặt biến ở runtime của Pages Functions nữa nếu giao diện phân biệt build/runtime.
Không dùng địa chỉ Docker nội bộ `http://api:8080` trên Cloudflare.

Không cần `DEPLOY_TARGET`: script build đã tự đặt. Không đưa khóa JWT/OTP/rate
limit hoặc SMTP_PASSWORD lên Pages. Không cấu hình Preview dùng backend production
tự động: để BACKEND_URL trống sẽ trả 503 cho API, hoặc dùng backend staging riêng.

Deploy lần đầu. Kiểm tra deployment có Functions và route `/api/*`, không chỉ
upload riêng thư mục `out` bằng giao diện kéo thả: thư mục này không chứa mã
Functions. Git integration sẽ build Functions từ thư mục `functions` trong repo.

## 3. Thử bằng domain Pages trước khi chuyển domain chính

Trang tạm thường có dạng `https://TEN-PROJECT.pages.dev`. Trong `.env.prod` trên
EC2, bổ sung **đúng hostname này** vào `APP_SECURITY_ALLOWED_ORIGINS`, giữ origin
production hiện tại, phân cách bằng dấu phẩy. Không dùng wildcard:

```env
APP_SECURITY_ALLOWED_ORIGINS=https://master.trinhdanghuy.id.vn,https://TEN-PROJECT.pages.dev
```

Sau khi thay TEN-PROJECT bằng tên thật, kiểm tra Compose rồi cập nhật API:

```bash
cd /srv/masterenglish
docker compose --env-file .env.prod -f compose.production.yaml -f compose.https.yaml config --quiet
docker compose --env-file .env.prod -f compose.production.yaml -f compose.https.yaml up -d --no-deps api
```

API có thể bị gián đoạn ngắn khi container được tạo lại. Dùng image đã deploy
thành công trong `.env.prod`; bước này chỉ áp dụng biến môi trường. Nếu API được
thay container, Nginx hiện tại cần reload để phân giải địa chỉ container mới:

```bash
docker compose --env-file .env.prod -f compose.production.yaml -f compose.https.yaml exec nginx nginx -t
docker compose --env-file .env.prod -f compose.production.yaml -f compose.https.yaml exec nginx nginx -s reload
```

Kiểm tra trên hostname Pages:

- `/api/actuator/health` trả JSON `status: UP`.
- `/api/v1/auth/csrf` trả JSON và đặt cookie XSRF-TOKEN.
- Đăng ký → nhận OTP → xác minh → đăng nhập → mở `/learn` → tải lại trang.
- Refresh phiên, đăng xuất, quên mật khẩu → OTP → đặt mật khẩu mới.
- Mở trực tiếp `/login`, `/register`, `/forgot-password`, `/learn/review`; đường
  dẫn không tồn tại phải là 404. `/dang-nhap` chuyển về `/login`.

Các thử nghiệm tạo tài khoản/gửi OTP sẽ dùng database và Gmail của backend đã
chọn. Dùng tài khoản thử của chính bạn. Không coi health UP là đã kiểm tra gửi mail.

## 4. Chuyển domain chính sau khi bản Pages hoạt động

Trong Pages project → Custom domains → Set up a custom domain → nhập
`master.trinhdanghuy.id.vn`, làm theo hướng dẫn xác minh và cập nhật DNS của
Cloudflare. Giữ `apimaster.trinhdanghuy.id.vn` trỏ EC2. Kiểm tra lại toàn bộ auth
trên domain chính; người dùng có thể cần đăng nhập lại.

Sau khi xác nhận domain chính hoạt động, có thể bỏ origin Pages tạm khỏi allowlist
nếu không tiếp tục dùng nó để thử. Không chuyển dữ liệu PostgreSQL hay cấu hình
Gmail sang Pages.

## 5. CI/CD và container Web EC2

Git integration của Pages tự build/deploy sau mỗi push lên nhánh production;
build command ở trên bắt buộc lint/tests thành công trước deploy. GitHub CI vẫn
kiểm tra cả Pages và Docker trong giai đoạn chuyển đổi. Không cần Cloudflare API
token trong GitHub khi dùng Git integration này.

**Giữ container Web EC2 và workflow Deploy production hiện tại trong giai đoạn
thử.** Chúng vẫn phụ thuộc nhau: Nginx có upstream `web`, Compose HTTPS chờ Web
healthy, deploy script cập nhật hai image và kiểm tra API từ container Web.
Không stop/xóa Web hoặc bỏ WEB_IMAGE lúc này.

Sau khi Pages/domain chính đã được kiểm tra thành công, bước tiếp theo trên Infra
là tách deploy chỉ cho backend: bỏ phụ thuộc Web trong Compose/Nginx, chuyển probe
health sang API/Nginx và bỏ input image frontend. Chỉ sau bước đó mới dừng Web.
Frontend Pages không được triển khai bằng workflow hai Docker image hiện tại.

## Tài liệu chính thức

- https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/
- https://developers.cloudflare.com/pages/functions/routing/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
