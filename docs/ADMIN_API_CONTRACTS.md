# ĐẶC TẢ GIAO DIỆN API PHÂN HỆ QUẢN TRỊ (ADMIN API CONTRACTS)

**Hệ thống**: MasterEnglish E-Learning Platform  
**Phân hệ**: Admin Portal (`/admin`, `/admin/users`, `/admin/content`, `/admin/system`)  
**Phiên bản API**: `v1`  
**Định dạng**: JSON (RFC 8259), Tiêu chuẩn lỗi RFC 7807 (Problem Details)  
**Xác thực**: Same-Origin HTTP-Only Cookie (`access_token`, `refresh_token`) + Header `X-XSRF-TOKEN`  
**Ngày cập nhật**: 04/11/2026  

---

## 1. Màn hình Tổng quan (`/admin`)

### 1.1. Lấy chỉ số KPI & Nhật ký hoạt động gần đây
- **Mục đích**: Hiển thị 4 thẻ KPI đo lường và dòng thời gian các tác vụ quản trị vừa thực hiện.
- **Endpoint**: `GET /api/v1/admin/overview`
- **Quyền hạn**: `SYSTEM_ADMIN`, `CONTENT_ADMIN`
- **Request Headers**:
  - `Cookie: access_token=...`
- **Query Parameters**:
  - `timeRange` *(string, tùy chọn)*: `24h`, `7d` (mặc định), `30d`.
- **Response (200 OK)**:
```json
{
  "kpis": [
    {
      "id": "total-users",
      "title": "Người dùng đăng ký",
      "value": "14,820",
      "subValue": "1,240 trực tuyến",
      "changePercent": 12.5,
      "trendDirection": "up",
      "trendText": "+12.5% so với tuần trước",
      "iconName": "users"
    },
    {
      "id": "content-bank",
      "title": "Ngân hàng nội dung",
      "value": "3,450",
      "subValue": "128 chờ duyệt",
      "changePercent": 8.2,
      "trendDirection": "up",
      "trendText": "+8.2% câu hỏi & từ vựng mới",
      "iconName": "book-open"
    },
    {
      "id": "storage-r2",
      "title": "Dung lượng Cloudflare R2",
      "value": "42.8 GB",
      "subValue": "/ 100 GB định mức",
      "changePercent": 42.8,
      "trendDirection": "neutral",
      "trendText": "42.8% tổng bộ nhớ",
      "iconName": "database"
    },
    {
      "id": "security-health",
      "title": "Trạng thái hệ thống",
      "value": "99.98%",
      "subValue": "0 cảnh báo rủi ro",
      "trendDirection": "neutral",
      "trendText": "Toàn bộ API hoạt động ổn định",
      "iconName": "shield-check"
    }
  ],
  "activities": [
    {
      "id": "act-1",
      "actorEmail": "admin@masterenglish.edu.vn",
      "actorName": "Lê Hoàng Long",
      "action": "Gán vai trò CONTENT_ADMIN",
      "target": "nguyen.van.a@gmail.com",
      "module": "IDENTITY",
      "timestamp": "2026-11-04T12:30:00Z",
      "status": "SUCCESS"
    },
    {
      "id": "act-2",
      "actorEmail": "editor@masterenglish.edu.vn",
      "actorName": "Trần Minh Thư",
      "action": "Xuất bản bài học ngữ pháp",
      "target": "Lesson: Inversion in Advanced English",
      "module": "CONTENT",
      "timestamp": "2026-11-04T11:45:00Z",
      "status": "SUCCESS"
    }
  ]
}
```

---

## 2. Màn hình Người dùng & Phân quyền (`/admin/users`)

### 2.1. Tra cứu danh sách tài khoản (Tìm kiếm, Lọc, Phân trang)
- **Mục đích**: Lấy danh sách tài khoản theo từ khóa, vai trò và trạng thái khóa.
- **Endpoint**: `GET /api/v1/admin/users`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Query Parameters**:
  - `search` *(string, tùy chọn)*: Email hoặc tên hiển thị.
  - `role` *(string, tùy chọn)*: `ALL` (mặc định), `SYSTEM_ADMIN`, `CONTENT_ADMIN`, `LEARNER`.
  - `status` *(string, tùy chọn)*: `ALL` (mặc định), `ACTIVE`, `LOCKED`, `PENDING_VERIFICATION`.
  - `page` *(int, tùy chọn)*: Số trang (bắt đầu từ 0, mặc định 0).
  - `size` *(int, tùy chọn)*: Số bản ghi mỗi trang (mặc định 10).
