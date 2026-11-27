# Hoàn thiện MasterEnglish Web theo API hiện tại

**Mục tiêu:** Thực hiện kế hoạch đã được người dùng duyệt trong hội thoại: sửa lỗi quản trị, củng cố HTTP/proxy, nối dashboard, ngữ pháp, phiên luyện, kết quả và thông báo. Chỉ sửa web; không commit, không deploy, không sửa backend.

**Kiến trúc:** Next.js 16.4.6 / React 19.3, route tĩnh kết hợp query và Suspense, client API tương đối qua HTTP có cookie/CSRF. UI/hook/type/client đặt theo feature, dùng component và token hiện có. Node.js 24, không thêm dependency.

**Đặc tả:** Kế hoạch trong hội thoại ngày 28/11/2026 đã được duyệt bằng “Implement the plan”. Các quyết định chi tiết dưới đây hiện thực hóa đặc tả đó; giới hạn backend phải được báo trung thực.

## Task 1: Quản trị hiện tại

Phạm vi sở hữu: src/features/admin/** trừ phần thông báo mới; tests/admin-*.test.mjs; test client admin hiện có. Không sửa src/lib hoặc app route chung.

- Sửa useAdminSystem: trạng thái tải/lỗi/retry độc lập cho storage, AI, flags, logs; giữ dữ liệu xác nhận gần nhất kèm cảnh báo khi lỗi; bỏ toàn bộ dữ liệu quota giả; hiển thị đủ AI providers; tracker chống stale requests. Phân trang nhật ký 50 dòng, đổi bộ lọc về trang đầu. Mỗi cờ chỉ một mutation đang bay, dùng phản hồi server thay vì optimistic rollback.
- Sửa users: reset page khi đổi bộ lọc; về trang cuối khi trang vượt phạm vi; fetch GET /api/v1/admin/users/{id} khi mở phân quyền, chặn lưu khi detail lỗi/chưa tải; modal khóa/role await kết quả boolean, giữ mở và hiện lỗi khi thất bại; không mất draft; disable khi busy.
- RequireAdmin/RequireSystemAdmin phân biệt lỗi phiên với 403, có retry.
- Bộ chọn tạo DECK bị khóa với tài khoản không có LEARNER, giải thích thiếu API tra cứu dành cho quản trị; không tự cấp vai trò; giữ WORD và thao tác hiện có.
- Thêm validate DTO admin và encode path segments. Lõi requestJson do root cung cấp validate?: (unknown)=>boolean và headers?: HeadersInit; helpers isRecord/isPageResponse/isUuid tại src/lib/api-validation.ts. Không đợi helpers để viết regression tests.
- Reuse latest-request, Dialog, ErrorState, EmptyState, Pagination; sửa empty table mobile nằm trong vùng nhìn.
- TDD: test API lỗi không fake quota; stale logs; toggles không trùng; pagination; user detail; failed save giữ modal; role combinations. Chạy focused tests và tsc phần mình, self-review. Không commit, không spawn subagents.

## Task 2: HTTP, proxy, cấu hình và kiểm thử nền

- headers và validate trong requestJson; giữ CSRF/cookie/no-store, refresh 401 một lần, không retry 403, Content-Type chỉ khi có body. Guard DTO/UUID ở client hiện có, encode segments.
- Giới hạn body Pages Function 2 MiB theo bytes thực đọc, trả 413 trước upstream; giữ cookies tách biệt, redirect manual, IP filtering hiện có.
- Header chống nhúng/nosniff/referrer và CSP frame-ancestors/object-src/base-uri ở Pages và standalone, không chặn hydration.
- Cập nhật chuỗi dev minimatch tương thích, không force; sửa selector E2E scoped alert, worker local 1 và chờ phiên sẵn sàng.
- Test trước sửa, focused HTTP/proxy, full suite, lint, typecheck, cả hai build; không commit.

## Task 3: Dashboard, ngữ pháp và thời gian học

- Client/type khớp DTO backend đọc tại D:/User/HUCE/HK1_2627/1. Server+/Codes/masterenglish-api (read-only, đang conflict). Dashboard đọc /api/v1/dashboard, không bịa dữ liệu; phân biệt availability/status.
- Grammar: topics phân trang, topic/lesson UUID trên query; bài lesson render 5 block (heading/paragraph/note/example/table) bằng React escaped text, IN_PROGRESS và COMPLETED; exercises chỉ count, mở attempt GRAMMAR_TOPIC qua practice client của Task 4.
- Tracking bài học/attempt dùng creditToken/version, heartbeat tuần tự, tab ẩn không ghi nhận; không chặn học khi tracking lỗi; không tự tái mở sau conflict từ tab khác.
- Giữ giao diện/token hiện tại, a11y/loading/empty/error/retry, Suspense và export.

## Task 4: Phiên luyện, TOEIC và kết quả

Phạm vi sở hữu: src/features/practice/** mới, src/features/toeic/**, src/features/results/** mới, src/app/learn/practice/page.tsx, src/app/learn/results/page.tsx, tests/practice-*.test.mjs và tests/client practice. Không sửa learning hoặc navigation chung.

- Client/type/guards đúng DTO controllers hiện tại của backend (read-only). Export startAttempt(input, key, signal?), fetchAttempt(id, signal?), saveAnswer(attemptId,snapshotId,{selectedOptionId,expectedVersion},key,signal?), submitAttempt(id), fetchAttemptResults(id), fetchAttempts(filters), fetchTopicStatistics(category). Dùng HttpOutcome<T> nhất quán, requestJson headers/validate.
- New static /learn/practice?attempt=<uuid>; source GRAMMAR_TOPIC or PRACTICE_SET, chỉ PRACTICE mode. Stable idempotency key UUID cho start/save retry; serialize per-question writes, queued latest answer, GET resync 409, block submit until saves settled; uncertain outcomes retry same key/payload. No answers/transcripts before submit. Support actual grouped materials/options/audio fields (read docs/practice CONTRACT). Deadline từ server, không tự chấm.
- TOEIC catalog query q/part/difficulty/page và ?set=<uuid> detail metadata, start request source PRACTICE_SET, tiếp tục attempt; bỏ sample khỏi flow thật.
- Results tabs vocabulary/grammar/toeic, giữ ProgressView từ vựng; history paging/filter URL, active resume, submitted detail ?attempt=<uuid>, accuracy/part breakdown/review material. Không quy đổi điểm TOEIC990/không chart ngày giả.
- Reuse UI; feature CSS responsive, keyboard controls; hook owns async state, components UI. Tests API contracts, CAS, uncertain retry keys, no double submits, loading/error/empty. Không commit, không spawn agents.

## Task 5: Thông báo, hồ sơ, điều hướng và bàn giao

- Learner static /learn/notifications feed/unread/read-all/history/preferences HH:mm/IANA timezone; preferences trong account, quiet hours cả cặp và khác nhau. Chỉ operations backend hỗ trợ.
- Admin /admin/notifications SYSTEM_ADMIN deliveries/rules/history, filters/paging; rule PUT enabled/minimumGapMinutes. Feature riêng notifications để tránh đụng admin task1.
- Account 3 cards/profile/security/goal, notification settings learner. Navigation learner/admin, availability labels sau feature hoàn thành; giữ AI Tutor trạng thái chưa triển khai.
- Cập nhật docs/ADMIN_API_CONTRACTS.md và ghi endpoint mới chưa xác minh staging, backend blockers revision/editor/admin lookup.
- Full unit/component/lint/tsc/build standalone/build pages và E2E hẹp/rộng; review toàn diff; không push/commit/deploy.

## Bàn giao kiểm chứng local — 28/11/2026

Đã tiếp tục từ mã triển khai có sẵn, giữ nguyên thay đổi của người dùng và không sửa backend gốc. Các màn practice/TOEIC/results/notifications/dashboard/grammar hiện dùng API; README và hợp đồng quản trị đã cập nhật.

- Sửa lỗi lựa chọn mới xóa thông báo retry sau một lần autosave thất bại. Test hồi quy đỏ → xanh xác nhận retry giữ key/payload cũ rồi lưu lựa chọn mới với version kế tiếp.
- Thêm xác nhận khi bấm liên kết rời bài còn đáp án chưa lưu, dùng Dialog hiện có và áp dụng cả điều hướng chung. Giới hạn: Back/Forward của trình duyệt chưa có history blocker; người học nên chờ trạng thái đã lưu trước khi dùng thao tác đó. Không cam kết giữ draft trong bộ nhớ sau khi chủ động bỏ bài hoặc tải lại.
- Khép script helper còn thiếu của các test soak có sẵn; chưa chạy soak tải dài. Sửa adapter nghiệm thu Pages ở Node: bỏ metadata gzip của body đã giải nén, đọc xong response trước khi ghi header để xử lý stream ngắt. Đây là adapter local, không phải Cloudflare deployed runtime.
- Sửa selector E2E mục tiêu để kiểm tra đúng thẻ khi dashboard cũng hiển thị cùng điểm TOEIC.
- Ruling: không thêm key lặp ở RequireAuth. AuthSessionProvider đã key toàn cây theo user.id; test auth-session xác nhận xóa draft khi A → B và giữ draft khi refresh cùng tài khoản. Finding review về dữ liệu A → B không áp dụng cho mã cuối.

| Kiểm tra | Kết quả | Bằng chứng |
| -------- | ------- | --------- |
| Node.js | 24.22.1 | Runtime giống major của CI |
| Toàn bộ test | 256/256 đạt | `.audit/current-tests.log` |
| ESLint | Đạt, không cảnh báo | `.audit/current-lint.log` |
| TypeScript | Đạt | `.audit/current-tsc.log` |
| Pages build | Đạt, gồm các route mới | `.audit/current-pages.log` |
| Standalone build | Đạt với `npm run build -- --webpack`, BACKEND_URL local | `.audit/current-standalone.log` |
| E2E hiện có | 72/72 đạt, 4 viewport | `.audit/current-mock-e2e.log` |
| E2E backend thật | 12/12 đạt, 360px và 1440px | `.audit/current-real-e2e.log` |
| Đồ thị phụ thuộc feature | Không cycle | `.audit/current-architecture.json` |
| Whitespace diff | Đạt | `git -c core.whitespace=cr-at-eol diff --check` |

E2E thật dùng PostgreSQL/backend audit cô lập có sẵn, export Pages và Function thật qua adapter local; bao gồm mất phản hồi lưu, đổi lựa chọn sau lỗi, replay key, resume/nộp/kết quả, feed/preferences/admin rules, kiểm tra CSRF/ownership/quyền và đổi cookie tài khoản. Đã xem ảnh màn hẹp/rộng và kiểm tra tràn/cắt điều khiển. Chưa xác minh staging, Cloudflare thực tế, media toàn bộ Part, benchmark hoặc soak; không suy rộng kết quả local thành nghiệm thu production. Không commit, push hoặc deploy.
