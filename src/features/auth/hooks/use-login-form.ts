"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../lib/auth-client";
import { getSafeRedirectUrl } from "../lib/redirect";
import type { AuthError, FormStatus, LoginCredentials } from "../types/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UseLoginFormOptions {
  redirectTo?: string | null;
}

export function useLoginForm(options: UseLoginFormOptions = {}) {
  const router = useRouter();
  const safeRedirect = getSafeRedirectUrl(options.redirectTo, "/learn");

  const [values, setValues] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginCredentials, string>>>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [serverError, setServerError] = useState<AuthError | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Rate limit cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

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

  function validate(data: LoginCredentials): Partial<Record<keyof LoginCredentials, string>> {
    const newErrors: Partial<Record<keyof LoginCredentials, string>> = {};

    const trimmedEmail = data.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Vui lòng nhập email của bạn.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
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
      // Safe navigation to requested route or default learning hub
      router.push(safeRedirect);
      return;
    }

    // Handle failure
    setStatus("error");
    setServerError(result.error);

    if (result.error.retryAfterSeconds && result.error.retryAfterSeconds > 0) {
      setCooldownSeconds(result.error.retryAfterSeconds);
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
    safeRedirect,
    togglePasswordVisibility,
    handleFieldChange,
    onSubmit,
    retry,
  };
}