- **Response (200 OK)**:
```json
{
  "content": [
    {
      "id": "usr-01",
      "email": "admin@masterenglish.edu.vn",
      "displayName": "Lê Hoàng Long",
      "firstName": "Long",
      "lastName": "Lê Hoàng",
      "phone": "0901234567",
      "status": "ACTIVE",
      "roles": ["SYSTEM_ADMIN", "CONTENT_ADMIN"],
      "authVersion": 3,
      "activeSessionsCount": 2,
      "createdAt": "2026-08-15T08:00:00Z",
      "lastLoginAt": "2026-11-04T15:20:00Z",
      "lockReason": null,
      "lockedUntil": null
    },
    {
      "id": "usr-04",
      "email": "suspicious.hacker@proton.me",
      "displayName": "Anonymous User",
      "firstName": null,
      "lastName": null,
      "phone": null,
      "status": "LOCKED",
      "roles": ["LEARNER"],
      "authVersion": 5,
      "activeSessionsCount": 0,
      "createdAt": "2026-10-02T03:12:00Z",
      "lastLoginAt": "2026-11-01T04:10:00Z",
      "lockReason": "Vượt quá 10 lần xác thực OTP thất bại trong 5 phút",
      "lockedUntil": "2026-12-31T23:59:59Z"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 2,
  "totalPages": 1
}
```

### 2.2. Gán hoặc Thu hồi vai trò người dùng (Assign Roles)
- **Mục đích**: Điều chỉnh danh sách vai trò của một tài khoản.
- **Endpoint**: `PUT /api/v1/admin/users/{userId}/roles`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Request Headers**:
  - `Content-Type: application/json`
  - `X-XSRF-TOKEN: [csrf_token]`
- **Request Body**:
```json
{
  "roles": ["CONTENT_ADMIN", "LEARNER"]
}
```
- **Response (200 OK)**:
```json
{
  "userId": "usr-01",
  "roles": ["CONTENT_ADMIN", "LEARNER"],
  "authVersion": 4,
  "updatedAt": "2026-11-04T16:00:00Z"
}
```
- **Lỗi nghiệp vụ**:
  - `400 Bad Request`: Mảng `roles` rỗng (người dùng bắt buộc phải có ít nhất 1 vai trò).
  - `403 Forbidden`: Admin tự tước bỏ vai trò `SYSTEM_ADMIN` của chính mình hoặc hạ quyền của Admin duy nhất còn lại trên hệ thống.

### 2.3. Khóa hoặc Mở khóa tài khoản (Lock / Unlock User)
- **Mục đích**: Chặn người dùng vi phạm đăng nhập hoặc mở khóa khi khiếu nại thành công.
- **Endpoint**: `POST /api/v1/admin/users/{userId}/lock`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Request Headers**:
  - `Content-Type: application/json`
  - `X-XSRF-TOKEN: [csrf_token]`
- **Request Body (Khóa tài khoản)**:
```json
{
  "status": "LOCKED",
  "reason": "Vi phạm quy tắc an toàn / Nghi vấn tấn công brute-force",
  "lockedUntil": "2026-12-31T23:59:59Z"
}
```
- **Request Body (Mở khóa tài khoản)**:
```json
{
  "status": "ACTIVE"
}
```
- **Response (200 OK)**:
```json
{
  "userId": "usr-04",
  "status": "LOCKED",
  "lockReason": "Vi phạm quy tắc an toàn / Nghi vấn tấn công brute-force",
  "lockedUntil": "2026-12-31T23:59:59Z",
  "revokedSessionsCount": 2,
  "authVersion": 6
}
```

### 2.4. Thu hồi toàn bộ phiên đăng nhập tức thì (Revoke Sessions)
- **Mục đích**: Ép người dùng đăng xuất ngay lập tức khỏi mọi thiết bị mà không cần khóa tài khoản.
- **Endpoint**: `POST /api/v1/admin/users/{userId}/revoke-sessions`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Request Headers**:
  - `X-XSRF-TOKEN: [csrf_token]`
