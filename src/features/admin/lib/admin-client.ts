import { fetchCsrfToken, refreshSession } from "@/features/auth/lib/auth-client";
import type { AdminKPI, RecentActivity } from "../types/admin";
import type { AdminUser, UserFilterState, UserRole } from "../types/user-management";
import type { ContentFilterState, ContentItem, ContentRevisionStatus } from "../types/content-ops";
import type { AiQuotaMetric, AuditLogEntry, FeatureFlag, StorageQuota } from "../types/system-policy";

export interface AdminClientError {
  code: string;
  message: string;
  status: number;
  retryable?: boolean;
}

export type AdminResult<T> =
  | { success: true; data: T }
  | { success: false; error: AdminClientError };

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AdminRevisionDto {
  id: string;
  contentItemId: string;
  status: ContentRevisionStatus;
  versionNo: number;
  reviewNote?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
}

export interface ContentSourceDto {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl?: string | null;
  author?: string | null;
  licenseCode?: string | null;
  status: string;
  createdAt: string;
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
  changeSummary?: string;
  sourceId?: string;
}

export interface CreateContentSourcePayload {
  title: string;
  sourceType: string;
  sourceUrl?: string;
  author?: string;
  licenseCode?: string;
  licenseUrl?: string;
  attribution?: string;
  permissionNote?: string;
}

const requestOptions = {
  credentials: "same-origin",
  cache: "no-store",
  headers: { Accept: "application/json, application/problem+json" },
} satisfies RequestInit;

async function requestWithAuth<T>(
  path: string,
  options?: RequestInit,
  isRetry = false
): Promise<AdminResult<T>> {
  try {
    let headers: Record<string, string> = {
      ...(requestOptions.headers as Record<string, string>),
      ...((options?.headers as Record<string, string>) ?? {}),
    };

    const method = options?.method?.toUpperCase() ?? "GET";
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const csrf = await fetchCsrfToken();
      if (!csrf) {
        return {
          success: false,
          error: {
            code: "CSRF_UNAVAILABLE",
            message: "Không thể xác nhận phiên bảo mật. Vui lòng thử lại.",
            status: 403,
            retryable: true,
          },
        };
      }
      headers = {
        ...headers,
        [csrf.headerName]: csrf.token,
        "Content-Type": "application/json",
      };
    }

    const res = await fetch(path, {
      ...requestOptions,
      ...options,
      headers,
    });

    if (res.status === 401 && !isRetry) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return requestWithAuth<T>(path, options, true);
      }
      return {
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          status: 401,
        },
      };
    }

    if (res.ok) {
      if (res.status === 204) {
        return { success: true, data: undefined as unknown as T };
      }
      const data = (await res.json()) as T;
      return { success: true, data };
    }

    const problem = await res.json().catch(() => null);
    return {
      success: false,
      error: {
        code: problem?.code ?? "SERVICE_ERROR",
        message:
          problem?.detail ??
          problem?.message ??
          `Yêu cầu không thành công (${res.status}).`,
        status: res.status,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Lỗi kết nối máy chủ. Vui lòng kiểm tra đường truyền.",
        status: 0,
        retryable: true,
      },
    };
  }
}

/* ==================== OVERVIEW APIS ==================== */

export function fetchAdminKpis(): Promise<AdminResult<AdminKPI[]>> {
  return requestWithAuth<AdminKPI[]>("/api/v1/admin/overview/kpis");
}

export function fetchRecentActivities(limit = 10): Promise<AdminResult<RecentActivity[]>> {
  return requestWithAuth<RecentActivity[]>(`/api/v1/admin/overview/activities?limit=${limit}`);
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

  return requestWithAuth<PageResponse<AdminUser>>(`/api/v1/admin/users?${params.toString()}`);
}

export function fetchAdminUserDetail(id: string): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(`/api/v1/admin/users/${id}`);
}

