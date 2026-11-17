"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuthSession } from "../hooks/use-auth-session";
import { AuthField } from "./auth-field";
import {
  changePassword,
  fetchLearningGoal,
  updateLearningGoal,
  updateProfile,
  type AccountError,
} from "../lib/account-client";
import type { AuthUser } from "../types/auth";

type Status =
  | { kind: "idle" | "saving" }
  | { kind: "saved"; message: string }
  | { kind: "error"; error: AccountError };

export function AccountSettings() {
  const { user } = useAuthSession();
  // RequireAuth in the learning layout renders this only for a signed-in user.
  if (!user) return null;
  return (
    <div className="account-settings">
      <ProfileForm key={user.id} user={user} />
      <PasswordForm />
      <GoalForm />
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === "saved")
    return (
      <p className="account-status" role="status">
        ✓ {status.message}
      </p>
    );
  if (status.kind === "error")
    return (
      <p className="account-status account-status-error" role="alert">
        {status.error.message}
      </p>
    );
  return null;
}

function fieldError(status: Status, field: string) {
  return status.kind === "error" ? status.error.fieldErrors?.[field] : undefined;
}

function ProfileForm({ user }: { user: AuthUser }) {
  const { acceptLogin } = useAuthSession();
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "saving" });
    const result = await updateProfile({ firstName, lastName, phone });
    if (!result.success) return setStatus({ kind: "error", error: result.error });
    acceptLogin(result.data); // updates the name shown in the account menu
    setStatus({ kind: "saved", message: "Đã lưu hồ sơ." });
  }

  return (
    <form className="account-card auth-form" onSubmit={onSubmit} noValidate>
      <h2>Hồ sơ</h2>
      <AuthField id="account-email" name="email" label="Email" type="email" value={user.email} disabled />
      <div className="account-row">
        <AuthField id="account-last-name" name="lastName" label="Họ và tên đệm" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required maxLength={30} error={fieldError(status, "lastName")} />
        <AuthField id="account-first-name" name="firstName" label="Tên" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required maxLength={30} error={fieldError(status, "firstName")} />
      </div>
      <AuthField id="account-phone" name="phone" label="Số điện thoại (không bắt buộc)" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={30} error={fieldError(status, "phone")} />
      <StatusLine status={status} />
      <button className="button button-dark auth-submit" type="submit" disabled={status.kind === "saving"} aria-busy={status.kind === "saving"}>
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "saving" });
    const result = await changePassword({ currentPassword, newPassword });
    if (!result.success) return setStatus({ kind: "error", error: result.error });
    // The server revoked every session and cleared the cookies. A full page load starts a
    // fresh session state; clearing it in place would let RequireAuth redirect elsewhere first.
    window.location.replace("/login?reset=1");
  }

  return (
    <form className="account-card auth-form" onSubmit={onSubmit} noValidate>
      <h2>Đổi mật khẩu</h2>
      <p className="account-note">
        Sau khi đổi, mọi thiết bị sẽ bị đăng xuất và bạn cần đăng nhập lại.
      </p>
      <AuthField id="account-current-password" name="currentPassword" label="Mật khẩu hiện tại" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required showPasswordToggle isPasswordVisible={visible} onTogglePassword={() => setVisible((v) => !v)} error={fieldError(status, "currentPassword")} />
      <AuthField id="account-new-password" name="newPassword" label="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={15} showPasswordToggle isPasswordVisible={visible} onTogglePassword={() => setVisible((v) => !v)} helperText="Ít nhất 15 ký tự." error={fieldError(status, "newPassword")} />
      <StatusLine status={status} />
      <button className="button button-dark auth-submit" type="submit" disabled={status.kind === "saving" || !currentPassword || !newPassword} aria-busy={status.kind === "saving"}>
        {status.kind === "saving" ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}

function GoalForm() {
  const [loaded, setLoaded] = useState(false);
  const [targetScore, setTargetScore] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    let active = true;
    void fetchLearningGoal().then((result) => {
      if (!active) return;
      if (!result.success) setStatus({ kind: "error", error: result.error });
      else if (result.data) {
        setTargetScore(String(result.data.targetScore));
        setDailyMinutes(String(result.data.dailyMinutes));
        setTargetDate(result.data.targetDate ?? "");
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "saving" });
    const result = await updateLearningGoal({
      targetScore: Number(targetScore),
      dailyMinutes: Number(dailyMinutes),
      targetDate: targetDate || null,
    });
    if (!result.success) return setStatus({ kind: "error", error: result.error });
    setStatus({ kind: "saved", message: "Đã lưu mục tiêu học tập." });
  }

  return (
    <form className="account-card auth-form" onSubmit={onSubmit} noValidate>
      <h2>Mục tiêu học tập</h2>
      {!loaded ? (
        <p role="status">Đang tải mục tiêu...</p>
      ) : (
        <>
          <div className="account-row">
            <div className="auth-field">
              <label htmlFor="goal-score">Điểm TOEIC mục tiêu</label>
              <input id="goal-score" type="number" min={10} max={990} step={5} required value={targetScore} onChange={(e) => setTargetScore(e.target.value)} aria-invalid={Boolean(fieldError(status, "targetScore"))} />
              {fieldError(status, "targetScore") && <small className="auth-error" role="alert">{fieldError(status, "targetScore")}</small>}
            </div>
            <div className="auth-field">
              <label htmlFor="goal-minutes">Số phút mỗi ngày</label>
              <input id="goal-minutes" type="number" min={5} max={240} required value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} aria-invalid={Boolean(fieldError(status, "dailyMinutes"))} />
              {fieldError(status, "dailyMinutes") && <small className="auth-error" role="alert">{fieldError(status, "dailyMinutes")}</small>}
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="goal-date">Ngày thi dự kiến (không bắt buộc)</label>
            <input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <StatusLine status={status} />
          <button className="button button-dark auth-submit" type="submit" disabled={status.kind === "saving" || !targetScore || !dailyMinutes} aria-busy={status.kind === "saving"}>
            {status.kind === "saving" ? "Đang lưu..." : "Lưu mục tiêu"}
          </button>
        </>
      )}
    </form>
  );
}
