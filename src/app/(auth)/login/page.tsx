import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Đăng nhập | MasterEnglish",
  description:
    "Đăng nhập để quay lại lộ trình học tiếng Anh và luyện thi TOEIC của bạn.",
};

export default function LoginPage() {
  return <LoginForm />;
}
