"use client";

import { useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { AuthField } from "./auth-field";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(
      "Email đã được nhập. Bản xem trước chưa gửi yêu cầu khôi phục mật khẩu."
    );
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
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
        helperText="Chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu."
      />

      <button className="button button-dark auth-submit" type="submit">
        <span>Tiếp tục</span>
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
