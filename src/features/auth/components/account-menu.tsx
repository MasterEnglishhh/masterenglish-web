"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../hooks/use-auth-session";

export function AccountMenu() {
  const { user, isLoading, logout } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsSigningOut(true);
    setLogoutError(false);
    const ok = await logout();
    setIsSigningOut(false);
    if (ok) {
      router.replace("/login");
      router.refresh();
    } else {
      setLogoutError(true);
    }
  }

  if (isLoading)
    return (
      <span className="account-name" role="status">
        Đang tải tài khoản...
      </span>
    );
  if (!user)
    return (
      <Link className="header-login" href="/login">
        Đăng nhập
      </Link>
    );
  const name =
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email;

  const isAdmin = user.roles.some(
    (r) => r === "SYSTEM_ADMIN" || r === "CONTENT_ADMIN"
  );

  const getRoleBadge = () => {
    if (user.roles.includes("SYSTEM_ADMIN")) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 750,
            padding: "2px 8px",
            borderRadius: 99,
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
          }}
        >
          Quản trị viên
        </span>
      );
    }
    if (user.roles.includes("CONTENT_ADMIN")) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 750,
            padding: "2px 8px",
            borderRadius: 99,
            background: "var(--lime)",
            color: "var(--ink)",
            border: "1px solid #bbf7d0",
          }}
        >
          Giảng viên
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 99,
          background: "#f1f1eb",
          color: "var(--muted)",
        }}
      >
        Học viên
      </span>
    );
  };

  return (
    <div className="account-menu">
      {isAdmin && (
        <Link
          href="/admin"
          className="admin-brand-badge"
          style={{ textDecoration: "none", marginRight: 4 }}
        >
          Quản trị ↗
        </Link>
      )}
      {getRoleBadge()}
      <span className="account-name" title={user.email}>
        {name}
      </span>
      <button
        type="button"
        className="account-logout"
        disabled={isSigningOut}
        onClick={() => void handleLogout()}
      >
        {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
      {logoutError && (
        <span className="account-error" role="alert">
          Chưa thể đăng xuất. Vui lòng thử lại.
        </span>
      )}
    </div>
  );
}
