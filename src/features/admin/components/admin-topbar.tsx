"use client";

import { usePathname } from "next/navigation";
import { AccountMenu } from "@/features/auth/components/account-menu";

export function AdminTopbar() {
  const pathname = usePathname();

  let sectionLabel = "TỔNG QUAN / OVERVIEW";
  if (pathname.includes("/users")) {
    sectionLabel = "TÀI KHOẢN & PHÂN QUYỀN / USERS & ROLES";
  } else if (pathname.includes("/content")) {
    sectionLabel = "QUẢN TRỊ NỘI DUNG / CONTENT OPS";
  } else if (pathname.includes("/system")) {
    sectionLabel = "CHÍNH SÁCH & NHẬT KÝ / SYSTEM & AUDIT";
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-breadcrumb">
        <span>✳</span>
        <span>{sectionLabel}</span>
      </div>

      <div className="admin-topbar-actions">
        <div className="admin-health-pill">
          <span className="admin-health-dot" aria-hidden="true" />
          <span>API Spring Boot: OK</span>
        </div>
        <AccountMenu />
      </div>
    </header>
  );
}
