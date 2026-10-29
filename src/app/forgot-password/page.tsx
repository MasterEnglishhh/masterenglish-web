import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout, ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Quên mật khẩu | MasterEnglish",
  description: "Khôi phục mật khẩu tài khoản MasterEnglish của bạn.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <AuthLayout mode="forgot">
        <ForgotPasswordForm />
      </AuthLayout>
    </Suspense>
  );
}
