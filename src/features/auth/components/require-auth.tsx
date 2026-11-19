"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "../hooks/use-auth-session";
import { getRoleHome } from "../lib/redirect";

export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SessionPending />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

function SessionPending() {
  return (
    <main className="session-status" role="status">
      Đang kiểm tra phiên đăng nhập...
    </main>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading, error, refreshSession } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const canLearn = user?.roles.includes("LEARNER") ?? false;

  useEffect(() => {
    if (isLoading || error) return;

    if (!user) {
      const target = `${pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    } else if (!canLearn) {
      const home = getRoleHome(user.roles);
      router.replace(home === "/admin" && pathname === "/learn/account" ? "/admin/account" : home);
    }
  }, [user, isLoading, error, canLearn, pathname, query, router]);

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
  if (isLoading || !user) return <SessionPending />;
  if (!canLearn) return null;
  return children;
}
