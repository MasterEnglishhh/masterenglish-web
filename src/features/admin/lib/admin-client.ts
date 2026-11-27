import {
  requestJson,
  type HttpOutcome,
  type PageResponse,
} from "../../../lib/http.ts";
import { isPageResponse } from "../../../lib/api-validation.ts";
import {
  isAdminKpi,
  isAdminMessage,
  isAdminRevision,
  isAdminUser,
  isAiQuotaMetric,
  isAuditLogEntry,
  isContentItem,
  isFeatureFlag,
  isRecentActivity,
  isStorageQuota,
} from "./admin-validation.ts";
import type { AdminKPI, RecentActivity } from "../types/admin";
import type {
  AdminUser,
  UserFilterState,
  UserRole,
} from "../types/user-management";
import type {
  ContentFilterState,
  ContentItem,
  AdminRevisionDto,
  CreateWordDraftPayload,
  CreateDeckDraftPayload,
} from "../types/content-ops";
import type {
  AiQuotaMetric,
  AuditLogEntry,
  FeatureFlag,
  StorageQuota,
} from "../types/system-policy";

export interface AdminClientError {
  code: string;
  message: string;
  status: number;
  retryable?: boolean;
}

export type AdminResult<T> =
  { success: true; data: T } | { success: false; error: AdminClientError };

export type { PageResponse };
export type {
  AdminRevisionDto,
  CreateWordDraftPayload,
  CreateDeckDraftPayload,
} from "../types/content-ops";

function toResult<T>(outcome: HttpOutcome<T>): AdminResult<T> {
  if (outcome.ok) return { success: true, data: outcome.data };
  const { reason, status, problem } = outcome;
  const error = (
    code: string,
    message: string,
    retryable?: boolean
  ): AdminResult<T> => ({
    success: false,
    error: {
      code,
      message,
      status,
      ...(retryable === undefined ? {} : { retryable }),
    },
  });

  if (reason === "csrf")
    return error(
      "CSRF_UNAVAILABLE",
      "Không thể xác nhận phiên bảo mật. Vui lòng thử lại.",
      true
    );
  if (reason === "session")
    return error(
      "UNAUTHENTICATED",
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
    );
  if (reason === "network")
    return error(
      "NETWORK_ERROR",
      "Lỗi kết nối máy chủ. Vui lòng kiểm tra đường truyền.",
      true
    );
  if (problem?.code === "INVALID_RESPONSE")
    return error(
      "INVALID_RESPONSE",
      "Máy chủ trả dữ liệu không đúng định dạng.",
      true
    );
  if (status >= 500)
    return error(
      "SERVICE_ERROR",
      "Dịch vụ quản trị đang gián đoạn. Vui lòng thử lại sau.",
      true
    );
  return error(
    problem?.code ?? "SERVICE_ERROR",
    problem?.detail ??
      problem?.message ??
      `Yêu cầu không thành công (${status}).`
  );
}

export async function requestWithAuth<T>(
  path: string,
  options?: Parameters<typeof requestJson>[1]
): Promise<AdminResult<T>> {
  return toResult(await requestJson<T>(path, options));
}

/* ==================== OVERVIEW APIS ==================== */

export function fetchAdminKpis(): Promise<AdminResult<AdminKPI[]>> {
  return requestWithAuth<AdminKPI[]>("/api/v1/admin/overview/kpis", {
    validate: (data) => Array.isArray(data) && data.every(isAdminKpi),
  });
}

export function fetchRecentActivities(
  limit = 10
): Promise<AdminResult<RecentActivity[]>> {
  return requestWithAuth<RecentActivity[]>(
    `/api/v1/admin/overview/activities?limit=${limit}`,
    { validate: (data) => Array.isArray(data) && data.every(isRecentActivity) }
  );
}

/* ==================== USERS APIS ==================== */

export function fetchAdminUsers(
  filter: UserFilterState
): Promise<AdminResult<PageResponse<AdminUser>>> {
  const params = new URLSearchParams();
  if (filter.search && filter.search.trim()) {
    params.set("search", filter.search.trim());
  }
  if (filter.role && filter.role !== "ALL") {
    params.set("role", filter.role);
  }
  if (filter.status && filter.status !== "ALL") {
    params.set("status", filter.status);
  }
  // Spring Pageable is 0-indexed; Frontend state is 1-indexed
  const page0 = Math.max(0, (filter.page || 1) - 1);
  params.set("page", page0.toString());
  params.set("size", (filter.pageSize || 10).toString());

  return requestWithAuth<PageResponse<AdminUser>>(
    `/api/v1/admin/users?${params.toString()}`,
    { validate: (data) => isPageResponse(data, isAdminUser) }
  );
}

export function fetchAdminUser(id: string): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(
    `/api/v1/admin/users/${encodeURIComponent(id)}`,
    {
      validate: (data) =>
        isAdminUser(data) && data.id.toLowerCase() === id.toLowerCase(),
    }
  );
}

export function updateAdminUserRoles(
  id: string,
  roles: UserRole[]
): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(
    `/api/v1/admin/users/${encodeURIComponent(id)}/roles`,
    {
      method: "PUT",
      body: { roles },
      validate: isAdminUser,
    }
  );
}

