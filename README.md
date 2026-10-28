This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
dùng output standalone tạo trên Windows. Ứng dụng hiện dùng Google Fonts nên
bước build cần truy cập được dịch vụ font.

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
