"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { Mascot } from "@/components/mascot";
import { useAuthSession } from "@/features/auth";

function AdminSignIn() {
  return (
    <div className="glass-card admin-denied-card">
      <h1 className="admin-title">
        Đăng nhập để vào <em>khu vực quản trị</em>
      </h1>
      <p className="admin-description">
        Bạn cần phiên đăng nhập bằng tài khoản quản trị.
      </p>
      <div className="admin-denied-actions">
        <Link href="/login?redirect=/admin" className="btn-primary">
          Đăng nhập tài khoản Admin
        </Link>
        <Link href="/learn" className="btn-ghost">
          Về Không gian học tập
        </Link>
      </div>
    </div>
  );
}

/**
 * Chỉ tài khoản có vai trò quản trị mới thấy giao diện. Đây là kiểm soát điều hướng phía client;
 * backend vẫn xác thực và phân quyền mọi API /api/v1/admin/*.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading, error, refreshSession } = useAuthSession();

  if (isLoading) {
    return (
      <main className="session-status app-pastel-bg" role="status">
        Đang kiểm tra quyền truy cập hệ thống...
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="admin-denied app-pastel-bg">
        {error ? (
          <ErrorState
            title="Chưa xác minh được phiên đăng nhập"
            message={error}
            onRetry={refreshSession}
            idSuffix="-admin-session"
          />
        ) : (
          <AdminSignIn />
        )}
      </main>
    );
  }

  const hasAdminRole = user.roles.some(
    (role) => role === "SYSTEM_ADMIN" || role === "CONTENT_ADMIN"
  );
  if (hasAdminRole) return <>{children}</>;

  return (
    <div className="admin-denied app-pastel-bg">
      <main className="glass-card admin-denied-card">
        <Mascot
          expression="thinking"
          idSuffix="-denied"
          className="admin-denied-mascot"
        />
        <span className="admin-kicker">403 / TRUY CẬP GIỚI HẠN</span>
        <h1 className="admin-title">
          Khu vực dành cho <em>Quản trị viên</em>
        </h1>
        <p className="admin-description">
          Tài khoản {user.email} cần vai trò SYSTEM_ADMIN hoặc CONTENT_ADMIN để
          truy cập khu vực này.
        </p>
        <div className="admin-denied-actions">
          <Link href="/learn" className="btn-ghost">
            ← Quay về Không gian học tập
          </Link>
        </div>
      </main>
    </div>
  );
}

export function RequireSystemAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading, error, refreshSession } = useAuthSession();

  if (isLoading) {
    return (
      <p className="admin-card-note" role="status">
        Đang xác thực quyền hạn...
      </p>
    );
  }

  if (error)
    return (
      <ErrorState
        title="Chưa xác minh được phiên đăng nhập"
        message={error}
        onRetry={refreshSession}
        idSuffix="-system-admin-session"
      />
    );
  if (!user) return <AdminSignIn />;
  if (user.roles.includes("SYSTEM_ADMIN")) return <>{children}</>;

  return (
    <div className="glass-card admin-denied-card">
      <Mascot
        expression="thinking"
        idSuffix="-denied-sys"
        className="admin-denied-mascot"
      />
      <span className="admin-kicker">403 / TRUY CẬP GIỚI HẠN</span>
      <h2 className="admin-title">
        Quyền hạn <em>SYSTEM_ADMIN</em>
      </h2>
      <p className="admin-description">
        Tính năng này thuộc phần quản trị hệ thống, chỉ dành cho tài khoản Quản
        trị viên tối cao. Giảng viên (CONTENT_ADMIN) có quyền biên soạn và thẩm
        định học liệu ở phần Quản trị nội dung.
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
