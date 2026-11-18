"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { useAuthSession } from "@/features/auth";

/**
 * Chỉ tài khoản có vai trò quản trị mới thấy giao diện. Đây là kiểm soát điều hướng phía client;
 * backend vẫn xác thực và phân quyền mọi API /api/v1/admin/*.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <main className="session-status app-pastel-bg" role="status">
        Đang kiểm tra quyền truy cập hệ thống...
      </main>
    );
  }

  const hasAdminRole = Boolean(user?.roles?.some((r) => r === "SYSTEM_ADMIN" || r === "CONTENT_ADMIN"));
  if (hasAdminRole) return <>{children}</>;

  return (
    <div className="admin-denied app-pastel-bg">
      <main className="glass-card admin-denied-card">
        <Mascot expression="thinking" idSuffix="-denied" className="admin-denied-mascot" />
        <span className="admin-kicker">403 / TRUY CẬP GIỚI HẠN</span>
        <h1 className="admin-title">
          Khu vực dành cho <em>Quản trị viên</em>
        </h1>
        <p className="admin-description">
          {user
            ? `Tài khoản ${user.email} đang có vai trò (${user.roles.join(", ") || "Học viên"}), chưa được cấp quyền SYSTEM_ADMIN hoặc CONTENT_ADMIN.`
            : "Bạn cần đăng nhập bằng tài khoản quản trị hệ thống hoặc người kiểm duyệt nội dung."}
        </p>
        <div className="admin-denied-actions">
          <Link href="/learn" className="btn-ghost">
            ← Quay về Không gian học tập
          </Link>
          {!user && (
            <Link href="/login?redirect=/admin" className="btn-primary">
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
      <p className="admin-card-note" role="status">
        Đang xác thực quyền hạn...
      </p>
    );
  }

  if (user?.roles?.includes("SYSTEM_ADMIN")) return <>{children}</>;

  return (
    <div className="glass-card admin-denied-card">
      <Mascot expression="thinking" idSuffix="-denied-sys" className="admin-denied-mascot" />
      <span className="admin-kicker">403 / TRUY CẬP GIỚI HẠN</span>
      <h2 className="admin-title">
        Quyền hạn <em>SYSTEM_ADMIN</em>
      </h2>
      <p className="admin-description">
        Tính năng này thuộc phần quản trị hệ thống, chỉ dành cho tài khoản Quản trị viên tối cao. Giảng viên
        (CONTENT_ADMIN) có quyền biên soạn và thẩm định học liệu ở phần Quản trị nội dung.
      </p>
      <div className="admin-denied-actions">
        <Link href="/admin/content" className="btn-lime">
          ← Chuyển đến Quản trị Nội dung
        </Link>
        <Link href="/admin" className="btn-ghost">
          Về Tổng quan
        </Link>
      </div>
    </div>
  );
}
