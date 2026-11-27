"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  fieldError,
  StatusLine,
  type SaveStatus,
} from "@/components/save-status";
import { useAuthSession } from "../hooks/use-auth-session";
import { AuthField } from "./auth-field";
import { PasswordChecklist } from "./password-checklist";
import { checkPassword } from "../lib/password-rules";
import { changePassword, updateProfile } from "../lib/account-client";
import type { AuthUser } from "../types/auth";
import "../styles/auth.css";

type Status = SaveStatus;

/** `children` là chỗ cho các thẻ của phân hệ khác (vd. mục tiêu học) trong cùng bố cục. */
export function AccountSettings({ children }: { children?: ReactNode }) {
  const { user } = useAuthSession();
  if (!user) return null;
  return (
    <div className="account-settings">
      <ProfileForm key={user.id} user={user} />
      <PasswordForm />
      {children}
    </div>
  );
}

function ProfileForm({ user }: { user: AuthUser }) {
  const { acceptLogin } = useAuthSession();
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setStatus({ kind: "saving" });
    const result = await updateProfile(
      { firstName, lastName, phone },
      controller.signal
    );
    request.current = null;
    if (controller.signal.aborted) return;
    if (!result.success)
      return setStatus({ kind: "error", error: result.error });
    acceptLogin(result.data); // updates the name shown in the account menu
    setStatus({ kind: "saved", message: "Đã lưu hồ sơ." });
  }

  return (
    <form
      className="glass-card account-card auth-form"
      onSubmit={onSubmit}
      noValidate
    >
      <h2>Hồ sơ</h2>
      <AuthField
        id="account-email"
        name="email"
        label="Email"
        type="email"
        value={user.email}
        disabled
      />
      <div className="account-row">
        <AuthField
          id="account-last-name"
          name="lastName"
          label="Họ và tên đệm"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          required
          maxLength={30}
          error={fieldError(status, "lastName")}
        />
        <AuthField
          id="account-first-name"
          name="firstName"
          label="Tên"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          required
          maxLength={30}
          error={fieldError(status, "firstName")}
        />
      </div>
      <AuthField
        id="account-phone"
        name="phone"
        label="Số điện thoại (không bắt buộc)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
        maxLength={30}
        error={fieldError(status, "phone")}
      />
      <StatusLine status={status} />
      <button
        className="button button-dark auth-submit"
        type="submit"
        disabled={status.kind === "saving"}
        aria-busy={status.kind === "saving"}
      >
        {status.kind === "saving" ? "Đang lưu..." : "Lưu hồ sơ"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const passwordRules = checkPassword(newPassword).rules;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setStatus({ kind: "saving" });
    const result = await changePassword(
      { currentPassword, newPassword },
      controller.signal
    );
    request.current = null;
    if (controller.signal.aborted) return;
    if (!result.success)
      return setStatus({ kind: "error", error: result.error });
    // The server revoked every session and cleared the cookies. A full page load starts a
    // fresh session state; clearing it in place would let RequireAuth redirect elsewhere first.
    window.location.replace("/login?reset=1");
  }

  return (
    <form
      className="glass-card account-card auth-form"
      onSubmit={onSubmit}
      noValidate
    >
      <h2>Đổi mật khẩu</h2>
      <p className="account-note">
        Sau khi đổi, mọi thiết bị sẽ bị đăng xuất và bạn cần đăng nhập lại.
      </p>
      <AuthField
        id="account-current-password"
        name="currentPassword"
        label="Mật khẩu hiện tại"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
        showPasswordToggle
        isPasswordVisible={visible}
        onTogglePassword={() => setVisible((v) => !v)}
        error={fieldError(status, "currentPassword")}
      />
      <AuthField
        id="account-new-password"
        name="newPassword"
        label="Mật khẩu mới"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={15}
        showPasswordToggle
        isPasswordVisible={visible}
        onTogglePassword={() => setVisible((v) => !v)}
        error={fieldError(status, "newPassword")}
      />
      <PasswordChecklist rules={passwordRules} />
      <StatusLine status={status} />
      <button
        className="button button-dark auth-submit"
        type="submit"
        disabled={status.kind === "saving" || !currentPassword || !newPassword}
        aria-busy={status.kind === "saving"}
      >
        {status.kind === "saving" ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
