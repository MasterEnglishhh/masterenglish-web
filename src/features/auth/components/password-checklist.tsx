import { Check } from "lucide-react";
import type { ReactNode } from "react";
import type { PasswordRule } from "../lib/password-rules";

/** Thanh tiến độ và danh sách điều kiện mật khẩu; mục đạt chuyển sang màu xanh. `children` là ghi chú ngắn bên dưới. */
export function PasswordChecklist({ rules, children }: { rules: PasswordRule[]; children?: ReactNode }) {
  const fulfilled = rules.filter((rule) => rule.met).length;
  return (
    <div className={`register-password-guide rules-${fulfilled}`}>
      <div className="register-password-meter" aria-hidden="true">
        <span />
        <span />
      </div>
      <ul aria-label="Yêu cầu mật khẩu">
        {rules.map((rule) => (
          <li key={rule.label} className={rule.met ? "is-met" : ""}>
            <Check size={13} aria-hidden="true" />
            <span>
              {rule.label}
              <span className="sr-only">{rule.met ? ": đã đạt" : ": chưa đạt"}</span>
            </span>
          </li>
        ))}
      </ul>
      {children && <p className="register-password-tip">{children}</p>}
    </div>
  );
}
