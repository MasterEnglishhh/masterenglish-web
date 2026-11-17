<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — MasterEnglish Web

Nếu có [hướng dẫn chung ở workspace](../AGENTS.md), đọc cùng tệp này. Dùng phiên bản Node.js 24 của CI và dependency đã khóa trong `package-lock.json`. Khi thay đổi hành vi Next.js, áp dụng khối hướng dẫn Next.js ở trên.

## Ranh giới frontend

- Giữ `src/app/` cho route, layout, metadata và ghép tính năng. Đặt UI, hook, client và type theo tính năng trong `src/features/`. Các nhóm hiện có gồm `auth`, `learning`, `marketing` và `vocabulary`. Chỉ đưa thành phần dùng thật sự ở nhiều tính năng vào `src/components/` hoặc `src/lib/`.
- Dùng các component, hook và style hiện có. Hook giữ trạng thái và hành động, component thể hiện UI. Theo ranh giới Server/Client Component của App Router, đặt `"use client"` tại phần cần state, event hoặc browser API.
- Dùng URL tương đối `/api/*` qua client hiện có. Khi sửa proxy hoặc auth, soát cookie, CSRF, redirect an toàn, logic refresh phiên và cache. Backend sở hữu phân quyền.
- Tính năng phải tương thích static export của Pages. Khi thêm route động hoặc phụ thuộc server runtime, đối chiếu `next.config.ts`, cách route hiện tại dùng `generateStaticParams` và kết quả `npm run build:pages`.
- Khi đổi giao diện hoặc form, kiểm tra luồng thực tế ở màn hình hẹp và rộng, focus và thao tác bàn phím. Với luồng lấy dữ liệu, kiểm tra các trạng thái tải, rỗng, lỗi và retry theo hành vi tính năng.

## Hai build target

- **Standalone** dùng `npm run build`. `next.config.ts` đặt `output: "standalone"`, bật `cacheComponents` và dùng `rewrites()` cho `/api/*`. Local và standalone cần `BACKEND_URL`. Thiết lập `.env.local` từ `.env.example` theo [README](README.md).
- **Cloudflare Pages** dùng `npm run build:pages`. Script đặt `DEPLOY_TARGET=cloudflare-pages`, tạo static export ở `out/` và dùng `functions/api/[[path]].ts` cho API. Trên Windows, script thêm `--webpack` để tránh lỗi worker CSS của Turbopack trên toolchain này. Redirect cũ nằm trong `next.config.ts` cho standalone và `public/_redirects` cho Pages. Xem [hướng dẫn Pages](docs/CLOUDFLARE_PAGES.md).
- Với thay đổi cấu hình, auth, routing hoặc runtime dùng chung, build cả hai target. Khi chỉ sửa Pages Function, chạy test proxy và build Pages. Khi đổi cookie, CSRF hoặc rewrite, kiểm tra request qua đường bị ảnh hưởng.

## Vòng kiểm tra

Chạy từ gốc repo. Node.js 24 của CI hỗ trợ chạy test TypeScript trực tiếp. Giữ test hồi quy cạnh client trong `src/features/**` hoặc trong `tests/` theo mẫu sẵn có.

| Tầng  | Lệnh                                                                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trong | Một ca cụ thể bằng `node --test --test-name-pattern='keeps 401 and quota' tests/pages-proxy.test.ts`. Khi sửa kiểu, chạy `npm exec -- tsc --noEmit`. |
| Giữa  | Chạy test theo file, ví dụ `node --test tests/pages-proxy.test.ts`, và `npm run lint`.                                                               |
| Ngoài | `npm run lint`, `npm test`, `npm run build:pages`. Thêm `npm run build` với `BACKEND_URL` khi thay đổi ảnh hưởng standalone.                         |

[Frontend CI](.github/workflows/ci.yml) chạy tầng ngoài cho Pages trên Linux với Node.js 24. Khi cần kiểm tra format, dùng `npm exec -- prettier --check AGENTS.md` hoặc thay bằng file đã sửa. `npm run format:check` kiểm tra cả repo và hiện nằm ngoài CI.

## Git và bàn giao

Giữ nguyên thay đổi có sẵn. Báo phạm vi, kết quả kiểm tra và phần chưa xác minh. Trao đổi, báo cáo, PR và commit bằng tiếng Việt có dấu, giữ nguyên định danh kỹ thuật. Chỉ commit khi được yêu cầu, với tiêu đề dạng `fix(vocabulary): giữ bộ lọc khi đổi trang` và phạm vi tùy chọn. Dùng danh tính đã cấu hình và giữ commit/PR không có ghi công Claude. Trước commit, soát diff đã stage, thông điệp và danh tính. Sau commit, chạy `git show -s --format=fuller HEAD`.
