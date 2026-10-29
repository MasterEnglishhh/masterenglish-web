"use client";

import { useRef, useState, type FormEvent } from "react";

type RegisterField =
  "lastName" | "firstName" | "email" | "password" | "confirmPassword";
type RegisterValues = Record<RegisterField, string>;
type RegisterErrors = Partial<Record<RegisterField, string>>;

export function useRegisterForm() {
  const formRef = useRef<HTMLFormElement>(null);
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
  const [isPreviewComplete, setIsPreviewComplete] = useState(false);

  const passwordRules = [
    { label: "Ít nhất 8 ký tự", met: values.password.length >= 8 },
    {
      label: "Có cả chữ và số",
      met: /\p{L}/u.test(values.password) && /\d/.test(values.password),
    },
  ];

  function changeField(field: RegisterField, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
      ...(field === "password" ? { confirmPassword: undefined } : {}),
    }));
    setIsPreviewComplete(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (!passwordRules.every((rule) => rule.met))
      nextErrors.password = "Mật khẩu cần ít nhất 8 ký tự, có cả chữ và số.";
    if (!values.confirmPassword)
      nextErrors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    else if (values.confirmPassword !== values.password)
      nextErrors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
    setErrors(nextErrors);
    setIsPreviewComplete(false);
    const firstInvalid = Object.keys(nextErrors)[0] as
      RegisterField | undefined;
    if (firstInvalid) {
      const input = formRef.current?.elements.namedItem(firstInvalid);
      if (input instanceof HTMLInputElement) input.focus();
      return;
    }
    // UI preview only: registration and email verification APIs are not available.
    setIsPreviewComplete(true);
  }

  return {
    formRef,
    values,
    errors,
    passwordRules,
    showPassword,
    showConfirmation,
    isPreviewComplete,
    changeField,
    onSubmit,
    togglePassword: () => setShowPassword((value) => !value),
    toggleConfirmation: () => setShowConfirmation((value) => !value),
  };
}
