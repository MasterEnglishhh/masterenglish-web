import { requestJson } from "../../../lib/http.ts";
import { toUserResult, type UserResult } from "../../../lib/user-result.ts";
import type { AuthUser } from "../types/auth.ts";

export type AccountResult<T> = UserResult<T>;

const fieldLabels: Record<string, string> = {
  firstName: "Tên không được để trống, tối đa 30 ký tự.",
  lastName: "Họ không được để trống, tối đa 30 ký tự.",
  phone: "Số điện thoại tối đa 30 ký tự.",
  currentPassword: "Vui lòng nhập mật khẩu hiện tại.",
  newPassword: "Vui lòng nhập mật khẩu mới.",
};

async function accountRequest<T>(
  path: string,
  init: { method?: "GET" | "PUT" | "POST"; body?: object } = {}
): Promise<AccountResult<T>> {
  return toUserResult(await requestJson<T>(path, init), fieldLabels);
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
