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
này chưa kiểm tra luồng frontend gọi API và chưa xuất bản image lên GHCR.
