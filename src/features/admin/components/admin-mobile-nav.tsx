"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";
import { useAuthSession } from "@/features/auth";
import { getAdminNavItems } from "../data/navigation";

/** Điều hướng quản trị trên màn hẹp: thanh cuộn ngang, khối nền mục đang chọn trượt và tự cuộn vào vùng nhìn. */
export function AdminMobileNav() {
  const pathname = usePathname();
  const { user } = useAuthSession();
  const navItems = getAdminNavItems(user?.roles.includes("SYSTEM_ADMIN") ?? false);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useSlidingIndicator(navRef, indicatorRef, pathname, { scrollIntoView: true });

  return (
    <nav ref={navRef} className="admin-mobile-nav" aria-label="Điều hướng quản trị">
      <span ref={indicatorRef} className="slide-indicator" aria-hidden="true" />
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