- **Response (200 OK)**:
```json
{
  "userId": "usr-01",
  "revokedCount": 2,
  "authVersion": 5
}
```

---

## 3. Màn hình Quản trị Nội dung (`/admin/content`)

### 3.1. Danh sách nội dung học thuật
- **Mục đích**: Lấy danh mục bài học, bộ flashcard, đề thi theo module và trạng thái xuất bản.
- **Endpoint**: `GET /api/v1/admin/content-items`
- **Quyền hạn**: `CONTENT_ADMIN`, `SYSTEM_ADMIN`
- **Query Parameters**:
  - `search` *(string, tùy chọn)*: Tiêu đề hoặc mã code bài học.
  - `module` *(string, tùy chọn)*: `ALL`, `VOCABULARY`, `GRAMMAR`, `QUESTION_BANK`, `TOEIC`.
  - `status` *(string, tùy chọn)*: `ALL`, `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`.
  - `page` *(int)*: Số trang.
  - `size` *(int)*: Số bản ghi.
- **Response (200 OK)**:
```json
{
  "content": [
    {
      "id": "cnt-01",
      "title": "Oxford 3000: Essential Business Vocabulary",
      "code": "VOCAB-BUS-01",
      "module": "VOCABULARY",
      "type": "FLASHCARD_DECK",
      "status": "PUBLISHED",
      "versionNo": 2,
      "summary": "Bộ 50 flashcard thuật ngữ kinh doanh: negotiation, dividend...",
      "author": "Trần Minh Thư",
      "reviewer": "Lê Hoàng Long",
      "level": "B2",
      "updatedAt": "2026-11-01T09:30:00Z"
    },
    {
      "id": "cnt-03",
      "title": "TOEIC Full Practice Test 2026 - Simulation Set #04",
      "code": "TOEIC-TEST-04",
      "module": "TOEIC",
      "type": "PRACTICE_SET",
      "status": "IN_REVIEW",
      "versionNo": 1,
      "summary": "Trọn bộ 200 câu hỏi Listening (Part 1-4) và Reading (Part 5-7)",
      "author": "Trần Minh Thư",
      "reviewer": "Lê Hoàng Long",
      "level": "TOEIC 750",
      "updatedAt": "2026-11-03T11:00:00Z"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 2,
  "totalPages": 1
}
```

### 3.2. Chuyển đổi trạng thái quy trình xuất bản (Change Revision Status)
- **Mục đích**: Thẩm định bài học: Duyệt (`PUBLISHED`), gửi xét duyệt (`IN_REVIEW`), hoặc trả về (`DRAFT`).
- **Endpoint**: `POST /api/v1/admin/content-items/{id}/status`
- **Quyền hạn**: `CONTENT_ADMIN`, `SYSTEM_ADMIN`
- **Request Headers**:
  - `Content-Type: application/json`
  - `X-XSRF-TOKEN: [csrf_token]`
- **Request Body**:
```json
{
  "status": "PUBLISHED",
  "note": "Đã đối soát đạt chuẩn chất lượng học thuật và bản quyền media"
}
```
- **Response (200 OK)**:
```json
{
  "id": "cnt-03",
  "status": "PUBLISHED",
  "versionNo": 2,
  "currentPublishedRevisionId": "rev-uuid-03",
  "updatedAt": "2026-11-04T16:20:00Z"
}
```

### 3.3. Tải lên tệp nạp hàng loạt (Import Jobs Staging)
- **Mục đích**: Nạp file CSV/JSON từ vựng hoặc câu hỏi vào bảng tạm để kiểm tra thử nghiệm (Dry-Run).
- **Endpoint**: `POST /api/v1/admin/import-jobs`
- **Quyền hạn**: `CONTENT_ADMIN`, `SYSTEM_ADMIN`
- **Request**: `multipart/form-data`
  - `file`: File `.csv` hoặc `.json`
  - `module`: `VOCABULARY` hoặc `QUESTION_BANK`
- **Response (201 Created)**:
```json
{
  "jobId": "job-101",
  "fileName": "vocab_business_batch1.csv",
  "totalRows": 150,
  "validRows": 148,
  "errorRows": 2,
  "status": "PREVIEW_READY",
  "errorReportUrl": "/api/v1/admin/import-jobs/job-101/errors"
}
```

