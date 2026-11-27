# Hợp đồng API cho giao diện quản trị

Cập nhật ngày 28/11/2026, đối chiếu controller và DTO trong
`masterenglish-api/src/main/java/com/masterenglish/api/modules/admin/`.
Đã đối chiếu mã nguồn local, chưa xác minh trên staging. Controller và DTO là
nguồn chuẩn khi khác với ví dụ trong tài liệu cũ.

## Quy tắc dùng chung

- Gọi URL tương đối `/api/v1/*`; xác thực bằng cookie HttpOnly do backend cấp.
- Trước mutation, lấy `GET /api/v1/auth/csrf` và gửi `X-XSRF-TOKEN`.
  Phản hồi bootstrap: `{ headerName: "X-XSRF-TOKEN", token: "..." }`.
- Client dùng `credentials: "same-origin"`, `cache: "no-store"`,
  `redirect: "error"`. Request JSON không tự theo redirect để tránh phát lại
  mật khẩu, body và header CSRF sang đích khác.
- `401`: làm mới phiên một lần qua `POST /api/v1/auth/refresh`, rồi thử lại.
  `403`: trả lỗi, không tự gửi lại. Backend dùng `ACCESS_DENIED` cho cả lỗi
  CSRF và từ chối quyền, client không thể phân biệt an toàn.
- Lỗi dạng Problem Details: `{ code, detail, title, errors: [{ field, ... }] }`.
  Chỉ nhận trường đúng kiểu; không đưa `detail`/`message` của lỗi `5xx` lên UI.
  `Retry-After` hỗ trợ số giây và ngày giờ HTTP.
- ID của user, item, revision và source là UUID. Encode từng path segment.
  ID item và ID revision có ý nghĩa khác nhau, không dùng thay cho nhau.
- API quản trị trả JSON, kể cả mutation. Không coi `204` là thành công nếu
  endpoint yêu cầu DTO. API lưu/bỏ lưu từ và đổi mật khẩu của người học có
  hợp đồng `204` riêng.
- Backend phân quyền từng API. Component bảo vệ route chỉ kiểm soát giao diện.
- Mutation có phiên đăng nhập gửi `X-Session-User` của tài khoản lúc bắt đầu yêu cầu; backend kiểm tra khớp với cookie để chặn phát lại thao tác cũ sau khi đổi tài khoản. Header này không thay thế xác thực/phân quyền.

Phân trang dùng cùng một cấu trúc:

```ts
interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}
```

API bắt đầu trang từ `0`; UI admin chuyển từ `1` sang `0`. Backend mặc định
`size=20`, tối đa `100`; bỏ bộ lọc `ALL` khỏi query. Không dùng
`content`/`totalElements` của ví dụ cũ.

## Tổng quan — SYSTEM_ADMIN hoặc CONTENT_ADMIN

| Method | Endpoint                            | Input    | Response                  |
| ------ | ----------------------------------- | -------- | ------------------------- |
| GET    | `/api/v1/admin/overview/kpis`       | Không có | `200 AdminKpiDto[]`       |
| GET    | `/api/v1/admin/overview/activities` | `limit`  | `200 RecentActivityDto[]` |

Không có endpoint gộp `GET /admin/overview` hay bộ lọc `timeRange` trong controller.
KPI gồm `id`, `title`, `value`, `subValue`, `changePercent`, `trendText`,
`trendDirection`, `iconName`. Các trường xu hướng và giá trị phụ có thể `null`;
không thay bằng tăng trưởng, uptime hoặc số cảnh báo giả.

Hoạt động gồm `id`, `actorEmail`, `actorName`, `action`, `target`, `module`,
`timestamp`, `status`.

## Người dùng — SYSTEM_ADMIN

