"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { ArrowIcon } from "@/components/arrow-icon";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthSession();
  const [demoBypass, setDemoBypass] = useState(false);

  if (isLoading) {
    return (
      <main className="session-status" role="status">
        Đang kiểm tra quyền truy cập hệ thống...
      </main>
    );
  }

  const hasAdminRole = Boolean(
    user?.roles?.some((r) => r === "SYSTEM_ADMIN" || r === "CONTENT_ADMIN")
  );

  // Allow authorized admin or explicit demo view
  if (hasAdminRole || demoBypass) {
    return <>{children}</>;
  }

  // Fallback 403 screen formatted in MasterEnglish visual style
  return (
    <div className="site-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <main className="admin-card" style={{ maxWidth: 540, width: "100%", padding: 36, textAlign: "center" }}>
        <span className="admin-kicker">403 / TRUY CẬP GIỚI HẠN</span>
        <h1 className="admin-title" style={{ fontSize: 32, margin: "16px 0 12px" }}>
          Khu vực dành cho <em>Quản trị viên</em>
        </h1>
        <p className="admin-description" style={{ margin: "0 auto 28px", fontSize: 14 }}>
          {user
            ? `Tài khoản ${user.email} đang có vai trò (${user.roles.join(", ") || "Học viên"}), chưa được cấp quyền SYSTEM_ADMIN hoặc CONTENT_ADMIN.`
            : "Bạn cần đăng nhập bằng tài khoản quản trị hệ thống hoặc người kiểm duyệt nội dung."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            className="btn-3d-lime"
            onClick={() => setDemoBypass(true)}
            style={{ width: "100%" }}
          >
            Trải nghiệm giao diện với quyền Quản trị (Demo) <ArrowIcon />
          </button>

          <Link href="/learn" className="btn-3d-outline" style={{ width: "100%" }}>
            ← Quay về Không gian học tập
          </Link>

          {!user && (
            <Link href="/login?redirect=/admin" className="btn-3d-dark" style={{ width: "100%" }}>
              Đăng nhập tài khoản Admin
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
