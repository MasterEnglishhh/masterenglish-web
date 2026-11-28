"use client";

import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { AccountActions } from "@/features/auth";

function sectionLabel(pathname: string) {
  if (pathname.includes("/users")) return "TÀI KHOẢN & PHÂN QUYỀN";
  if (pathname.includes("/content")) return "QUẢN TRỊ NỘI DUNG";
  if (pathname.includes("/system")) return "CHÍNH SÁCH & NHẬT KÝ";
  if (pathname === "/admin/account") return "TÀI KHOẢN CÁ NHÂN";
  return "TỔNG QUAN";
}

export function AdminTopbar() {
  const pathname = usePathname();
  return (
    <header className="admin-topbar glass-card">
      <div className="admin-topbar-brand">
        <Brand />
      </div>
      <div className="admin-topbar-breadcrumb">
        <span aria-hidden="true">✳</span>
        <span>{sectionLabel(pathname)}</span>
      </div>
      <AccountActions />
    </header>
  );
}
