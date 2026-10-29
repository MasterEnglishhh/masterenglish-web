"use client";

import { Check, Mail, ShieldCheck } from "lucide-react";
import { ArrowIcon } from "@/components/arrow-icon";
import { useRegisterForm } from "../hooks/use-register-form";
import { AuthField } from "./auth-field";
import { RegistrationOtpForm } from "./registration-otp-form";

export function RegisterForm() {
  const form = useRegisterForm();
  const {
    formRef,
    values,
    errors,
    passwordRules,
    showPassword,
    showConfirmation,
    changeField,
    onSubmit,
    togglePassword,
    toggleConfirmation,
    serverError,
    pending,
    sendCooldown,
  } = form;
  const fulfilledRules = passwordRules.filter((rule) => rule.met).length;

  if (form.challenge) return <RegistrationOtpForm form={form} />;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="auth-form register-form"
      noValidate
    >
      {serverError && (
        <div className="auth-alert auth-alert-error" role="alert">
          <div className="auth-alert-body">
            <p>{serverError.message}</p>
          </div>
        </div>
      )}
      <fieldset className="register-fields" disabled={pending !== null}>
        <div className="register-name-row">
          <AuthField
            id="register-last-name"
            name="lastName"
            label="Họ và tên đệm"
            value={values.lastName}
            onChange={(event) => changeField("lastName", event.target.value)}
            placeholder="Nguyễn Hoàng"
            autoComplete="family-name"
            maxLength={30}
            required
            error={errors.lastName}
          />
          <AuthField
            id="register-first-name"
            name="firstName"
            label="Tên"
            value={values.firstName}
            onChange={(event) => changeField("firstName", event.target.value)}
            placeholder="An"
            autoComplete="given-name"
            maxLength={30}
            required
            error={errors.firstName}
          />
        </div>

        <AuthField
          id="register-email"
          name="email"
          label="Email của bạn"
          type="email"
          value={values.email}
          onChange={(event) => changeField("email", event.target.value)}
          placeholder="ban@example.com"
          autoComplete="email"
          maxLength={254}
          required
          error={errors.email}
          helperText="Dùng email bạn thường xuyên truy cập."
        />

        <div className="register-password-group">
          <AuthField
            id="register-password"
            name="password"
            label="Mật khẩu"
            type="password"
            value={values.password}
            onChange={(event) => changeField("password", event.target.value)}
            placeholder="Tạo mật khẩu của bạn"
            autoComplete="new-password"
            required
            error={errors.password}
            showPasswordToggle
            isPasswordVisible={showPassword}
            onTogglePassword={togglePassword}
          />
          <div className={`register-password-guide rules-${fulfilledRules}`}>
            <div className="register-password-meter" aria-hidden="true">
              <span />
              <span />
            </div>
            <ul aria-label="Yêu cầu mật khẩu">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={rule.met ? "is-met" : ""}>
                  <Check size={13} aria-hidden="true" />
                  <span>
                    {rule.label}
                    <span className="sr-only">
                      {rule.met ? ": đã đạt" : ": chưa đạt"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="register-password-tip">
              Có thể dùng một cụm từ dài, dễ nhớ. Ký tự có dấu và emoji có thể
              chiếm nhiều byte.
            </p>
          </div>
        </div>

        <AuthField
          id="register-confirm-password"
          name="confirmPassword"
          label="Nhập lại mật khẩu"
          type="password"
          value={values.confirmPassword}
          onChange={(event) =>
            changeField("confirmPassword", event.target.value)
          }
          placeholder="Nhập lại để chắc chắn nhé"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
          showPasswordToggle
          isPasswordVisible={showConfirmation}
          onTogglePassword={toggleConfirmation}
        />
      </fieldset>

      <div className="register-preview-note">
        <Mail size={18} aria-hidden="true" />
        <p>
          <strong>Chỉ còn một bước xác minh email.</strong>
          <span>
            Chúng tôi sẽ gửi mã gồm 6 chữ số, có hiệu lực trong 5 phút.
          </span>
        </p>
      </div>

      <button
        className="button button-dark auth-submit register-submit"
        type="submit"
        disabled={pending !== null || sendCooldown > 0}
        aria-busy={pending === "register"}
      >
        <span>
          {pending === "register"
            ? "Đang gửi mã xác minh..."
            : sendCooldown
              ? `Thử lại sau ${sendCooldown}s`
              : "Tiếp tục và nhận mã xác minh"}
        </span>
        {pending === "register" ? (
          <span className="auth-spinner" aria-hidden="true" />
        ) : (
          <ArrowIcon />
        )}
      </button>

      <p className="register-privacy-note">
        <ShieldCheck size={15} aria-hidden="true" />
        Tài khoản chỉ được kích hoạt sau khi email được xác minh.
      </p>
    </form>
  );
}
