# ĐẶC TẢ GIAO DIỆN API PHÂN HỆ QUẢN TRỊ (ADMIN API CONTRACTS)

**Hệ thống**: MasterEnglish E-Learning Platform  
**Phân hệ**: Admin Portal (`/admin`, `/admin/users`, `/admin/content`, `/admin/system`)  
**Phiên bản API**: `v1`  
**Định dạng**: JSON (RFC 8259), Tiêu chuẩn lỗi RFC 7807 (Problem Details)  
**Xác thực**: Same-Origin HTTP-Only Cookie (`access_token`, `refresh_token`) + Header `X-XSRF-TOKEN`  
**Ngày cập nhật**: 19/11/2026 (Đồng bộ theo backend `masterenglish-api/docs/admin/CONTRACT.md`)

---

## 1. Màn hình Tổng quan (`/admin`)

*Yêu cầu quyền:* `SYSTEM_ADMIN` hoặc `CONTENT_ADMIN`

### 1.1. Lấy danh sách chỉ số KPI (`GET /api/v1/admin/overview/kpis`)
- **Mục đích**: Hiển thị 4 thẻ KPI đo lường đầu trang Dashboard. Không hiển thị số liệu tăng trưởng hay trạng thái sức khỏe giả:
  - `total-users` và `content-bank`: `changePercent` và `trendText` trả về `null`.
  - `storage-r2`: giữ số liệu đo đạc thực tế từ Cloudflare R2 (`storage.percentUsed()`).
  - `security-health`: trả về `value: "Chưa có dữ liệu"`, `subValue: null`, `changePercent: null`, `trendText: null`.
- **Response (200 OK)**:
```json
[
  {
    "id": "total-users",
    "title": "Người dùng đăng ký",
    "value": "14,820",
    "subValue": "1,240 hoạt động",
    "changePercent": null,
    "trendText": null,
    "trendDirection": "neutral",
    "iconName": "users"
  },
  {
    "id": "content-bank",
    "title": "Ngân hàng nội dung",
    "value": "3,450",
    "subValue": "128 chờ duyệt",
    "changePercent": null,
    "trendText": null,
    "trendDirection": "neutral",
    "iconName": "book-open"
  },
  {
    "id": "storage-r2",
    "title": "Dung lượng Cloudflare R2",
    "value": "42.8 GB",
    "subValue": "/ 100 GB định mức",
    "changePercent": 42.8,
    "trendText": "42.8% tổng bộ nhớ",
    "trendDirection": "neutral",
    "iconName": "database"
  },
  {
    "id": "security-health",
    "title": "Trạng thái hệ thống",
    "value": "Chưa có dữ liệu",
    "subValue": null,
    "changePercent": null,
    "trendText": null,
    "trendDirection": "neutral",
    "iconName": "shield-check"
  }
]
```

### 1.2. Lấy dòng nhật ký hoạt động gần đây (`GET /api/v1/admin/overview/activities`)
- **Mục đích**: Hiển thị dòng hoạt động quản trị gần nhất.
- **Query Parameters**:
  - `limit` *(integer, mặc định 10, tối đa 50)*.
- **Response (200 OK)**:
```json
[
  {
    "id": "7b0d876a-5c20-41bf-9e12-bdf94291f0c2",
    "actorEmail": "admin@masterenglish.edu.vn",
    "actorName": "Admin",
    "action": "USER_ROLES_UPDATED",
    "target": "USER",
    "module": "IDENTITY",
    "timestamp": "2026-11-10T14:30:00Z",
    "status": "SUCCESS"
  }
]
```

---

## 2. Màn hình Người dùng & Phân quyền (`/admin/users`)

*Yêu cầu quyền:* `SYSTEM_ADMIN`

### 2.1. Tra cứu danh sách tài khoản (`GET /api/v1/admin/users`)
- **Query Parameters**:
  - `search` *(string, tùy chọn)*: Email hoặc tên người dùng.
  - `role` *(string, tùy chọn)*: `LEARNER`, `CONTENT_ADMIN`, `SYSTEM_ADMIN`.
  - `status` *(string, tùy chọn)*: `ACTIVE`, `LOCKED`, `PENDING_VERIFICATION`, `DISABLED`.
  - `page` *(int, bắt đầu từ 0, mặc định 0)*.
  - `size` *(int, mặc định 20, tối đa 100)*.
  - `sortBy` *(string, mặc định "createdAt")*: `createdAt`, `email`, `id`.
  - `sortDirection` *(string, mặc định "desc")*: `asc`, `desc`.
