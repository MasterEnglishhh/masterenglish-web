import type { FeatureFlag, StorageQuota, AiQuotaMetric, AuditLogEntry } from "../types/system-policy";

export const mockFeatureFlags: FeatureFlag[] = [
  {
    key: "FLAG_AI_TUTOR_CONTEXT_v2",
    name: "AI Tutor Context v2 (Claude / GPT)",
    description: "Kích hoạt mô hình giải thích câu hỏi chuyên sâu và đối thoại ngữ cảnh khi làm bài.",
    enabled: true,
    category: "AI",
    updatedAt: "2026-11-04T02:00:00Z",
  },
  {
    key: "FLAG_R2_DIRECT_PRESIGNED_UPLOAD",
    name: "Tải file lên Cloudflare R2 qua Presigned URL",
    description: "Cho phép client upload trực tiếp file audio/hình ảnh mà không nghẽn bandwidth BE.",
    enabled: true,
    category: "STORAGE",
    updatedAt: "2026-10-30T10:00:00Z",
  },
  {
    key: "FLAG_REGISTRATION_RATE_LIMIT_STRICT",
    name: "Giới hạn đăng ký nghiêm ngặt (Strict Rate Limit)",
    description: "Tối đa 5 lượt đăng ký OTP trên mỗi địa chỉ IP trong 1 giờ để chống spam bot.",
    enabled: true,
    category: "AUTH",
    updatedAt: "2026-10-25T15:00:00Z",
  },
  {
    key: "FLAG_EXPERIMENTAL_SPACED_REPETITION_V2",
    name: "Thuật toán lặp lại ngắt quãng SM-2 cải tiến",
    description: "Tính toán khoảng cách ôn tập từ vựng thích ứng theo thời gian phản hồi của học viên.",
    enabled: false,
    category: "LEARNING",
    updatedAt: "2026-11-02T08:00:00Z",
  },
];

export const mockStorageQuota: StorageQuota = {
  bucket: "masterenglish-media-r2",
  usedBytes: 45980000000,
  maxBytes: 107374182400,
  usedFormatted: "42.8 GB",
  limitFormatted: "100 GB",
  percentUsed: 42.8,
  filesCount: 1420,
};

export const mockAiQuota: AiQuotaMetric = {
  provider: "Anthropic / OpenAI Enterprise",
  model: "claude-3-5-sonnet & gpt-4o-mini",
  dailyTokenUsage: 1420500,
  dailyTokenLimit: 5000000,
  percentUsed: 28.4,
  resetHours: 6,
};

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "log-101",
    actorEmail: "admin@masterenglish.edu.vn",
    action: "UPDATE_FEATURE_FLAG",
    entityType: "FEATURE_FLAG",
    entityId: "FLAG_AI_TUTOR_CONTEXT_v2",
    details: "Đổi trạng thái từ false -> true (Production Enabled)",
    ipAddress: "14.238.12.90",
    timestamp: "2026-11-04T12:30:15Z",
    severity: "INFO",
  },
  {
    id: "log-102",
    actorEmail: "admin@masterenglish.edu.vn",
    action: "LOCK_USER_ACCOUNT",
    entityType: "USER",
    entityId: "usr-04",
    details: "Khóa tài khoản suspicious.hacker@proton.me do vi phạm rate limit OTP",
    ipAddress: "14.238.12.90",
    timestamp: "2026-11-04T11:15:00Z",
    severity: "WARNING",
  },
  {
    id: "log-103",
    actorEmail: "editor.thu@masterenglish.edu.vn",
    action: "PUBLISH_CONTENT_REVISION",
    entityType: "CONTENT",
    entityId: "cnt-01",
    details: "Xuất bản phiên bản v2 cho bộ flashcard Essential Business Vocabulary",
    ipAddress: "118.69.182.44",
    timestamp: "2026-11-03T16:45:22Z",
    severity: "INFO",
  },
  {
    id: "log-104",
    actorEmail: "system.security@masterenglish.edu.vn",
    action: "REVOKE_ALL_SESSIONS",
    entityType: "SESSION",
    entityId: "usr-04",
    details: "Thu hồi toàn bộ 3 refresh tokens đang hoạt động của người dùng bị khóa",
    ipAddress: "127.0.0.1",
    timestamp: "2026-11-03T11:15:02Z",
    severity: "CRITICAL",
  },
  {
    id: "log-105",
    actorEmail: "admin@masterenglish.edu.vn",
    action: "ASSIGN_ROLE",
    entityType: "ROLE",
    entityId: "usr-02",
    details: "Cấp quyền CONTENT_ADMIN cho tài khoản editor.thu@masterenglish.edu.vn",
    ipAddress: "14.238.12.90",
    timestamp: "2026-11-01T08:00:00Z",
    severity: "INFO",
  },
];
