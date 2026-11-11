"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpenCheck,
  Sliders,
  ArrowLeft,
  Database,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { adminNavItems } from "../data/navigation";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";

const iconMap = {
  LayoutDashboard,
  Users,
  BookOpenCheck,
  Sliders,
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthSession();
  const isSystemAdmin = Boolean(user?.roles?.includes("SYSTEM_ADMIN"));

  const navItems = adminNavItems.filter((item) => {
    // Only SYSTEM_ADMIN can see User Management and System Policies
    if (item.href === "/admin/users" || item.href === "/admin/system") {
      return isSystemAdmin;
    }
    return true;
  });

  return (
    <aside className="admin-sidebar" aria-label="Điều hướng quản trị">
      <div className="admin-sidebar-brand">
        <Brand />
        <span className="admin-brand-badge">
          {isSystemAdmin ? "SYSTEM ADMIN" : "GIẢNG VIÊN"}
        </span>
      </div>

      <div className="admin-sidebar-caption">
        {isSystemAdmin ? "CỔNG QUẢN TRỊ HỆ THỐNG" : "CỔNG BIÊN SOẠN HỌC LIỆU"}
      </div>

      <nav className="admin-nav">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.iconName as keyof typeof iconMap] || LayoutDashboard;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive ? "active" : ""}`}
            >
              <IconComponent size={18} strokeWidth={2} />
              <span>{item.label}</span>
              {isActive && <span className="admin-nav-dot" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        {isSystemAdmin ? (
          <div className="admin-system-mini-card">
            <strong>HỆ THỐNG MASTERENGLISH</strong>
            <p style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <ShieldCheck size={14} color="#059669" /> Actuator API: Hoạt động
            </p>
            <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Database size={14} color="#5a54e8" /> Cloudflare R2: Sẵn sàng
            </p>
          </div>
        ) : (
          <div className="admin-system-mini-card">
            <strong>VAI TRÒ: GIẢNG VIÊN</strong>
            <p style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <GraduationCap size={14} color="#059669" /> Biên soạn & Thẩm định
            </p>
            <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpenCheck size={14} color="#5a54e8" /> Phân hệ M08: Content Ops
            </p>
          </div>
        )}

        <Link href="/learn" className="admin-back-link">
          <ArrowLeft size={14} /> Khu vực học tập
        </Link>
        <Link href="/" className="admin-back-link">
          <ArrowLeft size={14} /> Trang chủ
        </Link>
      </div>
    </aside>
  );
}
