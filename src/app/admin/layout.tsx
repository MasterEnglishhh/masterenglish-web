import { Suspense, type ReactNode } from "react";
import { RequireAdmin } from "@/features/admin/components/require-admin";
import { AdminLayoutShell } from "@/features/admin/components/admin-layout-shell";

export const metadata = {
  title: "Quản trị hệ thống | MasterEnglish Admin",
  description: "Cổng quản trị người dùng, nội dung học tập và hạ tầng MasterEnglish",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="session-status" role="status">
          Đang khởi tạo cổng quản trị...
        </main>
      }
    >
      <RequireAdmin>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </RequireAdmin>
    </Suspense>
  );
}
