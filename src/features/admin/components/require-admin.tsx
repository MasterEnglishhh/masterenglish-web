"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuthSession } from "@/features/auth";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthSession();

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

  // Chỉ tài khoản có vai trò quản trị mới thấy giao diện. Đây là kiểm soát điều hướng
  // phía client; backend vẫn xác thực và phân quyền mọi API /api/v1/admin/*.
  if (hasAdminRole) {
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

export function RequireSystemAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <main className="session-status" role="status">
        Đang xác thực quyền hạn...
      </main>
    );
  }

  const isSystemAdmin = Boolean(user?.roles?.includes("SYSTEM_ADMIN"));

  if (isSystemAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="admin-card" style={{ maxWidth: 580, margin: "40px auto", padding: 36, textAlign: "center" }}>
      <span className="admin-kicker">403 / TRUY CẬP GIỚI HẠN</span>
      <h2 className="admin-title" style={{ fontSize: 26, margin: "14px 0 10px" }}>
        Quyền hạn <em>SYSTEM_ADMIN</em>
      </h2>
      <p className="admin-description" style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Tính năng này thuộc phân hệ Quản trị hệ thống (M09), chỉ dành riêng cho tài khoản Quản trị viên tối cao. Giảng viên (CONTENT_ADMIN) có quyền biên soạn và thẩm định học liệu tại phân hệ Quản trị nội dung (M08).
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Link href="/admin/content" className="btn-3d-lime">
          ← Chuyển đến Quản trị Nội dung
        </Link>
        <Link href="/admin" className="btn-3d-outline">
          Về Tổng quan
        </Link>
      </div>
    </div>
  );
}
