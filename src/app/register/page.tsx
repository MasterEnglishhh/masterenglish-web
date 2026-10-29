import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout, RegisterForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Tạo tài khoản | MasterEnglish",
  description:
    "Tạo tài khoản học viên để bắt đầu hành trình học tiếng Anh và luyện thi TOEIC.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <AuthLayout mode="register">
        <RegisterForm />
      </AuthLayout>
    </Suspense>
  );
}
