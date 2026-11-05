"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { adminNavItems } from "../data/navigation";

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminTopbar />

        <div className="admin-mobile-nav" style={{ display: "none" }}>
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`btn-3d-outline btn-sm ${pathname === item.href ? "btn-3d-dark" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <main className="admin-content">{children}</main>

        <footer style={{ padding: "20px clamp(20px, 4vw, 56px)", borderTop: "1px solid #e9eae5", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--muted)" }}>
          <span>© 2026 MasterEnglish — Phân hệ Quản trị & Vận hành</span>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/learn" style={{ color: "var(--indigo)", fontWeight: 600 }}>Khu học tập</Link>
            <Link href="/" style={{ color: "var(--indigo)", fontWeight: 600 }}>Trang chủ</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
