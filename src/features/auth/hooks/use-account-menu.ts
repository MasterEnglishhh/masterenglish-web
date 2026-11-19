"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "./use-auth-session";

/** Trạng thái của menu tài khoản: mở/đóng (đóng khi bấm ra ngoài hoặc nhấn Esc) và đăng xuất. */
export function useAccountMenu() {
  const { user, isLoading, logout } = useAuthSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

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

  return {
    user,
    isLoading,
    open,
    toggle: () => setOpen((value) => !value),
    close,
    rootRef,
    triggerRef,
    isSigningOut,
    logoutError,
    handleLogout,
  };
}
