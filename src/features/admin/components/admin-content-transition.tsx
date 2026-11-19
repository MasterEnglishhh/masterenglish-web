"use client";

import { usePathname } from "next/navigation";
import { RouteTransition } from "@/components/route-transition";
import { adminNavItems } from "../data/navigation";

/** Bọc nội dung các trang /admin/*: trượt dọc nhẹ theo chiều chuyển mục. */
export function AdminContentTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const order = adminNavItems.findIndex((item) => item.href === pathname);
  return (
    <RouteTransition transitionKey={pathname} order={order} axis="y">
      {children}
    </RouteTransition>
  );
}
