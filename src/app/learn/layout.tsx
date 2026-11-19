import { Suspense } from "react";
import { LearningShell } from "@/features/learning";
import { RequireAuth } from "@/features/auth";

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="session-status app-pastel-bg" role="status">
          Đang kiểm tra phiên đăng nhập...
        </main>
      }
    >
      <RequireAuth>
        <LearningShell>{children}</LearningShell>
      </RequireAuth>
    </Suspense>
  );
}
