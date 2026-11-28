"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { useAccountMenu } from "../hooks/use-account-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";
import type { AuthUser } from "../types/auth";
import "../styles/account-menu.css";

function displayName(user: AuthUser) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function roleOf(user: AuthUser) {
  if (user.roles.includes("SYSTEM_ADMIN")) return { key: "admin", label: "Quản trị viên" };
  if (user.roles.includes("CONTENT_ADMIN")) return { key: "content", label: "Giảng viên" };
  return { key: "learner", label: "Học viên" };
}

/** Menu tài khoản dạng thả xuống: gọn ở mọi cỡ màn hình, không làm tràn thanh đầu trang. */
export function AccountMenu() {
  const pathname = usePathname();
  const { user, isLoading, open, toggle, close, rootRef, triggerRef, isSigningOut, logoutError, handleLogout } =
    useAccountMenu();
  const panelId = useId();

  // Chiếm chỗ vô hình trong lúc tải phiên để thanh đầu trang không xô lệch.
  if (isLoading) return <span className="account-trigger is-placeholder" aria-hidden="true" />;
  if (!user) {
    return (
      <Link className="header-login" href="/login">
        Đăng nhập
      </Link>
    );
  }

  const name = displayName(user);
  const role = roleOf(user);
  const isAdmin = user.roles.some((r) => r === "SYSTEM_ADMIN" || r === "CONTENT_ADMIN");
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const inLearning = pathname === "/learn" || pathname.startsWith("/learn/");
  const accountHref = isAdmin && (inAdmin || !user.roles.includes("LEARNER")) ? "/admin/account" : "/learn/account";

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="account-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Tài khoản của ${name}`}
        onClick={toggle}
      >
        <span className="account-avatar" aria-hidden="true">
          {name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="account-trigger-name">{name}</span>
        <span className="account-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="account-panel glass-card" id={panelId}>
          <div className="account-panel-head">
            <strong>{name}</strong>
            <small>{user.email}</small>
            <span className={`role-badge role-badge-${role.key}`}>{role.label}</span>
          </div>
          <Link className="account-item" href={accountHref} onClick={() => close()}>
            Tài khoản của tôi
          </Link>
          {isAdmin && !inAdmin && !inLearning && (
            <Link className="account-item" href="/admin" onClick={() => close()}>
              Cổng quản trị ↗
            </Link>
          )}
          <button
            type="button"
            className="account-item account-item-danger"
            disabled={isSigningOut}
            onClick={() => void handleLogout()}
          >
            {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
          {logoutError && (
            <p className="account-error" role="alert">
              Chưa thể đăng xuất. Vui lòng thử lại.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountActions() {
  return (
    <div className="header-account-actions">
      <WorkspaceSwitcher />
      <AccountMenu />
    </div>
  );
}
