"use client";

import { MailCheck, RotateCcw } from "lucide-react";
import { ArrowIcon } from "@/components/arrow-icon";
import type { useRegisterForm } from "../hooks/use-register-form";

export function RegistrationOtpForm({
  form,
}: {
  form: ReturnType<typeof useRegisterForm>;
}) {
  const {
    pending,
    expiresIn,
    values,
    onVerify,
    serverError,
    otpError,
    notice,
    otpRef,
    otp,
    changeOtp,
    verifyCooldown,
    resend,
    resendCooldown,
    changeEmail,
  } = form;
  const busy = pending !== null;
  const minutes = Math.floor(expiresIn / 60);
  const seconds = String(expiresIn % 60).padStart(2, "0");

  return (
    <section
      className="registration-otp"
      aria-labelledby="registration-otp-title"
    >
      <ol className="registration-steps" aria-label="Tiến trình đăng ký">
        <li className="is-complete">
          <span>✓</span>Thông tin
        </li>
        <li className="is-current" aria-current="step">
          <span>2</span>Xác minh email
        </li>
      </ol>
      <div className="registration-otp-heading">
        <span className="registration-mail-icon">
          <MailCheck size={28} aria-hidden="true" />
        </span>
        <h2 id="registration-otp-title">Kiểm tra hộp thư của bạn</h2>
        <p>
          Nếu email có thể đăng ký, mã gồm 6 chữ số đã được gửi đến{" "}
          <strong>{values.email}</strong>.
        </p>
      </div>
      <form className="auth-form" onSubmit={onVerify} noValidate>
        {serverError && !otpError && (
          <div className="auth-alert auth-alert-error" role="alert">
            <div className="auth-alert-body">
              <p>{serverError.message}</p>
            </div>
          </div>
        )}
        {notice && (
          <p className="auth-notice" role="status">
            {notice}
          </p>
        )}
        <div className="auth-field">
          <label htmlFor="registration-otp-code">Mã xác minh</label>
          <input
            ref={otpRef}
            id="registration-otp-code"
            className="registration-otp-input"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={(event) => changeOtp(event.target.value)}
            placeholder="000000"
            required
            disabled={busy || verifyCooldown > 0}
            aria-invalid={!!otpError}
            aria-describedby={
              otpError ? "registration-otp-error" : "registration-otp-help"
            }
          />
          {otpError ? (
            <small
              className="auth-error"
              id="registration-otp-error"
              role="alert"
            >
              {otpError}
            </small>
          ) : (
            <small id="registration-otp-help">
              Bạn có thể dán toàn bộ mã từ email vào đây.
            </small>
          )}
        </div>
        <div className="registration-expiry">
          {expiresIn > 0 ? (
            <span role="timer" aria-live="off">
              Mã còn hiệu lực trong{" "}
              <strong>
                {minutes}:{seconds}
              </strong>
            </span>
          ) : (
            <span role="status">Mã đã hết hạn. Hãy yêu cầu mã mới.</span>
          )}
        </div>
        <button
          className="button button-dark auth-submit"
          type="submit"
          disabled={busy || verifyCooldown > 0 || expiresIn === 0}
          aria-busy={pending === "verify"}
        >
          <span>
            {pending === "verify"
              ? "Đang xác minh..."
              : verifyCooldown
                ? `Thử lại sau ${verifyCooldown}s`
                : "Xác minh tài khoản"}
          </span>
          {pending === "verify" ? (
            <span className="auth-spinner" aria-hidden="true" />
          ) : (
            <ArrowIcon />
          )}
        </button>
        <div className="registration-resend">
          <span>Chưa thấy email? Kiểm tra cả mục thư rác nhé.</span>
          <button
            type="button"
            onClick={() => void resend()}
            disabled={busy || resendCooldown > 0}
          >
            <RotateCcw size={14} aria-hidden="true" />
            {pending === "resend"
              ? "Đang gửi..."
              : resendCooldown
                ? `Gửi lại sau ${resendCooldown}s`
                : "Gửi lại mã"}
          </button>
        </div>
        <button
          className="registration-change-email"
          type="button"
          onClick={changeEmail}
          disabled={busy}
        >
          ← Dùng email khác
        </button>
      </form>
    </section>
  );
}
