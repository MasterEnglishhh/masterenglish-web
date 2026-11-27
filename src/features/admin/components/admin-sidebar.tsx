"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpenCheck,
  LayoutDashboard,
  Sliders,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Mascot } from "@/components/mascot";
import { useAuthSession } from "@/features/auth";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";
import { getAdminNavItems } from "../data/navigation";

const iconMap = { LayoutDashboard, Users, BookOpenCheck, Sliders, Bell };

/** Thanh bên cổng quản trị. Chỉ SYSTEM_ADMIN thấy mục Người dùng và Hệ thống; backend vẫn là nơi phân quyền thật. */
export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthSession();
  const isSystemAdmin = Boolean(user?.roles?.includes("SYSTEM_ADMIN"));
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useSlidingIndicator(navRef, indicatorRef, pathname);

  const navItems = getAdminNavItems(isSystemAdmin);

  return (
    <aside
      className="admin-sidebar glass-card"
      aria-label="Điều hướng quản trị"
    >
      <div className="admin-sidebar-brand">
        <Brand />
        <span className="admin-brand-badge">
          {isSystemAdmin ? "ADMIN" : "GIẢNG VIÊN"}
        </span>
      </div>

      <span className="admin-sidebar-caption">
        {isSystemAdmin ? "CỔNG QUẢN TRỊ HỆ THỐNG" : "CỔNG BIÊN SOẠN HỌC LIỆU"}
      </span>

      <nav ref={navRef} className="admin-nav">
        <span
          ref={indicatorRef}
          className="slide-indicator"
          aria-hidden="true"
        />
        {navItems.map((item) => {
          const Icon =
            iconMap[item.iconName as keyof typeof iconMap] || LayoutDashboard;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span>{item.label}</span>
              {isActive && (
                <span className="admin-nav-dot" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <div className="admin-role-card">
          <Mascot
            expression="happy"
            idSuffix="-admin"
            className="side-mascot"
          />
          <strong>
            {isSystemAdmin ? "Quản trị hệ thống" : "Biên soạn và thẩm định"}
          </strong>
          <p>
            {isSystemAdmin
              ? "Quản lý người dùng, nội dung, cờ tính năng và nhật ký kiểm toán."
              : "Soạn từ vựng, bộ thẻ và duyệt nội dung chờ xuất bản."}
          </p>
        </div>
        {user?.roles.includes("LEARNER") && (
          <Link href="/learn" className="admin-back-link">
            <ArrowLeft size={14} aria-hidden="true" /> Khu vực học tập
          </Link>
        )}
        <Link href="/" className="admin-back-link">
          <ArrowLeft size={14} aria-hidden="true" /> Trang chủ
        </Link>
      </div>
    </aside>
  );
}