| Method | Endpoint                                   | Input                                                                        | Response                         |
| ------ | ------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------- |
| GET    | `/api/v1/admin/users`                      | `search`, `role`, `status`, `page`, `size`, `sortBy`, `sortDirection`        | `200 PageResponse<AdminUserDto>` |
| GET    | `/api/v1/admin/users/{id}`                 | UUID người dùng                                                              | `200 AdminUserDto`               |
| PUT    | `/api/v1/admin/users/{id}/roles`           | `{ roles: RoleCode[] }`, ít nhất một vai trò                                 | `200 AdminUserDto`               |
| POST   | `/api/v1/admin/users/{id}/lock`            | `{ reason, lockedUntil }`; reason bắt buộc, lockedUntil là Instant hoặc null | `200 AdminUserDto`               |
| POST   | `/api/v1/admin/users/{id}/unlock`          | Không body                                                                   | `200 AdminUserDto`               |
| POST   | `/api/v1/admin/users/{id}/revoke-sessions` | Không body                                                                   | `200 { message: string }`        |

Vai trò: `LEARNER`, `CONTENT_ADMIN`, `SYSTEM_ADMIN`.
Trạng thái tài khoản: `ACTIVE`, `LOCKED`, `PENDING_VERIFICATION`, `DISABLED`.
Sort hỗ trợ `createdAt`, `email`, `id`; chiều `asc` hoặc `desc`.

`AdminUserDto`: `id`, `email`, `displayName`, `firstName`, `lastName`,
`phone`, `status`, `roles`, `authVersion`, `activeSessionsCount`, `createdAt`,
`lastLoginAt`, `lockReason`, `lockedUntil`. Các trường hồ sơ, thời điểm đăng
nhập và thông tin khóa có thể `null`.

Hộp thoại vai trò phải lấy chi tiết trước khi cho phép lưu; lỗi tải không được
biến thành danh sách vai trò rỗng. Lưu thất bại giữ nguyên hộp thoại và draft.

## Nội dung — SYSTEM_ADMIN hoặc CONTENT_ADMIN

| Method | Endpoint                                       | Input                                             | Response                                |
| ------ | ---------------------------------------------- | ------------------------------------------------- | --------------------------------------- |
| GET    | `/api/v1/admin/content/items`                  | `search`, `contentType`, `status`, `page`, `size` | `200 PageResponse<AdminContentItemDto>` |
| POST   | `/api/v1/admin/content/words`                  | `CreateWordDraftRequest`                          | `201 AdminContentItemDto`               |
| POST   | `/api/v1/admin/content/decks`                  | `CreateDeckDraftRequest`                          | `201 AdminContentItemDto`               |
| POST   | `/api/v1/admin/content/revisions/{id}/submit`  | Không body                                        | `200 AdminRevisionDto`                  |
| POST   | `/api/v1/admin/content/revisions/{id}/approve` | `{ reviewNote }`, body tùy chọn                   | `200 AdminRevisionDto`                  |
| POST   | `/api/v1/admin/content/revisions/{id}/reject`  | `{ reviewNote }`; UI yêu cầu lý do                | `200 AdminRevisionDto`                  |
| POST   | `/api/v1/admin/content/revisions/{id}/publish` | Không body                                        | `200 AdminRevisionDto`                  |
| POST   | `/api/v1/admin/content/items/{id}/archive`     | `{ reason }`; UI yêu cầu lý do                    | `200 { message: string }`               |
| GET    | `/api/v1/admin/content/sources`                | `search`, `page`, `size`                          | `200 PageResponse<ContentSourceDto>`    |
| POST   | `/api/v1/admin/content/sources`                | `CreateContentSourceRequest`                      | `201 ContentSourceDto`                  |

Hiện quản lý `WORD` và `DECK` trong module `VOCABULARY`. Bộ lọc gửi
`contentType`, không gửi `module`. Trạng thái revision có `DRAFT`, `IN_REVIEW`,
`APPROVED`, `REJECTED`, `PUBLISHED`, `ARCHIVED`; bộ lọc danh sách hiện không
gửi `REJECTED`.

