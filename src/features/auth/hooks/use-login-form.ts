"use client";

import { useEffect, useRef, useState } from "react";
import { useCountdownClock } from "./use-countdown-clock";
import { useRouter } from "next/navigation";
import { login } from "../lib/auth-client";
import { EMAIL_PATTERN } from "../lib/form-validation";
import { getRoleHome, getSafeRedirectUrl } from "../lib/redirect";
import { useAuthSession } from "./use-auth-session";
import type { AuthError, FormStatus, LoginCredentials } from "../types/auth";

export interface UseLoginFormOptions {
  redirectTo?: string | null;
}

export function useLoginForm(options: UseLoginFormOptions = {}) {
  const router = useRouter();
  const { user, acceptLogin } = useAuthSession();

  useEffect(() => {
    if (user) router.replace(getSafeRedirectUrl(options.redirectTo, getRoleHome(user.roles)));
  }, [user, router, options.redirectTo]);

  const [values, setValues] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginCredentials, string>>
  >({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [serverError, setServerError] = useState<AuthError | null>(null);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const { remaining, syncNow } = useCountdownClock(false, blockedUntil);
  const cooldownSeconds = remaining(blockedUntil);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function togglePasswordVisibility() {
    setIsPasswordVisible((prev) => !prev);
  }

  function handleFieldChange(field: keyof LoginCredentials, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear non-cooldown server errors once user modifies input
    if (serverError && cooldownSeconds <= 0) {
      setServerError(null);
    }
  }

  function validate(
    data: LoginCredentials
  ): Partial<Record<keyof LoginCredentials, string>> {
    const newErrors: Partial<Record<keyof LoginCredentials, string>> = {};

    const trimmedEmail = data.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Vui lòng nhập email của bạn.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      newErrors.email = "Email chưa đúng định dạng (ví dụ: ban@example.com).";
    }

    if (!data.password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
    }

    return newErrors;
  }

  async function performSubmit(credentialsToSubmit: LoginCredentials) {
    if (status === "submitting" || cooldownSeconds > 0) return;

    const validationErrors = validate(credentialsToSubmit);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus("idle");

      // Auto-focus the first invalid field
      if (validationErrors.email) {
        emailRef.current?.focus();
      } else if (validationErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    setStatus("submitting");
    setServerError(null);

    const result = await login(credentialsToSubmit);

    if (result.success) {
      setStatus("success");
      acceptLogin(result.user);
      // Trang đăng nhập cũ còn nằm ẩn trong DOM sau khi chuyển trang: không để mật khẩu ở lại trong ô nhập.
      setValues((prev) => ({ ...prev, password: "" }));
      return;
    }

    // Handle failure
    setStatus("error");
    setServerError(result.error);
    if (result.error.fieldViolations) {
      setErrors(result.error.fieldViolations);
      if (result.error.fieldViolations.email) emailRef.current?.focus();
      else if (result.error.fieldViolations.password)
        passwordRef.current?.focus();
    }

    if (result.error.retryAfterSeconds && result.error.retryAfterSeconds > 0) {
      setBlockedUntil(syncNow() + result.error.retryAfterSeconds * 1000);
    }

    if (result.error.code === "BAD_CREDENTIALS") {
      // Clear password for security on bad credentials
      setValues((prev) => ({ ...prev, password: "" }));
      passwordRef.current?.focus();
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await performSubmit(values);
  }

  function retry() {
    if (status === "submitting" || cooldownSeconds > 0) return;
    performSubmit(values);
  }

  return {
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
  };
}
