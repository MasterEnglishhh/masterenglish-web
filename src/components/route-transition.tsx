"use client";

import { useState, type ReactNode } from "react";

interface RouteTransitionProps {
  /** Đổi giá trị này là đổi "trang": nội dung được dựng lại và chạy hiệu ứng trượt vào một lần. */
  transitionKey: string;
  /** Thứ tự của mục trong thanh điều hướng. Chuyển sang mục lớn hơn thì trượt vào từ phải/dưới, nhỏ hơn thì từ trái/trên. */
  order: number;
  /** Hướng trượt: ngang (mặc định) hoặc dọc, cho khớp với thanh điều hướng đi kèm. */
  axis?: "x" | "y";
  className?: string;
  children: ReactNode;
}

/**
 * Hiệu ứng trượt nhẹ khi đổi trang/tab (chỉ transform và opacity, định nghĩa ở styles/ui.css).
 * Không giữ hai bản DOM song song: nội dung cũ được thay ngay, nên không trùng id/label và không giật chiều cao.
 * Lần hiển thị đầu không có hiệu ứng.
 */
export function RouteTransition({ transitionKey, order, axis = "x", className = "", children }: RouteTransitionProps) {
  // Ghi nhớ mục trước đó bằng state (so sánh ngay lúc render) để suy ra chiều, không đọc ref khi render.
  const [last, setLast] = useState({ key: transitionKey, order, direction: 0 });
  if (last.key !== transitionKey) {
    setLast({ key: transitionKey, order, direction: Math.sign(order - last.order) });
  }
  const direction = last.key === transitionKey ? last.direction : 0;

  return (
    <div
      key={transitionKey}
      className={`route-transition ${className}`}
      data-axis={axis}
      data-direction={direction > 0 ? "forward" : direction < 0 ? "back" : "none"}
    >
      {children}
    </div>
  );
}
