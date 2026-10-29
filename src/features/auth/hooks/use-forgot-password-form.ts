"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} from "../lib/auth-client";
import { getSafeRedirectUrl } from "../lib/redirect";
import { useAuthSession } from "./use-auth-session";
import type {
  AuthError,
  PasswordResetChallenge,
  PasswordResetGrant,
} from "../types/auth";

export function useForgotPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { clearSession } = useAuthSession();
  const emailRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const active = useRef(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [challenge, setChallenge] = useState<PasswordResetChallenge | null>(
    null
  );
  const [grant, setGrant] = useState<PasswordResetGrant | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [fieldError, setFieldError] = useState("");
  const [pending, setPending] = useState(false);
  const [sendAt, setSendAt] = useState(0);
  const [verifyAt, setVerifyAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const stage = grant ? "password" : challenge ? "otp" : "email";
  const remaining = (date: number) =>
    Math.max(0, Math.ceil((date - now) / 1000));
  const sendCooldown = remaining(sendAt);
  const verifyCooldown = remaining(verifyAt);
  const expiresIn = remaining(
    Date.parse(grant?.expiresAt ?? challenge?.expiresAt ?? "")
  );
  const normalized = password.normalize("NFC");
  const passwordValid =
    [...normalized].length >= 15 &&
    new TextEncoder().encode(normalized).length <= 72 &&
    !!normalized.trim();
  useEffect(() => {
    if (!challenge && !grant && sendAt <= Date.now() && verifyAt <= Date.now())
      return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [challenge, grant, sendAt, verifyAt]);
  useEffect(() => {
    if (stage === "otp") otpRef.current?.focus();
    if (stage === "password") passwordRef.current?.focus();
  }, [stage]);
  function fail(next: AuthError, action: "send" | "verify" | "reset") {
    setError(next);
    if (next.retryAfterSeconds) {
      const time = Date.now();
      setNow(time);
      if (action === "send") setSendAt(time + next.retryAfterSeconds * 1000);
      else setVerifyAt(time + next.retryAfterSeconds * 1000);
    }
  }
  async function send() {
    if (active.current || sendCooldown) return;
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.trim().length > 254
    ) {
      setFieldError("Vui lòng nhập email hợp lệ.");
      emailRef.current?.focus();
      return;
    }
    active.current = true;
    setPending(true);
    setError(null);
    setFieldError("");
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        const time = Date.now();
        setNow(time);
        setEmail(email.trim());
        setChallenge(result.data);
        setGrant(null);
        setOtp("");
        setSendAt(time + result.data.resendAfterSeconds * 1000);
      } else fail(result.error, "send");
    } finally {
      active.current = false;
      setPending(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current) return;
    if (stage === "email") {
      await send();
      return;
    }
    if (verifyCooldown) return;
    setError(null);
    setFieldError("");
    if (stage === "otp") {
      if (!/^[0-9]{6}$/.test(otp)) {
        setFieldError("Vui lòng nhập đủ 6 chữ số.");
        otpRef.current?.focus();
        return;
      }
      if (!expiresIn) {
        setFieldError("Mã đã hết hạn. Vui lòng yêu cầu mã mới.");
        return;
      }
      active.current = true;
      setPending(true);
      try {
        const result = await verifyPasswordResetOtp({
          email,
          challengeId: challenge!.challengeId,
          otp,
        });
        if (result.success) {
          setNow(Date.now());
          setGrant(result.data);
          setOtp("");
        } else {
          fail(result.error, "verify");
          setOtp("");
          otpRef.current?.focus();
        }
      } finally {
        active.current = false;
        setPending(false);
      }
      return;
    }
    if (!passwordValid) {
      setFieldError(
        "Mật khẩu cần ít nhất 15 ký tự và không quá 72 byte UTF-8."
      );
      passwordRef.current?.focus();
      return;
    }
    if (confirmation.normalize("NFC") !== normalized) {
      setFieldError("Mật khẩu nhập lại chưa khớp.");
      return;
    }
    if (!expiresIn) {
      setFieldError(
        "Quyền đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu OTP mới."
      );
      return;
    }
    active.current = true;
    setPending(true);
    try {
      const result = await resetPassword({
        email,
        resetToken: grant!.resetToken,
        newPassword: password,
      });
      if (result.success) {
        setPassword("");
        setConfirmation("");
        setGrant(null);
        clearSession();
        router.replace(
          `/login?reset=1&redirect=${encodeURIComponent(getSafeRedirectUrl(params.get("redirect")))}`
        );
      } else fail(result.error, "reset");
    } finally {
      active.current = false;
      setPending(false);
    }
  }
  function restart() {
    if (active.current) return;
    setChallenge(null);
    setGrant(null);
    setOtp("");
    setPassword("");
    setConfirmation("");
    setError(null);
    setFieldError("");
  }
  return {
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
    changeEmail: (value: string) => {
      setEmail(value);
      setFieldError("");
      if (!sendCooldown) setError(null);
    },
    changeOtp: (value: string) => {
      setOtp(value.replace(/[^0-9]/g, "").slice(0, 6));
      setFieldError("");
      setError(null);
    },
    changePassword: (value: string) => {
      setPassword(value);
      setFieldError("");
      setError(null);
    },
    changeConfirmation: (value: string) => {
      setConfirmation(value);
      setFieldError("");
    },
    togglePassword: () => setVisible((value) => !value),
    toggleConfirmation: () => setConfirmationVisible((value) => !value),
  };
}
