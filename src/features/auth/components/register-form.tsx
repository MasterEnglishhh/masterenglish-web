"use client";

import { useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { AuthField } from "./auth-field";

const strengthLabels = [
  "Dùng ít nhất 8 ký tự, có chữ và số.",
  "Cần mạnh hơn",
  "Khá tốt",
  "Mạnh",
];

function passwordStrength(value: string) {
  if (!value) return 0;
  const requirements = [
    value.length >= 8,
    /[A-Za-zÀ-ỹ]/.test(value) && /\d/.test(value),
    /[^A-Za-zÀ-ỹ0-9]/.test(value) ||
      (/[a-zà-ỹ]/.test(value) && /[A-ZÀ-Ỹ]/.test(value)),
  ];
  return requirements.filter(Boolean).length;
}

export function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [notice, setNotice] = useState("");
  const strength = passwordStrength(password);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setConfirmError("");

    if (password !== confirmPassword) {
      setConfirmError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    if (strength < 2) {
      setNotice("Hãy chọn mật khẩu mạnh hơn: ít nhất 8 ký tự, có chữ và số.");
      return;
    }

    setNotice(
      "Thông tin đã được nhập đầy đủ. Bản xem trước chưa tạo tài khoản hoặc gửi mã xác minh; thông tin của bạn không được gửi đi."
    );
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <AuthField
        id="display-name"
        name="displayName"
        label="Tên hiển thị"
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Tên bạn muốn được gọi"
        autoComplete="name"
        minLength={2}
        maxLength={80}
        required
        helperText="Đây là tên sẽ xuất hiện trong không gian học của bạn."
      />

      <AuthField
        id="auth-email"
        name="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ban@example.com"
        autoComplete="email"
        required
      />

      <div className="auth-field">
        <div className="auth-field-label">
          <label htmlFor="register-password">Mật khẩu</label>
        </div>
        <div className="auth-password">
          <input
            id="register-password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((v) => !v)}
            aria-label={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {isPasswordVisible ? "Ẩn" : "Hiện"}
          </button>
        </div>
        <div className="password-strength" aria-live="polite">
          <div className={`strength-bars level-${strength}`}>
            <span />
            <span />
            <span />
          </div>
          <small>{strengthLabels[strength]}</small>
        </div>
      </div>

      <AuthField
        id="confirm-password"
        name="confirmPassword"
        label="Nhập lại mật khẩu"
        type="password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          if (confirmError) setConfirmError("");
        }}
        placeholder="Xác nhận mật khẩu"
        autoComplete="new-password"
        required
        error={confirmError}
        showPasswordToggle
        isPasswordVisible={isPasswordVisible}
        onTogglePassword={() => setIsPasswordVisible((v) => !v)}
      />

      <button className="button button-dark auth-submit" type="submit">
        <span>Tạo tài khoản</span>
        <ArrowIcon />
      </button>

      {notice && (
        <p className="auth-notice" role="status">
          <span>✳</span>
          {notice}
        </p>
      )}

      <p className="auth-demo-note">
        Bản xem trước giao diện · Chưa kết nối dịch vụ xác thực
      </p>
    </form>
  );
}
