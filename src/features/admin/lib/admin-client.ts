import {
  requestJson,
  type HttpOutcome,
  type PageResponse,
} from "../../../lib/http.ts";
import type { AdminKPI, RecentActivity } from "../types/admin";
import type {
  AdminUser,
  UserFilterState,
  UserRole,
} from "../types/user-management";
import type {
  ContentFilterState,
  ContentItem,
  ContentRevisionStatus,
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

export interface AdminRevisionDto {
  revisionId: string;
  contentItemId: string;
  status: ContentRevisionStatus;
  versionNo: number;
  reviewNote?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
}

export interface CreateWordDraftPayload {
  lemma: string;
  partOfSpeech: string;
  cefrLevel: string;
  meaningVi: string;
  definitionEn?: string;
  ipa?: string;
  examplesEn?: string[];
  examplesVi?: string[];
  changeSummary?: string;
  sourceId?: string;
}

export interface CreateDeckDraftPayload {
  title: string;
  description?: string;
  level?: string;
  wordSenseIds?: string[];
  changeSummary?: string;
  sourceId?: string;
}

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
  return requestWithAuth<AdminKPI[]>("/api/v1/admin/overview/kpis");
}

export function fetchRecentActivities(
  limit = 10
): Promise<AdminResult<RecentActivity[]>> {
  return requestWithAuth<RecentActivity[]>(
    `/api/v1/admin/overview/activities?limit=${limit}`
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
    `/api/v1/admin/users?${params.toString()}`
  );
}

export function fetchAdminUserDetail(
  id: string
): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(`/api/v1/admin/users/${id}`);
}

export function updateAdminUserRoles(
  id: string,
  roles: UserRole[]
): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(`/api/v1/admin/users/${id}/roles`, {
    method: "PUT",
    body: { roles },
  });
}

export function lockAdminUser(
  id: string,
  reason: string,
  lockedUntil?: string | null
): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(`/api/v1/admin/users/${id}/lock`, {
    method: "POST",
    body: { reason, lockedUntil: lockedUntil || null },
  });
}

export function unlockAdminUser(id: string): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(`/api/v1/admin/users/${id}/unlock`, {
    method: "POST",
  });
}

export function revokeAdminUserSessions(
  id: string
): Promise<AdminResult<{ message: string }>> {
  return requestWithAuth<{ message: string }>(
    `/api/v1/admin/users/${id}/revoke-sessions`,
    {
      method: "POST",
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
    `/api/v1/admin/content/items?${params.toString()}`
  );
}

export function createWordDraft(
  payload: CreateWordDraftPayload
): Promise<AdminResult<ContentItem>> {
  return requestWithAuth<ContentItem>("/api/v1/admin/content/words", {
    method: "POST",
    body: payload,
  });
}

export function createDeckDraft(
  payload: CreateDeckDraftPayload
): Promise<AdminResult<ContentItem>> {
  return requestWithAuth<ContentItem>("/api/v1/admin/content/decks", {
    method: "POST",
    body: payload,
  });
}

export function submitContentRevision(
  revisionId: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(
    `/api/v1/admin/content/revisions/${revisionId}/submit`,
    {
      method: "POST",
    }
  );
}

export function approveContentRevision(
  revisionId: string,
  reviewNote?: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(
    `/api/v1/admin/content/revisions/${revisionId}/approve`,
    {
      method: "POST",
      body: { reviewNote: reviewNote || "Approved" },
    }
  );
}

export function rejectContentRevision(
  revisionId: string,
  reviewNote: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(
    `/api/v1/admin/content/revisions/${revisionId}/reject`,
    {
      method: "POST",
      body: { reviewNote },
    }
  );
}

export function publishContentRevision(
  revisionId: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(
    `/api/v1/admin/content/revisions/${revisionId}/publish`,
    {
      method: "POST",
    }
  );
}

export function archiveContentItem(
  itemId: string,
  reason = "Lưu trữ nội dung"
): Promise<AdminResult<{ message: string }>> {
  return requestWithAuth<{ message: string }>(
    `/api/v1/admin/content/items/${itemId}/archive`,
    {
      method: "POST",
      body: { reason },
    }
  );
}

/* ==================== SYSTEM & POLICY APIS ==================== */

export function fetchFeatureFlags(): Promise<AdminResult<FeatureFlag[]>> {
  return requestWithAuth<FeatureFlag[]>("/api/v1/admin/system/feature-flags");
}

export function fetchStorageQuota(): Promise<AdminResult<StorageQuota>> {
  return requestWithAuth<StorageQuota>("/api/v1/admin/system/quotas/storage");
}

export function fetchAiQuotaMetrics(): Promise<AdminResult<AiQuotaMetric[]>> {
  return requestWithAuth<AiQuotaMetric[]>("/api/v1/admin/system/quotas/ai");
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
    `/api/v1/admin/system/audit-logs?${params.toString()}`
  );
}
