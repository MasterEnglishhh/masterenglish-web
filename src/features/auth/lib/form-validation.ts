import { checkPassword } from "./password-rules.ts";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 30;

/** Kiểm tra hình thức email như backend yêu cầu (có `@` và tên miền, tối đa 254 ký tự). */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return EMAIL_PATTERN.test(trimmed) && trimmed.length <= EMAIL_MAX_LENGTH;
}

export type RegisterField = "lastName" | "firstName" | "email" | "password" | "confirmPassword";
export type RegisterValues = Record<RegisterField, string>;
export type RegisterErrors = Partial<Record<RegisterField, string>>;

/** Lỗi từng trường của form đăng ký, theo thứ tự trường trên form (trường đầu tiên lỗi được focus). */
export function validateRegisterValues(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};
  for (const field of ["lastName", "firstName"] as const) {
    const value = values[field].trim();
    if (!value)
      errors[field] = field === "lastName" ? "Vui lòng nhập họ và tên đệm." : "Vui lòng nhập tên của bạn.";
    else if (value.length > NAME_MAX_LENGTH) errors[field] = `Vui lòng dùng tối đa ${NAME_MAX_LENGTH} ký tự.`;
  }
  if (!isValidEmail(values.email)) errors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
  const password = checkPassword(values.password);
  if (!password.valid) errors.password = "Mật khẩu cần từ 15 ký tự và không quá 72 byte UTF-8.";
  if (!values.confirmPassword) errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
  else if (values.confirmPassword.normalize("NFC") !== password.normalized)
    errors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
  return errors;
}
