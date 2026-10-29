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

  return (
    <div className="account-menu">
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