`AdminContentItemDto`: `id`, `title`, `code`, `module`, `type`, `status`,
`versionNo`, `summary`, `author`, `reviewer`, `updatedAt`, `level`,
`latestRevisionId`. `reviewer`, `level`, `latestRevisionId` có thể `null`.
Thao tác revision dùng `latestRevisionId` từ item.

`AdminRevisionDto`: `revisionId`, `contentItemId`, `status`, `versionNo`,
`reviewNote`, `publishedAt`, `updatedAt`. `reviewNote` và `publishedAt` có thể
`null`.

- Word draft: `lemma`, `partOfSpeech`, `cefrLevel`, `meaningVi` bắt buộc;
  `definitionEn`, `ipa`, `examplesEn`, `examplesVi`, `sourceId`, `changeSummary`
  tùy chọn theo DTO. UI yêu cầu nguồn ngay khi tạo để tránh draft không đủ
  điều kiện xuất bản mà chưa có API bổ sung nguồn.
- Deck draft: `title` bắt buộc; `description`, `level`, `wordSenseIds`,
  `sourceId`, `changeSummary` tùy chọn theo DTO. UI yêu cầu ít nhất một nghĩa
  đã xuất bản và nguồn trích dẫn.
- Source: `title`, `sourceType` bắt buộc; các trường khác gồm `sourceUrl`,
  `author`, `licenseCode`, `licenseUrl`, `attribution`, `permissionNote`.
  UI hiện tạo nguồn `EXTERNAL` kèm giấy phép và ghi công.
- `ContentSourceDto`: `id`, `title`, `sourceType`, `sourceUrl`, `author`,
  `licenseCode`, `status`, `createdAt`.

Không có `/admin/content-items`, `/admin/content-items/{id}/status` hay
`/admin/import-jobs` trong controller hiện tại. Không tạo nút gọi các endpoint
này. Chưa có API lấy toàn bộ nội dung revision để biên tập hoặc thẩm định chi
tiết; bản xem hiện chỉ có metadata và summary.

Bộ chọn nghĩa dùng `GET /api/v1/vocabulary/words`, yêu cầu `LEARNER`.
Tài khoản chỉ có quyền admin không tự động có quyền học; UI khóa tạo deck
trong trường hợp này thay vì tự cấp vai trò. Backend cần API tra nghĩa dành
cho quản trị nếu muốn bỏ giới hạn này.

## Hệ thống — SYSTEM_ADMIN

| Method | Endpoint                                   | Input                                  | Response                             |
| ------ | ------------------------------------------ | -------------------------------------- | ------------------------------------ |
| GET    | `/api/v1/admin/system/feature-flags`       | Không có                               | `200 FeatureFlagDto[]`               |
| PUT    | `/api/v1/admin/system/feature-flags/{key}` | `{ enabled: boolean }`                 | `200 FeatureFlagDto`                 |
| GET    | `/api/v1/admin/system/quotas/storage`      | Không có                               | `200 StorageQuotaDto`                |
| GET    | `/api/v1/admin/system/quotas/ai`           | Không có                               | `200 AiQuotaMetricDto[]`             |
| GET    | `/api/v1/admin/system/audit-logs`          | `search`, `entityType`, `page`, `size` | `200 PageResponse<AuditLogEntryDto>` |

Quota tách hai API; không có endpoint gộp `/system/quotas`. Backend giữ alias
`/meters/storage` và `/meters/ai-quota`, client dùng `/quotas/*`.
`key` của cờ là chuỗi, không phải UUID.

- Flag: `key`, `name`, `description`, `enabled`, `category`, `updatedAt`.
- Storage: `bucket`, `usedBytes`, `maxBytes`, `usedFormatted`, `limitFormatted`,
  `percentUsed`, `filesCount`.
- AI: `provider`, `model`, `dailyTokenUsage`, `dailyTokenLimit`, `percentUsed`,
  `resetHours`. Phản hồi là mảng, không gộp thành một provider giả.
