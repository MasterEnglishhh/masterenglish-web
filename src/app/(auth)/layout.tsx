import { Suspense, type ReactNode } from "react";
import { AuthLayout } from "@/features/auth";

/**
 * Khung dùng chung cho /login, /register, /forgot-password. Layout không bị dựng lại khi đổi giữa ba trang này,
 * nên thanh tab và sân khấu bên trái đứng yên, chỉ phần nội dung trượt.
 * AuthLayout dùng useSearchParams nên cần Suspense (bắt buộc với static export).
 */
export default function AuthRouteLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="auth-shell app-pastel-bg" />}>
      <AuthLayout>{children}</AuthLayout>
    </Suspense>
  );
}
