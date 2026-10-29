"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "../hooks/use-auth-session";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, error, refreshSession } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    if (!isLoading && !error && !user) {
      const target = `${pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [user, isLoading, error, pathname, query, router]);

  if (error) {
    return (
      <main className="session-status" role="alert">
        <p>{error}</p>
        <button
          className="button button-dark"
          type="button"
          onClick={() => void refreshSession()}
        >
          Thử lại
        </button>
      </main>
    );
  }
  if (isLoading || !user)
    return (
      <main className="session-status" role="status">
        Đang kiểm tra phiên đăng nhập...
      </main>
    );
  return children;
}
