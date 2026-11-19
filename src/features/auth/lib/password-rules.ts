export const PASSWORD_MIN_CHARS = 15;
export const PASSWORD_MAX_BYTES = 72;

export interface PasswordRule {
  label: string;
  met: boolean;
}

export interface PasswordCheck {
  /** Mật khẩu sau khi chuẩn hóa NFC, đúng dạng được gửi lên máy chủ. */
  normalized: string;
  rules: PasswordRule[];
  /** Đạt mọi điều kiện và không chỉ gồm khoảng trắng. */
  valid: boolean;
}

/**
 * Điều kiện mật khẩu của backend: chuẩn hóa NFC, ít nhất 15 ký tự Unicode, tối đa 72 byte UTF-8.
 * Dùng chung cho đăng ký, quên mật khẩu và đổi mật khẩu để ba nơi không lệch nhau.
 */
export function checkPassword(raw: string): PasswordCheck {
  const normalized = raw.normalize("NFC");
  const rules: PasswordRule[] = [
    { label: `Từ ${PASSWORD_MIN_CHARS} ký tự`, met: [...normalized].length >= PASSWORD_MIN_CHARS },
    {
      label: `Tối đa ${PASSWORD_MAX_BYTES} byte UTF-8`,
      met: !!raw && new TextEncoder().encode(normalized).length <= PASSWORD_MAX_BYTES,
    },
  ];
  return { normalized, rules, valid: rules.every((rule) => rule.met) && !!normalized.trim() };
}
