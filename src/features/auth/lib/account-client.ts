import { fetchCsrfToken, refreshSession } from "./auth-client.ts";
import type { AuthUser, ProblemDetail } from "../types/auth.ts";

export interface LearningGoal {
  targetScore: number;
  dailyMinutes: number;
  targetDate: string | null;
  updatedAt?: string;
}

export interface AccountError {
  message: string;
  status: number;
  fieldErrors?: Record<string, string>;
}

export type AccountResult<T> =
  | { success: true; data: T }
  | { success: false; error: AccountError };

const fieldLabels: Record<string, string> = {
  firstName: "Tên không được để trống, tối đa 30 ký tự.",
  lastName: "Họ không được để trống, tối đa 30 ký tự.",
  phone: "Số điện thoại tối đa 30 ký tự.",
  currentPassword: "Vui lòng nhập mật khẩu hiện tại.",
  newPassword: "Vui lòng nhập mật khẩu mới.",
  targetScore: "Điểm mục tiêu từ 10 đến 990.",
  dailyMinutes: "Số phút mỗi ngày từ 5 đến 240.",
  targetDate: "Ngày mục tiêu không hợp lệ.",
};

async function accountRequest<T>(
  path: string,
  init: { method?: "GET" | "PUT" | "POST"; body?: object } = {},
  isRetry = false
): Promise<AccountResult<T>> {
  try {
    const method = init.method ?? "GET";
    const headers: Record<string, string> = {
      Accept: "application/json, application/problem+json",
    };
    if (method !== "GET") {
      const csrf = await fetchCsrfToken();
      if (!csrf)
        return failure(403, "Không thể xác nhận phiên bảo mật. Vui lòng thử lại.");
      headers[csrf.headerName] = csrf.token;
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      method,
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    if (res.status === 401 && !isRetry && (await refreshSession()))
      return accountRequest<T>(path, init, true);
    if (res.ok)
      return {
        success: true,
        data: (res.status === 204 ? undefined : await res.json()) as T,
      };

    const problem = (await res.json().catch(() => null)) as ProblemDetail | null;
    if (res.status === 401)
      return failure(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    const fieldErrors: Record<string, string> = {};
    for (const violation of problem?.errors ?? [])
      if (fieldLabels[violation.field])
        fieldErrors[violation.field] = fieldLabels[violation.field];
    return {
      success: false,
      error: {
        status: res.status,
        // Backend details are user-facing Vietnamese; 5xx details are not.
        message:
          res.status < 500 && problem?.detail
            ? problem.detail
            : "Dịch vụ đang gián đoạn. Vui lòng thử lại sau.",
        ...(Object.keys(fieldErrors).length ? { fieldErrors } : {}),
      },
    };
  } catch {
    return failure(
      0,
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại."
    );
  }
}

function failure(status: number, message: string) {
  return { success: false as const, error: { status, message } };
}

export function updateProfile(input: {
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<AccountResult<AuthUser>> {
  return accountRequest<AuthUser>("/api/v1/users/me", {
    method: "PUT",
    body: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone.trim() || null,
    },
  });
}

/** On success the server revokes every session and clears the auth cookies. */
export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AccountResult<void>> {
  return accountRequest<void>("/api/v1/users/me/password", {
    method: "POST",
    body: input,
  });
}

/** Resolves to `null` data when the learner has not set a goal yet (404). */
export async function fetchLearningGoal(): Promise<
  AccountResult<LearningGoal | null>
> {
  const result = await accountRequest<LearningGoal>("/api/v1/users/me/goal");
  if (!result.success && result.error.status === 404)
    return { success: true, data: null };
  return result;
}

export function updateLearningGoal(
  goal: LearningGoal
): Promise<AccountResult<LearningGoal>> {
  return accountRequest<LearningGoal>("/api/v1/users/me/goal", {
    method: "PUT",
    body: {
      targetScore: goal.targetScore,
      dailyMinutes: goal.dailyMinutes,
      targetDate: goal.targetDate || null,
    },
  });
}
