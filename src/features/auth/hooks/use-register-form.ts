"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  registerAccount,
  resendRegistrationOtp,
  verifyRegistrationOtp,
} from "../lib/auth-client";
import { getSafeRedirectUrl } from "../lib/redirect";
import type { AuthError, RegistrationChallenge } from "../types/auth";

type RegisterField =
  "lastName" | "firstName" | "email" | "password" | "confirmPassword";
type RegisterValues = Record<RegisterField, string>;
type RegisterErrors = Partial<Record<RegisterField, string>>;
type PendingAction = "register" | "verify" | "resend" | null;

export function useRegisterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<RegisterValues>({
    lastName: "",
    firstName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [challenge, setChallenge] = useState<RegistrationChallenge | null>(
    null
  );
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [serverError, setServerError] = useState<AuthError | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<PendingAction>(null);
  const [resendAt, setResendAt] = useState(0);
  const [sendBlockedUntil, setSendBlockedUntil] = useState(0);
  const [verifyBlockedUntil, setVerifyBlockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now);

  const normalizedPassword = values.password.normalize("NFC");
  const passwordRules = [
    { label: "Từ 15 ký tự", met: [...normalizedPassword].length >= 15 },
    {
      label: "Tối đa 72 byte UTF-8",
      met:
        !!values.password &&
        new TextEncoder().encode(normalizedPassword).length <= 72,
    },
  ];

  useEffect(() => {
    if (
      !challenge &&
      sendBlockedUntil <= Date.now() &&
      verifyBlockedUntil <= Date.now()
    )
      return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge, sendBlockedUntil, verifyBlockedUntil]);

  useEffect(() => {
    if (challenge) otpRef.current?.focus();
  }, [challenge]);

  const remaining = (until: number) =>
    Math.max(0, Math.ceil((until - now) / 1000));
  const sendCooldown = remaining(sendBlockedUntil);
  const resendCooldown = remaining(Math.max(resendAt, sendBlockedUntil));
  const verifyCooldown = remaining(verifyBlockedUntil);
  const expiresIn = challenge ? remaining(Date.parse(challenge.expiresAt)) : 0;

  function changeField(field: RegisterField, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
      ...(field === "password" ? { confirmPassword: undefined } : {}),
    }));
    if (!sendCooldown) setServerError(null);
  }

  function acceptChallenge(next: RegistrationChallenge) {
    const time = Date.now();
    setNow(time);
    setChallenge(next);
    setResendAt(time + next.resendAfterSeconds * 1000);
    setOtp("");
    setOtpError("");
    setServerError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || sendCooldown) return;
    const nextErrors: RegisterErrors = {};
    for (const field of ["lastName", "firstName"] as const) {
      if (!values[field].trim())
        nextErrors[field] =
          field === "lastName"
            ? "Vui lòng nhập họ và tên đệm."
            : "Vui lòng nhập tên của bạn.";
      else if (values[field].trim().length > 30)
        nextErrors[field] = "Vui lòng dùng tối đa 30 ký tự.";
    }
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ||
      values.email.trim().length > 254
    )
      nextErrors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
    if (!passwordRules.every((rule) => rule.met) || !normalizedPassword.trim())
      nextErrors.password =
        "Mật khẩu cần từ 15 ký tự và không quá 72 byte UTF-8.";
    if (!values.confirmPassword)
      nextErrors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    else if (values.confirmPassword.normalize("NFC") !== normalizedPassword)
      nextErrors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0] as
      RegisterField | undefined;
    if (firstInvalid) {
      const input = formRef.current?.elements.namedItem(firstInvalid);
      if (input instanceof HTMLInputElement) input.focus();
      return;
    }
    submitting.current = true;
    setPending("register");
    setServerError(null);
    try {
      const result = await registerAccount(values);
      if (result.success) {
        acceptChallenge(result.challenge);
        setValues((previous) => ({
          ...previous,
          email: previous.email.trim(),
          password: "",
          confirmPassword: "",
        }));
      } else {
        setServerError(result.error);
        if (result.error.fieldViolations)
          setErrors(result.error.fieldViolations);
        if (result.error.code === "PASSWORD_REJECTED")
          setErrors((previous) => ({
            ...previous,
            password: result.error.message,
          }));
        if (result.error.retryAfterSeconds) {
          const time = Date.now();
          setNow(time);
          setSendBlockedUntil(time + result.error.retryAfterSeconds * 1000);
        }
      }
    } finally {
      submitting.current = false;
      setPending(null);
    }
  }

  async function onVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || submitting.current || verifyCooldown) return;
    setOtpError("");
    setServerError(null);
    if (!/^[0-9]{6}$/.test(otp)) {
      setOtpError("Vui lòng nhập đủ 6 chữ số trong email.");
      otpRef.current?.focus();
      return;
    }
    if (!expiresIn) {
      setOtpError("Mã đã hết hạn. Vui lòng yêu cầu mã mới.");
      return;
    }
    submitting.current = true;
    setPending("verify");
    try {
      const result = await verifyRegistrationOtp({
        registrationId: challenge.registrationId,
        email: values.email,
        otp,
      });
      if (result.success) {
        const redirect = getSafeRedirectUrl(searchParams.get("redirect"));
        router.replace(
          `/login?registered=1&redirect=${encodeURIComponent(redirect)}`
        );
      } else {
        setServerError(result.error);
        if (
          result.error.code === "OTP_INVALID" ||
          result.error.code === "OTP_EXPIRED" ||
          result.error.fieldViolations?.otp
        ) {
          setOtpError(
            result.error.fieldViolations?.otp ?? result.error.message
          );
          setOtp("");
          otpRef.current?.focus();
        }
        if (result.error.retryAfterSeconds) {
          const time = Date.now();
          setNow(time);
          setVerifyBlockedUntil(time + result.error.retryAfterSeconds * 1000);
        }
      }
    } finally {
      submitting.current = false;
      setPending(null);
    }
  }

  async function resend() {
    if (!challenge || submitting.current || resendCooldown) return;
    submitting.current = true;
    setPending("resend");
    setServerError(null);
    setNotice("");
    try {
      const result = await resendRegistrationOtp({
        registrationId: challenge.registrationId,
        email: values.email,
      });
      if (result.success) {
        acceptChallenge(result.challenge);
        setNotice(result.challenge.message);
      } else {
        setServerError(result.error);
        if (result.error.retryAfterSeconds) {
          const time = Date.now();
          setNow(time);
          setSendBlockedUntil(time + result.error.retryAfterSeconds * 1000);
        }
      }
    } finally {
      submitting.current = false;
      setPending(null);
    }
  }

  function changeEmail() {
    if (submitting.current) return;
    setChallenge(null);
    setOtp("");
    setOtpError("");
    setServerError(null);
    setNotice("");
    // Server-side limits survive changing email or starting a new request.
  }

  return {
    formRef,
    otpRef,
    values,
    errors,
    passwordRules,
    showPassword,
    showConfirmation,
    challenge,
    otp,
    otpError,
    serverError,
    notice,
    pending,
    sendCooldown,
    resendCooldown,
    verifyCooldown,
    expiresIn,
    changeField,
    onSubmit,
    onVerify,
    resend,
    changeEmail,
    changeOtp: (value: string) => {
      setOtp(value.replace(/[^0-9]/g, "").slice(0, 6));
      setOtpError("");
    },
    togglePassword: () => setShowPassword((value) => !value),
    toggleConfirmation: () => setShowConfirmation((value) => !value),
  };
}
