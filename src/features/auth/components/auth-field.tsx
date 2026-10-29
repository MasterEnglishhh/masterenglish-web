import React from "react";

export interface AuthFieldProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  rightLabelElement?: React.ReactNode;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

export function AuthField({
  id,
  name,
  label,
  type = "text",
  value,
  defaultValue,
  onChange,
  placeholder,
  autoComplete,
  required,
  error,
  helperText,
  showPasswordToggle,
  isPasswordVisible,
  onTogglePassword,
  inputRef,
  rightLabelElement,
  disabled,
  minLength,
  maxLength,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const effectiveType = showPasswordToggle
    ? isPasswordVisible
      ? "text"
      : "password"
    : type;

  return (
    <div className="auth-field">
      <div className="auth-field-label">
        <label htmlFor={id}>{label}</label>
        {rightLabelElement}
      </div>

      <div className={showPasswordToggle ? "auth-password" : ""}>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={effectiveType}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helpId : undefined
          }
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            tabIndex={0}
          >
            {isPasswordVisible ? "Ẩn" : "Hiện"}
          </button>
        )}
      </div>

      {error ? (
        <small className="auth-error" id={errorId} role="alert">
          {error}
        </small>
      ) : helperText ? (
        <small id={helpId}>{helperText}</small>
      ) : null}
    </div>
  );
}
