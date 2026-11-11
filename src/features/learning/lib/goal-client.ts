import { fetchCsrfToken, refreshSession } from "@/features/auth/lib/auth-client";

export interface LearningGoalDto {
  targetScore: number;
  dailyMinutes: number;
  targetDate: string | null;
  updatedAt: string;
}

export interface UpdateLearningGoalPayload {
  targetScore: number;
  dailyMinutes: number;
  targetDate?: string | null;
}

export interface GoalClientError {
  code: string;
  message: string;
  status: number;
  retryable?: boolean;
}

export type GoalResult<T> =
  | { success: true; data: T }
  | { success: false; error: GoalClientError };

const requestOptions = {
  credentials: "same-origin",
  cache: "no-store",
  headers: { Accept: "application/json, application/problem+json" },
} satisfies RequestInit;

async function requestWithAuth<T>(
  path: string,
  options?: RequestInit,
  isRetry = false
): Promise<GoalResult<T>> {
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

    // 404 for goal means user hasn't set one yet
    if (res.status === 404 && method === "GET") {
      return { success: true, data: null as unknown as T };
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

export function fetchLearningGoal(): Promise<GoalResult<LearningGoalDto | null>> {
  return requestWithAuth<LearningGoalDto | null>("/api/v1/users/me/goal");
}

export function updateLearningGoal(
  payload: UpdateLearningGoalPayload
): Promise<GoalResult<LearningGoalDto>> {
  return requestWithAuth<LearningGoalDto>("/api/v1/users/me/goal", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