---

## 4. Màn hình Chính sách & Nhật ký (`/admin/system`)

### 4.1. Lấy danh sách Cờ tính năng động (Feature Flags)
- **Endpoint**: `GET /api/v1/admin/system/feature-flags`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Response (200 OK)**:
```json
[
  {
    "key": "FLAG_AI_TUTOR_CONTEXT_v2",
    "name": "AI Tutor Context v2 (Claude / GPT)",
    "description": "Kích hoạt mô hình giải thích câu hỏi chuyên sâu và đối thoại ngữ cảnh khi làm bài.",
    "enabled": true,
    "category": "AI",
    "updatedAt": "2026-11-04T02:00:00Z"
  },
  {
    "key": "FLAG_R2_DIRECT_PRESIGNED_UPLOAD",
    "name": "Tải file lên Cloudflare R2 qua Presigned URL",
    "description": "Cho phép client upload trực tiếp file audio/hình ảnh mà không nghẽn bandwidth BE.",
    "enabled": true,
    "category": "STORAGE",
    "updatedAt": "2026-10-30T10:00:00Z"
  }
]
```

### 4.2. Bật / Tắt Cờ tính năng (Toggle Feature Flag)
- **Endpoint**: `PUT /api/v1/admin/system/feature-flags/{key}`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Request Headers**:
  - `Content-Type: application/json`
  - `X-XSRF-TOKEN: [csrf_token]`
- **Request Body**:
```json
{
  "enabled": false
}
```
- **Response (200 OK)**:
```json
{
  "key": "FLAG_AI_TUTOR_CONTEXT_v2",
  "enabled": false,
  "updatedAt": "2026-11-04T16:25:00Z"
}
```

### 4.3. Giám sát Định mức Lưu trữ R2 & Hạn ngạch AI Token
- **Endpoint**: `GET /api/v1/admin/system/quotas`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Response (200 OK)**:
```json
{
  "storage": {
    "bucket": "masterenglish-media-r2",
    "usedBytes": 45980000000,
    "maxBytes": 107374182400,
    "usedFormatted": "42.8 GB",
    "limitFormatted": "100 GB",
    "percentUsed": 42.8,
    "filesCount": 1420
  },
  "ai": {
    "provider": "Anthropic / OpenAI Enterprise",
    "model": "claude-3-5-sonnet & gpt-4o-mini",
    "dailyTokenUsage": 1420500,
    "dailyTokenLimit": 5000000,
    "percentUsed": 28.4,
    "resetHours": 6
  }
}
```

### 4.4. Truy vấn Sổ cái Kiểm toán Bất biến (Audit Logs Ledger)
- **Endpoint**: `GET /api/v1/admin/system/audit-logs`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Query Parameters**:
  - `search` *(string)*: Từ khóa tìm kiếm trong email, hành động, chi tiết.
  - `entityType` *(string)*: `ALL`, `USER`, `ROLE`, `CONTENT`, `FEATURE_FLAG`, `SESSION`.
  - `page` *(int)*: Số trang.
  - `size` *(int)*: Số bản ghi.
- **Response (200 OK)**:
```json
{
  "content": [
    {
      "id": "log-101",
      "actorEmail": "admin@masterenglish.edu.vn",
      "action": "UPDATE_FEATURE_FLAG",
      "entityType": "FEATURE_FLAG",
      "entityId": "FLAG_AI_TUTOR_CONTEXT_v2",
      "details": "Đổi trạng thái từ false -> true (Production Enabled)",
      "ipAddress": "14.238.12.90",
      "timestamp": "2026-11-04T12:30:15Z",
      "severity": "INFO"
    },
    {
      "id": "log-102",
      "actorEmail": "admin@masterenglish.edu.vn",
      "action": "LOCK_USER_ACCOUNT",
      "entityType": "USER",
      "entityId": "usr-04",
      "details": "Khóa tài khoản suspicious.hacker@proton.me do vi phạm rate limit OTP",
      "ipAddress": "14.238.12.90",
      "timestamp": "2026-11-04T11:15:00Z",
      "severity": "WARNING"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 2,
  "totalPages": 1
}
```
