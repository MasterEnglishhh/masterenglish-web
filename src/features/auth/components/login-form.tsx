"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowIcon } from "@/components/arrow-icon";
import { useLoginForm } from "../hooks/use-login-form";
import { AuthField } from "./auth-field";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const {
    values,
    errors,
    status,
    serverError,
    cooldownSeconds,
    isPasswordVisible,
    emailRef,
    passwordRef,
    togglePasswordVisibility,
    handleFieldChange,
    onSubmit,
    retry,
  } = useLoginForm({ redirectTo: redirectParam });

  const isSubmitting = status === "submitting";
  const isBlockedByCooldown = cooldownSeconds > 0;
  const isSubmitDisabled = isSubmitting || isBlockedByCooldown;

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      {/* Rate limit warning banner */}
      {isBlockedByCooldown && (
        <div className="auth-alert auth-alert-warning" role="alert">
          <span className="auth-alert-icon" aria-hidden="true">
            ⏱
          </span>
          <div className="auth-alert-body">
            <strong>Giới hạn lượt đăng nhập</strong>
            <p>
              Vui lòng chờ{" "}
              <span className="auth-cooldown-count">{cooldownSeconds}</span> giây
              nữa trước khi thử lại.
            </p>
          </div>
        </div>
      )}

      {/* Server / Network error banner */}
      {serverError && !isBlockedByCooldown && (
        <div
          className={`auth-alert ${
            serverError.code === "BAD_CREDENTIALS"
              ? "auth-alert-credentials"
              : "auth-alert-error"
          }`}
          role="alert"
        >
          <span className="auth-alert-icon" aria-hidden="true">
            {serverError.code === "BAD_CREDENTIALS" ? "⚠" : "✳"}
          </span>
          <div className="auth-alert-body">
            <strong>
              {serverError.code === "BAD_CREDENTIALS"
                ? "Đăng nhập không thành công"
                : serverError.code === "SERVICE_UNAVAILABLE"
                ? "Dịch vụ đang cập nhật"
                : "Không thể hoàn tất yêu cầu"}
            </strong>
            <p>{serverError.message}</p>
            {serverError.retryable && (
              <button
                type="button"
                onClick={retry}
                className="auth-retry-button"
                disabled={isSubmitting}
              >
                ↻ Thử lại ngay
              </button>
            )}
          </div>
        </div>
      )}

      {/* Email input field */}
      <AuthField
        inputRef={emailRef}
        id="auth-email"
        name="email"
        label="Email"
        type="email"
        value={values.email}
        onChange={(e) => handleFieldChange("email", e.target.value)}
        placeholder="ban@example.com"
        autoComplete="email"
        required
        disabled={isSubmitting || isBlockedByCooldown}
        error={errors.email}
      />

      {/* Password input field with Show/Hide toggle and Forgot Password link */}
      <AuthField
        inputRef={passwordRef}
        id="auth-password"
        name="password"
        label="Mật khẩu"
        type="password"
        value={values.password}
        onChange={(e) => handleFieldChange("password", e.target.value)}
        placeholder="Nhập mật khẩu"
        autoComplete="current-password"
        required
        disabled={isSubmitting || isBlockedByCooldown}
        error={errors.password}
        showPasswordToggle
        isPasswordVisible={isPasswordVisible}
        onTogglePassword={togglePasswordVisibility}
        rightLabelElement={
          <Link
            href="/forgot-password"
            className="auth-forgot-link"
            tabIndex={0}
          >
            Quên mật khẩu?
          </Link>
        }
      />

      {/* Submit button with loading state */}
      <button
        className={`button button-dark auth-submit ${
          isSubmitting ? "is-submitting" : ""
        }`}
        type="submit"
        disabled={isSubmitDisabled}
        aria-busy={isSubmitting}
      >
        <span>
          {isSubmitting
            ? "Đang xác thực..."
            : isBlockedByCooldown
            ? `Chờ ${cooldownSeconds}s`
            : "Đăng nhập"}
        </span>
        {isSubmitting ? (
          <span className="auth-spinner" aria-hidden="true" />
        ) : (
          <ArrowIcon />
        )}
      </button>
    </form>
  );
}