- Audit: `id`, `actorEmail`, `action`, `entityType`, `entityId`, `details`,
  `ipAddress`, `timestamp`, `severity`; `entityId`, `ipAddress` có thể `null`.

Mỗi phần có loading/lỗi/retry độc lập. Không dùng số liệu mẫu khi API lỗi.
Mỗi cờ chỉ có một mutation đang chờ; cập nhật UI theo DTO server xác nhận.

## Thông báo quản trị — SYSTEM_ADMIN

| Method | Endpoint                                     | Input                                                              |
| ------ | -------------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/v1/admin/notifications/deliveries`     | `status`, `channel`, `type`, `from`, `to`, `page`, `size`          |
| GET    | `/api/v1/admin/notifications/rules`          | Không có                                                           |
| GET    | `/api/v1/admin/notifications/rules/{ruleId}` | UUID                                                               |
| PUT    | `/api/v1/admin/notifications/rules/{ruleId}` | `{ enabled, minimumGapMinutes }`                                   |
| GET    | `/api/v1/admin/notifications/history`        | `userId`, `type`, `status`, `ruleId`, `from`, `to`, `page`, `size` |

Danh sách deliveries/history dùng `PageResponse`. Lưu quy tắc nhận lại DTO xác nhận từ server. Ngày lọc được gửi dạng thời điểm ISO; không giả lập lịch sử hoặc lần gửi khi API lỗi.

## Các luồng học tập dùng chung

| Luồng               | Endpoint chính                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Tổng quan           | `GET /api/v1/dashboard`                                                                                         |
| Ngữ pháp            | `GET /api/v1/grammar/topics`, `/topics/{topicId}/lessons`, `/lessons/{lessonId}`, `/topics/{topicId}/exercises` |
| Bộ luyện TOEIC      | `GET /api/v1/practice-sets`, `/practice-sets/{practiceSetId}`                                                   |
| Phiên luyện         | `POST /api/v1/attempts`, `GET /api/v1/attempts/{attemptId}`                                                     |
| Lưu đáp án          | `PUT /api/v1/attempts/{attemptId}/answers/{snapshotId}`                                                         |
| Nộp/kết quả         | `POST /api/v1/attempts/{attemptId}/submit`, `GET /api/v1/attempts/{attemptId}/results`                          |
| Lịch sử/thống kê    | `GET /api/v1/attempts`, `GET /api/v1/attempts/statistics/topics?category=GRAMMAR&view=allocation`               |
| Thông báo người học | `GET /api/v1/notifications`, `/notifications/unread-count`, `/notifications/reminders/history`                  |
| Đánh dấu đã đọc     | `POST /api/v1/notifications/{id}/read`, `/notifications/read-all` — `204`                                       |
| Tùy chọn thông báo  | `GET`, `PUT /api/v1/notifications/preferences`                                                                  |

Tạo lượt dùng nguồn `GRAMMAR_TOPIC` hoặc `PRACTICE_SET`, chế độ `PRACTICE`. Tạo/lưu gửi UUID `Idempotency-Key`; lưu gửi `{ selectedOptionId, expectedVersion }`. Khi mất phản hồi hoặc nhận `2xx` không đọc được DTO, thử lại cùng key và payload. `409` tải lại trạng thái server; chặn nộp khi còn đáp án chưa xác nhận. API kết quả chỉ thành công sau khi nộp; giao diện đang làm không render đáp án đúng, lời giải hoặc transcript. Kết quả TOEIC hiển thị số câu đúng/độ chính xác, không tự quy đổi sang thang 990.

Tùy chọn thông báo gồm `inAppEnabled`, `emailEnabled`, `contentNotificationsEnabled`, `dailyReminderTime`, `timezone`, `quietHoursStart`, `quietHoursEnd`. Giờ dùng `HH:mm`, múi giờ IANA; giờ yên lặng phải có đủ hai đầu và khác nhau. Route dùng query UUID và Suspense để tương thích static export; không thêm server runtime cho các màn mới.
