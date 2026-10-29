"use client";

import { Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { ArrowIcon } from "@/components/arrow-icon";
import { useRegisterForm } from "../hooks/use-register-form";
import { AuthField } from "./auth-field";

export function RegisterForm() {
  const {
    formRef,
    values,
    errors,
    passwordRules,
    showPassword,
    showConfirmation,
    isPreviewComplete,
    changeField,
    onSubmit,
    togglePassword,
    toggleConfirmation,
  } = useRegisterForm();
  const fulfilledRules = passwordRules.filter((rule) => rule.met).length;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="auth-form register-form"
      noValidate
    >
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
        </div>
      </div>

      <AuthField
        id="register-confirm-password"
        name="confirmPassword"
        label="Nhập lại mật khẩu"
        type="password"
        value={values.confirmPassword}
        onChange={(event) => changeField("confirmPassword", event.target.value)}
        placeholder="Nhập lại để chắc chắn nhé"
        autoComplete="new-password"
        required
        error={errors.confirmPassword}
        showPasswordToggle
        isPasswordVisible={showConfirmation}
        onTogglePassword={toggleConfirmation}
      />

      <div className="register-preview-note">
        <Mail size={18} aria-hidden="true" />
        <p>
          <strong>Hẹn bạn ở một khởi đầu mới.</strong>
          <span>
            Đăng ký sẽ sớm mở. Hiện bạn có thể trải nghiệm biểu mẫu này.
          </span>
        </p>
      </div>

      <button
        className="button button-dark auth-submit register-submit"
        type="submit"
      >
        <span>Tạo tài khoản của tôi</span>
        <ArrowIcon />
      </button>

      {isPreviewComplete && (
        <div className="register-feedback" role="status">
          <Sparkles size={20} aria-hidden="true" />
          <p>
            <strong>Thông tin của bạn đã hợp lệ.</strong>Đăng ký tài khoản chưa
            mở. Chưa có tài khoản được tạo hoặc email xác minh được gửi.
          </p>
        </div>
      )}

      <p className="register-privacy-note">
        <ShieldCheck size={15} aria-hidden="true" />
        Thông tin chỉ được kiểm tra trên thiết bị của bạn trong bản xem trước.
      </p>
    </form>
  );
}
