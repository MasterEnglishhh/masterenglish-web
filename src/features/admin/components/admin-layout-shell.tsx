"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AdminContentTransition } from "./admin-content-transition";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import "../styles/admin.css";

/** Khung cổng quản trị: nền pastel, thanh bên kính (màn rộng), thanh đầu, điều hướng ngang (màn hẹp) và chân trang. */
export function AdminLayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell app-pastel-bg">
      <AdminSidebar />
      <div className="admin-main">
        <AdminTopbar />

        <AdminMobileNav />

        <main className="admin-content">
          <AdminContentTransition>{children}</AdminContentTransition>
        </main>

        <footer className="admin-footer">
          <span>© 2026 MasterEnglish · Cổng quản trị</span>
          <nav aria-label="Liên kết cuối trang quản trị">
            <Link href="/">Trang chủ</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
