"use client";

import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { useAuthSession } from "@/features/auth";

/**
 * Nút chính của trang. Mặc định là bản dành cho khách; khi phiên đã xác nhận có người dùng thì
 * đổi nhãn và đích. Chiều rộng tối thiểu cố định để đổi nhãn không làm trang xô lệch.
 */
export function PrimaryCta({ className = "" }: { className?: string }) {
  const { user } = useAuthSession();
  return (
    <Link className={`lp-btn lp-btn-primary ${className}`} href={user ? "/learn" : "/register"}>
      <span>{user ? "Vào không gian học" : "Bắt đầu miễn phí"}</span>
      <ArrowIcon />
    </Link>
  );
}
