import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout, LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Đăng nhập | MasterEnglish",
  description:
    "Đăng nhập để quay lại lộ trình học tiếng Anh và luyện thi TOEIC của bạn.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <AuthLayout mode="login">
        <LoginForm />
      </AuthLayout>
    </Suspense>
  );
}
