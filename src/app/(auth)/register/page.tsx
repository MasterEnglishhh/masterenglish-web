import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Tạo tài khoản | MasterEnglish",
  description:
    "Tạo tài khoản học viên để bắt đầu hành trình học tiếng Anh và luyện thi TOEIC.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
