/**
 * Kết quả của các thao tác biểu mẫu của người dùng (hồ sơ, mật khẩu, mục tiêu học): lỗi
 * mang thông báo tiếng Việt và lỗi theo từng trường. Mỗi phân hệ truyền nhãn trường riêng.
 */
import type { HttpOutcome } from "./http.ts";

export interface UserError {
  message: string;
  status: number;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
}

export type UserResult<T> =
  { success: true; data: T } | { success: false; error: UserError };

function failure(status: number, message: string): UserResult<never> {
  return { success: false, error: { status, message } };
}

export function toUserResult<T>(
  outcome: HttpOutcome<T>,
  fieldLabels: Record<string, string>
): UserResult<T> {
  if (outcome.ok) return { success: true, data: outcome.data };
  const { reason, status, problem } = outcome;
  if (reason === "csrf")
    return failure(403, "Không thể xác nhận phiên bảo mật. Vui lòng thử lại.");
  if (reason === "session")
    return failure(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  if (reason === "network")
    return failure(
      0,
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại."
    );

  const fieldErrors: Record<string, string> = {};
  for (const violation of problem?.errors ?? []) {
    const label = violation.message || fieldLabels[violation.field];
    if (label) fieldErrors[violation.field] = label;
  }

  let message =
    status < 500 && problem?.detail
      ? problem.detail
      : "Dịch vụ đang gián đoạn. Vui lòng thử lại sau.";

  if (status === 429) {
    const seconds = outcome.retryAfterSeconds;
    message =
      problem?.detail ||
      (seconds
        ? `Bạn thao tác quá nhanh. Vui lòng chờ ${seconds} giây trước khi thử lại.`
        : "Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.");
  }

  return {
    success: false,
    error: {
      status,
      message,
      ...(outcome.retryAfterSeconds ? { retryAfterSeconds: outcome.retryAfterSeconds } : {}),
      ...(Object.keys(fieldErrors).length ? { fieldErrors } : {}),
    },
  };
}
