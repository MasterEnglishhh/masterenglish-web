/**
 * Kết quả của các thao tác biểu mẫu của người dùng (hồ sơ, mật khẩu, mục tiêu học): lỗi
 * mang thông báo tiếng Việt và lỗi theo từng trường. Mỗi phân hệ truyền nhãn trường riêng.
 */
import type { HttpOutcome } from "./http.ts";

export interface UserError {
  message: string;
  status: number;
  fieldErrors?: Record<string, string>;
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
  for (const violation of problem?.errors ?? [])
    if (fieldLabels[violation.field])
      fieldErrors[violation.field] = fieldLabels[violation.field];
  return {
    success: false,
    error: {
      status,
      // Backend details are user-facing Vietnamese; 5xx details are not.
      message:
        status < 500 && problem?.detail
          ? problem.detail
          : "Dịch vụ đang gián đoạn. Vui lòng thử lại sau.",
      ...(Object.keys(fieldErrors).length ? { fieldErrors } : {}),
    },
  };
}
