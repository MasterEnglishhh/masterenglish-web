"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { useAuthSession } from "../hooks/use-auth-session";

export function WorkspaceSwitcher() {
  const { user, isLoading } = useAuthSession();
  const pathname = usePathname();
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const inLearning = pathname === "/learn" || pathname.startsWith("/learn/");
  const canAdmin = user?.roles.some(
    (role) => role === "SYSTEM_ADMIN" || role === "CONTENT_ADMIN"
  );
  if (
    isLoading ||
    !canAdmin ||
    !user?.roles.includes("LEARNER") ||
    (!inAdmin && !inLearning)
  )
    return null;

  const label = inAdmin ? "Về học tập" : "Sang quản trị";
  return (
    <Link
      className="btn-ghost workspace-switcher"
      href={inAdmin ? "/learn" : "/admin"}
      aria-label={label}
    >
      <ArrowLeftRight size={16} aria-hidden="true" />
      <span className="workspace-switcher-label">{label}</span>
      <span className="workspace-switcher-short" aria-hidden="true">
        {inAdmin ? "Học tập" : "Quản trị"}
      </span>
    </Link>
  );
}
