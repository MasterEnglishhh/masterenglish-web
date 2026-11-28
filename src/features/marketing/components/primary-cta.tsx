"use client";

import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { getRoleHome, useAuthSession } from "@/features/auth";

/**
 * Nút chính của trang. Mặc định là bản dành cho khách; khi phiên đã xác nhận có người dùng thì
 * đổi nhãn và đích. Chiều rộng tối thiểu cố định để đổi nhãn không làm trang xô lệch.
 */
export function PrimaryCta({ className = "" }: { className?: string }) {
  const { user } = useAuthSession();
  const href = user ? getRoleHome(user.roles) : "/register";
  return (
    <Link className={`lp-btn lp-btn-primary ${className}`} href={href}>
      <span>
        {!user
          ? "Bắt đầu miễn phí"
          : href === "/admin"
            ? "Vào khu quản trị"
            : href === "/learn"
              ? "Vào không gian học"
              : "Về trang chủ"}
      </span>
      <ArrowIcon />
    </Link>
  );
}
