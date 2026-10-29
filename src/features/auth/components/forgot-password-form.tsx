"use client";
import { KeyRound, MailCheck } from "lucide-react";
import { ArrowIcon } from "@/components/arrow-icon";
import { useForgotPasswordForm } from "../hooks/use-forgot-password-form";
import { AuthField } from "./auth-field";

export function ForgotPasswordForm() {
  const {
    emailRef,
    otpRef,
    passwordRef,
    email,
    otp,
    password,
    confirmation,
    visible,
    confirmationVisible,
    stage,
    error,
    fieldError,
    pending,
    sendCooldown,
    verifyCooldown,
    expiresIn,
    passwordValid,
    submit,
    send,
    restart,
    changeEmail,
    changeOtp,
    changePassword,
    changeConfirmation,
    togglePassword,
    toggleConfirmation,
  } = useForgotPasswordForm();
  const clock = `${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, "0")}`;
  return (
    <form
      onSubmit={submit}
      className="auth-form forgot-password-form"
      noValidate
    >
      <ol
        className="registration-steps reset-steps"
        aria-label="Khôi phục tài khoản"
      >
        <li className={stage === "email" ? "is-current" : "is-complete"}>
          <span>1</span>Email
        </li>
        <li className={stage === "otp" ? "is-current" : ""}>
          <span>2</span>OTP
        </li>
        <li className={stage === "password" ? "is-current" : ""}>
          <span>3</span>Mật khẩu mới
        </li>
      </ol>
      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <div className="auth-alert-body">
            <p>{error.message}</p>
          </div>
        </div>
      )}
      {stage === "email" ? (
        <AuthField
          id="reset-email"
          inputRef={emailRef}
          name="email"
          label="Email tài khoản"
          type="email"
          value={email}
          onChange={(event) => changeEmail(event.target.value)}
          placeholder="ban@example.com"
          autoComplete="email"
          maxLength={254}
          required
          disabled={pending}
          error={fieldError}
          helperText="Nếu email đã có tài khoản được xác minh, bạn sẽ nhận được mã OTP."
        />
      ) : stage === "otp" ? (
        <>
          <div className="registration-otp-heading">
            <span className="registration-mail-icon">
              <MailCheck size={26} aria-hidden="true" />
            </span>
            <h2>Xác minh email của bạn</h2>
            <p>
              Nếu tài khoản đủ điều kiện, mã gồm 6 số sẽ được gửi đến{" "}
              <strong>{email}</strong>. Hãy kiểm tra cả thư rác.
            </p>
          </div>
          <div className="auth-field">
            <label htmlFor="reset-otp">Mã xác minh</label>
            <input
              ref={otpRef}
              id="reset-otp"
              name="otp"
              className="registration-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={otp}
              onChange={(event) => changeOtp(event.target.value)}
              placeholder="000000"
              required
              disabled={pending || verifyCooldown > 0}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "reset-otp-error" : undefined}
            />
            {fieldError && (
              <small id="reset-otp-error" className="auth-error" role="alert">
                {fieldError}
              </small>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="registration-otp-heading">
            <span className="registration-mail-icon">
              <KeyRound size={26} aria-hidden="true" />
            </span>
            <h2>Chọn mật khẩu mới</h2>
            <p>
              Chọn một mật khẩu khác mật khẩu hiện tại. Sau khi cập nhật, các
              phiên đăng nhập cũ sẽ được thu hồi.
            </p>
          </div>
          <AuthField
            id="reset-new-password"
            inputRef={passwordRef}
            name="newPassword"
            label="Mật khẩu mới"
            type="password"
            value={password}
            onChange={(event) => changePassword(event.target.value)}
            placeholder="Một cụm từ dài, dễ nhớ"
            autoComplete="new-password"
            required
            disabled={pending}
            showPasswordToggle
            isPasswordVisible={visible}
            onTogglePassword={togglePassword}
            error={fieldError}
            helperText="Ít nhất 15 ký tự, tối đa 72 byte UTF-8. Không bắt buộc phối hợp chữ, số hoặc ký tự đặc biệt."
          />
          <AuthField
            id="reset-confirm-password"
            name="confirmPassword"
            label="Nhập lại mật khẩu mới"
            type="password"
            value={confirmation}
            onChange={(event) => changeConfirmation(event.target.value)}
            placeholder="Xác nhận mật khẩu mới"
            autoComplete="new-password"
            required
            disabled={pending}
            showPasswordToggle
            isPasswordVisible={confirmationVisible}
            onTogglePassword={toggleConfirmation}
          />
          <small className="reset-password-status">
            {password && passwordValid
              ? "✓ Mật khẩu đáp ứng yêu cầu độ dài."
              : "Ký tự có dấu và emoji có thể chiếm nhiều byte."}
          </small>
        </>
      )}
      {stage !== "email" && (
        <div className="registration-expiry" role="timer" aria-live="off">
          {expiresIn > 0 ? (
            <>
              {" "}
              {stage === "otp" ? "Mã còn hiệu lực" : "Hoàn tất trong"}{" "}
              <strong>{clock}</strong>
            </>
          ) : (
            "Yêu cầu đã hết hạn. Hãy nhận OTP mới."
          )}
        </div>
      )}
      <button
        className="button button-dark auth-submit"
        type="submit"
        disabled={
          pending ||
          (stage === "email"
            ? sendCooldown > 0
            : verifyCooldown > 0 || expiresIn === 0)
        }
        aria-busy={pending}
      >
        <span>
          {pending
            ? "Đang xử lý..."
            : stage === "email"
              ? sendCooldown
                ? `Thử lại sau ${sendCooldown}s`
                : "Gửi mã xác minh"
              : verifyCooldown
                ? `Thử lại sau ${verifyCooldown}s`
                : stage === "otp"
                  ? "Xác minh mã OTP"
                  : "Cập nhật mật khẩu"}
        </span>
        {pending ? (
          <span className="auth-spinner" aria-hidden="true" />
        ) : (
          <ArrowIcon />
        )}
      </button>
      {stage === "otp" && (
        <div className="registration-resend">
          <button
            type="button"
            onClick={() => void send()}
            disabled={pending || sendCooldown > 0}
          >
            {sendCooldown ? `Gửi lại sau ${sendCooldown}s` : "Gửi lại mã"}
          </button>
        </div>
      )}
      {stage !== "email" && (
        <button
          className="registration-change-email"
          type="button"
          disabled={pending}
          onClick={restart}
        >
          {stage === "password" ? "← Nhận OTP mới" : "← Đổi địa chỉ email"}
        </button>
      )}
    </form>
  );
}
