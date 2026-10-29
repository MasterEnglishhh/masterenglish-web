"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { learningNavigation } from "../data/navigation";

export function LearningNav() {
  const pathname = usePathname();
  return <nav className="learning-nav" aria-label="Điều hướng học tập">{learningNavigation.map(item => <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""} aria-current={pathname === item.href ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{pathname === item.href && <span className="nav-active-dot" />}</Link>)}</nav>;
}
