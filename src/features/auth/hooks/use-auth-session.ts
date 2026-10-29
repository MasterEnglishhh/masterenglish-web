"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, logout as apiLogout } from "../lib/auth-client";
import type { AuthUser } from "../types/auth";

export function useAuthSession() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((current) => {
        if (!cancelled) {
          setUser(current);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
      return current;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    const ok = await apiLogout();
    if (ok) {
      setUser(null);
    }
    return ok;
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    refreshSession,
    logout,
  };
}