export function updateAdminUserRoles(
  id: string,
  roles: UserRole[]
): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(`/api/v1/admin/users/${id}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
}

export function lockAdminUser(
  id: string,
  reason: string,
  lockedUntil?: string | null
): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(`/api/v1/admin/users/${id}/lock`, {
    method: "POST",
    body: JSON.stringify({ reason, lockedUntil: lockedUntil || null }),
  });
}

export function unlockAdminUser(id: string): Promise<AdminResult<AdminUser>> {
  return requestWithAuth<AdminUser>(`/api/v1/admin/users/${id}/unlock`, {
    method: "POST",
  });
}

export function revokeAdminUserSessions(id: string): Promise<AdminResult<{ message: string }>> {
  return requestWithAuth<{ message: string }>(`/api/v1/admin/users/${id}/revoke-sessions`, {
    method: "POST",
  });
}

/* ==================== CONTENT OPS APIS ==================== */

export function fetchContentItems(
  filter: ContentFilterState
): Promise<AdminResult<PageResponse<ContentItem>>> {
  const params = new URLSearchParams();
  if (filter.search && filter.search.trim()) {
    params.set("search", filter.search.trim());
  }
  if (filter.module && filter.module !== "ALL") {
    params.set("contentType", filter.module === "VOCABULARY" ? "WORD" : filter.module);
  }
  if (filter.status && filter.status !== "ALL") {
    params.set("status", filter.status);
  }
  const page0 = Math.max(0, (filter.page || 1) - 1);
  params.set("page", page0.toString());
  params.set("size", (filter.pageSize || 10).toString());

  return requestWithAuth<PageResponse<ContentItem>>(`/api/v1/admin/content/items?${params.toString()}`);
}

export function createWordDraft(
  payload: CreateWordDraftPayload
): Promise<AdminResult<ContentItem>> {
  return requestWithAuth<ContentItem>("/api/v1/admin/content/words", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createDeckDraft(
  payload: CreateDeckDraftPayload
): Promise<AdminResult<ContentItem>> {
  return requestWithAuth<ContentItem>("/api/v1/admin/content/decks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitContentRevision(
  revisionId: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(`/api/v1/admin/content/revisions/${revisionId}/submit`, {
    method: "POST",
  });
}

export function approveContentRevision(
  revisionId: string,
  reviewNote?: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(`/api/v1/admin/content/revisions/${revisionId}/approve`, {
    method: "POST",
    body: JSON.stringify({ reviewNote: reviewNote || "Approved" }),
  });
}

export function rejectContentRevision(
  revisionId: string,
  reviewNote: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(`/api/v1/admin/content/revisions/${revisionId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reviewNote }),
  });
}

export function publishContentRevision(
  revisionId: string
): Promise<AdminResult<AdminRevisionDto>> {
  return requestWithAuth<AdminRevisionDto>(`/api/v1/admin/content/revisions/${revisionId}/publish`, {
    method: "POST",
  });
}

export function archiveContentItem(
  itemId: string,
  reason = "Lưu trữ nội dung"
): Promise<AdminResult<{ message: string }>> {
  return requestWithAuth<{ message: string }>(`/api/v1/admin/content/items/${itemId}/archive`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function fetchContentSources(
  search?: string,
  page = 0,
  size = 20
): Promise<AdminResult<PageResponse<ContentSourceDto>>> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.set("search", search.trim());
  params.set("page", page.toString());
  params.set("size", size.toString());
  return requestWithAuth<PageResponse<ContentSourceDto>>(`/api/v1/admin/content/sources?${params.toString()}`);
}

export function createContentSource(
  payload: CreateContentSourcePayload
): Promise<AdminResult<ContentSourceDto>> {
  return requestWithAuth<ContentSourceDto>("/api/v1/admin/content/sources", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ==================== SYSTEM & POLICY APIS ==================== */

export function fetchFeatureFlags(): Promise<AdminResult<FeatureFlag[]>> {
  return requestWithAuth<FeatureFlag[]>("/api/v1/admin/system/feature-flags");
}

export function updateFeatureFlag(
  key: string,
  enabled: boolean
): Promise<AdminResult<FeatureFlag>> {
  return requestWithAuth<FeatureFlag>(`/api/v1/admin/system/feature-flags/${key}`, {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
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
  return requestWithAuth<PageResponse<AuditLogEntry>>(`/api/v1/admin/system/audit-logs?${params.toString()}`);
}