export function lockAdminUser(
  id: string,
  reason: string,
  lockedUntil?: string | null
): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(
    `/api/v1/admin/users/${encodeURIComponent(id)}/lock`,
    {
      method: "POST",
      body: { reason, lockedUntil: lockedUntil || null },
      validate: isAdminUser,
    }
  );
}

export function unlockAdminUser(id: string): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(
    `/api/v1/admin/users/${encodeURIComponent(id)}/unlock`,
    {
      method: "POST",
      validate: isAdminUser,
    }
  );
}

export function revokeAdminUserSessions(
  id: string
): Promise<AdminResult<{ message: string }>> {
  return requestWithAuth<{ message: string }>(
    `/api/v1/admin/users/${encodeURIComponent(id)}/revoke-sessions`,
    {
      method: "POST",
      validate: isAdminMessage,
    }
  );
}

/* ==================== CONTENT OPS APIS ==================== */

export function fetchContentItems(
  filter: ContentFilterState
): Promise<AdminResult<PageResponse<ContentItem>>> {
  const params = new URLSearchParams();
  if (filter.search && filter.search.trim()) {
    params.set("search", filter.search.trim());
  }
  if (filter.contentType && filter.contentType !== "ALL") {
    params.set("contentType", filter.contentType);
  }
  if (filter.status && filter.status !== "ALL") {
    params.set("status", filter.status);
  }
  const page0 = Math.max(0, (filter.page || 1) - 1);
  params.set("page", page0.toString());
  params.set("size", (filter.pageSize || 10).toString());

  return requestWithAuth<PageResponse<ContentItem>>(
    `/api/v1/admin/content/items?${params.toString()}`,
    { validate: (data) => isPageResponse(data, isContentItem) }
  );
}

export function createWordDraft(
  payload: CreateWordDraftPayload
): Promise<AdminResult<ContentItem>> {
  return requestWithAuth<ContentItem>("/api/v1/admin/content/words", {
    method: "POST",
    body: payload,
    validate: isContentItem,
  });
}

export function createDeckDraft(
  payload: CreateDeckDraftPayload
): Promise<AdminResult<ContentItem>> {
  return requestWithAuth<ContentItem>("/api/v1/admin/content/decks", {
    method: "POST",
    body: payload,
    validate: isContentItem,
  });
}

export function submitContentRevision(
  revisionId: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(
    `/api/v1/admin/content/revisions/${encodeURIComponent(revisionId)}/submit`,
    {
      method: "POST",
      validate: isAdminRevision,
    }
  );
}

export function approveContentRevision(
  revisionId: string,
  reviewNote?: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(
    `/api/v1/admin/content/revisions/${encodeURIComponent(revisionId)}/approve`,
    {
      method: "POST",
      body: { reviewNote: reviewNote || "Approved" },
      validate: isAdminRevision,
    }
  );
}

export function rejectContentRevision(
  revisionId: string,
  reviewNote: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(
    `/api/v1/admin/content/revisions/${encodeURIComponent(revisionId)}/reject`,
    {
      method: "POST",
      body: { reviewNote },
      validate: isAdminRevision,
    }
  );
}

export function publishContentRevision(
  revisionId: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(
    `/api/v1/admin/content/revisions/${encodeURIComponent(revisionId)}/publish`,
    {
      method: "POST",
      validate: isAdminRevision,
    }
  );
}

export function archiveContentItem(
  itemId: string,
  reason = "Lưu trữ nội dung"
): Promise<AdminResult<{ message: string }>> {
  return requestWithAuth<{ message: string }>(
    `/api/v1/admin/content/items/${encodeURIComponent(itemId)}/archive`,
    {
      method: "POST",
      body: { reason },
      validate: isAdminMessage,
    }
  );
}

/* ==================== SYSTEM & POLICY APIS ==================== */

export function fetchFeatureFlags(): Promise<AdminResult<FeatureFlag[]>> {
  return requestWithAuth<FeatureFlag[]>("/api/v1/admin/system/feature-flags", {
    validate: (data) => Array.isArray(data) && data.every(isFeatureFlag),
  });
}

export function updateFeatureFlag(
  key: string,
  enabled: boolean
): Promise<AdminResult<FeatureFlag>> {
  return requestWithAuth<FeatureFlag>(
    `/api/v1/admin/system/feature-flags/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      body: { enabled },
      validate: (data) => isFeatureFlag(data) && data.key === key,
    }
  );
}

export function fetchStorageQuota(): Promise<AdminResult<StorageQuota>> {
  return requestWithAuth<StorageQuota>("/api/v1/admin/system/quotas/storage", {
    validate: isStorageQuota,
  });
}

export function fetchAiQuotaMetrics(): Promise<AdminResult<AiQuotaMetric[]>> {
  return requestWithAuth<AiQuotaMetric[]>("/api/v1/admin/system/quotas/ai", {
    validate: (data) => Array.isArray(data) && data.every(isAiQuotaMetric),
  });
}

export function fetchAuditLogs(
  search?: string,
  entityType?: string,
  page = 0,
  size = 10
): Promise<AdminResult<PageResponse<AuditLogEntry>>> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.set("search", search.trim());
  if (entityType && entityType !== "ALL") params.set("entityType", entityType);
  params.set("page", page.toString());
  params.set("size", size.toString());
  return requestWithAuth<PageResponse<AuditLogEntry>>(
    `/api/v1/admin/system/audit-logs?${params.toString()}`,
    { validate: (data) => isPageResponse(data, isAuditLogEntry) }
  );
}
