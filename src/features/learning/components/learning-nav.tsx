"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";
import { learningNavigation } from "../data/navigation";

/** Thanh điều hướng khu học. Khối nền mục đang chọn trượt (dọc ở thanh bên, ngang ở thanh cuộn của điện thoại). */
export function LearningNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useSlidingIndicator(navRef, indicatorRef, pathname, { scrollIntoView: true });

  return (
    <nav ref={navRef} className="learning-nav" aria-label="Điều hướng học tập">
      <span ref={indicatorRef} className="slide-indicator" aria-hidden="true" />
      {learningNavigation.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