- **Response (200 OK)**:
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "learner@example.com",
      "displayName": "Nguyễn Văn A",
      "firstName": "A",
      "lastName": "Nguyễn Văn",
      "phone": "0987654321",
      "status": "ACTIVE",
      "roles": ["LEARNER"],
      "authVersion": 1,
      "activeSessionsCount": 2,
      "createdAt": "2026-10-01T08:00:00Z",
      "lastLoginAt": null,
      "lockReason": null,
      "lockedUntil": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 1,
  "totalPages": 1,
  "hasNext": false
}
```

### 2.2. Xem chi tiết người dùng (`GET /api/v1/admin/users/{id}`)
- **Response (200 OK)**: `AdminUserDto` (cùng cấu trúc bản ghi người dùng trong danh sách).

### 2.3. Gán hoặc thu hồi vai trò (`PUT /api/v1/admin/users/{id}/roles`)
- **Request Headers**: `X-XSRF-TOKEN: ...`
- **Request Body**:
```json
{
  "roles": ["LEARNER", "CONTENT_ADMIN"]
}
```
- **Response (200 OK)**: `AdminUserDto`.

### 2.4. Khóa tài khoản (`POST /api/v1/admin/users/{id}/lock`)
- **Request Headers**: `X-XSRF-TOKEN: ...`
- **Request Body**:
```json
{
  "reason": "Vi phạm điều khoản sử dụng",
  "lockedUntil": "2026-12-31T23:59:59Z"
}
```
- **Response (200 OK)**: `AdminUserDto`.

### 2.5. Mở khóa tài khoản (`POST /api/v1/admin/users/{id}/unlock`)
- **Request Headers**: `X-XSRF-TOKEN: ...`
- **Request Body**: Không có.
- **Response (200 OK)**: `AdminUserDto`.

### 2.6. Thu hồi toàn bộ phiên đăng nhập (`POST /api/v1/admin/users/{id}/revoke-sessions`)
- **Request Headers**: `X-XSRF-TOKEN: ...`
- **Response (200 OK)**:
```json
{
  "message": "Đã thu hồi toàn bộ phiên đăng nhập của người dùng."
}
```

---

## 3. Màn hình Quản trị Nội dung (`/admin/content`)

*Yêu cầu quyền:* `CONTENT_ADMIN` hoặc `SYSTEM_ADMIN`

### 3.1. Danh sách nội dung (`GET /api/v1/admin/content/items`)
- **Query Parameters**: `search`, `contentType` (`WORD`, `DECK`, `ALL`), `status` (`DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, `ALL`), `page`, `size`.
- **Response (200 OK)**: `PageResponse<AdminContentItemDto>`.

### 3.2. Tạo bản thảo từ vựng mới (`POST /api/v1/admin/content/words`)
- **Request Headers**: `X-XSRF-TOKEN: ...`
- **Request Body**: `CreateWordDraftRequest`.
- **Response (201 Created)**: `AdminContentItemDto`.

### 3.3. Tạo bản thảo bộ thẻ mới (`POST /api/v1/admin/content/decks`)
- **Request Headers**: `X-XSRF-TOKEN: ...`
- **Request Body**: `CreateDeckDraftRequest`.
- **Response (201 Created)**: `AdminContentItemDto`.

### 3.4. Vòng đời thẩm định & xuất bản phiên bản nội dung
- **Gửi duyệt**: `POST /api/v1/admin/content/revisions/{id}/submit` -> `200 OK` (`AdminRevisionDto`).
- **Phê duyệt**: `POST /api/v1/admin/content/revisions/{id}/approve` -> Body `{ reviewNote?: string }` -> `200 OK` (`AdminRevisionDto`).
- **Từ chối**: `POST /api/v1/admin/content/revisions/{id}/reject` -> Body `{ reviewNote: string }` (bắt buộc) -> `200 OK` (`AdminRevisionDto`).
- **Xuất bản**: `POST /api/v1/admin/content/revisions/{id}/publish` -> `200 OK` (`AdminRevisionDto`).
- **Lưu trữ / ẩn nội dung**: `POST /api/v1/admin/content/items/{id}/archive` -> Body `{ reason?: string }` -> `200 OK` (`{ message: string }`).

### 3.5. Quản lý nguồn trích dẫn & bản quyền
- **Danh sách nguồn**: `GET /api/v1/admin/content/sources` -> `search`, `page`, `size` -> `200 OK` (`PageResponse<ContentSourceDto>`).
- **Tạo nguồn mới**: `POST /api/v1/admin/content/sources` -> Body `CreateContentSourceRequest` -> `201 Created` (`ContentSourceDto`).

---

## 4. Màn hình Hệ thống & Chính sách (`/admin/system`)

*Yêu cầu quyền:* `SYSTEM_ADMIN`

### 4.1. Cờ tính năng (`GET /api/v1/admin/system/feature-flags`)
- **Mô tả**: Xem danh sách cờ tính năng ở chế độ chỉ xem (read-only). Trạng thái lưu hiện chưa phản ánh hoạt động thực tế hoặc điều khiển runtime.
- **Response (200 OK)**: `List<FeatureFlagDto>`.

### 4.2. Cập nhật cờ tính năng (`PUT /api/v1/admin/system/feature-flags/{key}`)
- **Mô tả**: Bị từ chối. Mọi yêu cầu PUT với key đã biết đều bị chặn với mã `409 Conflict`, không mutation vào database và không ghi audit log. Key không tồn tại trả về `404 Not Found`.

### 4.3. Định mức lưu trữ Cloudflare R2 (`GET /api/v1/admin/system/quotas/storage`)
- **Response (200 OK)**: `StorageQuotaDto` (`bucket`, `usedBytes`, `maxBytes`, `usedFormatted`, `limitFormatted`, `percentUsed`, `filesCount`).

### 4.4. Hạn ngạch AI Token (`GET /api/v1/admin/system/quotas/ai`)
- **Mô tả**: Trả về mảng rỗng `[]` do chưa tích hợp dịch vụ AI thực tế. Giao diện hiển thị trạng thái chờ dữ liệu, không render tiến trình giả hoặc token ảo.
- **Response (200 OK)**: `[]`.

### 4.5. Sổ cái kiểm toán hệ thống (`GET /api/v1/admin/system/audit-logs`)
- **Query Parameters**:
  - `search` *(string, tùy chọn)*.
  - `entityType` *(string, tùy chọn)*: `ALL`, `USER`, `WORD`, `DECK`, `CONTENT_REVISION`, `FEATURE_FLAG`. Thao tác vai trò (`ROLE`) và phiên (`SESSION`) được ghi nhận dưới đối tượng `USER`.
  - `page` *(int, bắt đầu từ 0)*.
  - `size` *(int)*.
- **Response (200 OK)**: `PageResponse<AuditLogEntryDto>`.
