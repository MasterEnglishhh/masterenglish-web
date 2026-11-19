"use client";

import { usePathname } from "next/navigation";
import { RouteTransition } from "@/components/route-transition";
import { learningNavigation } from "../data/navigation";

/** Bọc nội dung các trang /learn/*: trượt dọc nhẹ theo chiều chuyển mục trong thanh điều hướng. */
export function LearningContentTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const order = learningNavigation.findIndex((item) => item.href === pathname);
  return (
    <RouteTransition transitionKey={pathname} order={order} axis="y" className="route-fill">
      {children}
    </RouteTransition>
  );
}
