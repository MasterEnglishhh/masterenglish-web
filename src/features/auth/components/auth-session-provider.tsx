"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser, logout as apiLogout } from "../lib/auth-client";
import type { AuthUser } from "../types/auth";

interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<AuthUser | null>;
  acceptLogin: (user: AuthUser) => void;
  logout: () => Promise<boolean>;
  clearSession: () => void;
}

export const AuthSessionContext = createContext<AuthSession | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef(0);
  const signingOut = useRef(false);

  const refreshSession = useCallback(async () => {
    if (signingOut.current) return null;
    const requestRevision = ++revision.current;
    try {
      const current = await getCurrentUser();
      if (requestRevision === revision.current) {
        setUser(current);
        setError(null);
      }
      return current;
    } catch {
      if (requestRevision === revision.current) {
        setError(
          "Không thể kiểm tra phiên đăng nhập. Vui lòng kiểm tra kết nối và thử lại."
        );
      }
      return null;
    } finally {
      if (requestRevision === revision.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.resolve().then(() => {
      if (mounted) void refreshSession();
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshSession]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(
      () => {
        if (document.visibilityState === "visible") void refreshSession();
      },
      5 * 60 * 1000
    );
    return () => window.clearInterval(timer);
  }, [user, refreshSession]);

  const acceptLogin = useCallback((current: AuthUser) => {
    ++revision.current;
    setUser(current);
    setError(null);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    if (signingOut.current) return false;
    signingOut.current = true;
    ++revision.current;
    try {
      const ok = await apiLogout();
      if (ok) setUser(null);
      // The account control shows logout failure without hiding the learning UI.
      if (ok) setError(null);
      setIsLoading(false);
      return ok;
    } finally {
      signingOut.current = false;
    }
  }, []);

  const clearSession = useCallback(() => {
    ++revision.current;
    setUser(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return (
    <AuthSessionContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        refreshSession,
        acceptLogin,
        logout,
        clearSession,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}
