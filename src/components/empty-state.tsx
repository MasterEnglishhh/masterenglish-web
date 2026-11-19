import type { ReactNode } from "react";
import { Mascot, type MascotExpression } from "./mascot";

interface EmptyStateProps {
  title: string;
  /** Nhãn nhỏ viết hoa phía trên tiêu đề. */
  kicker?: string;
  /** Mô tả ngắn, một đoạn. */
  children?: ReactNode;
  /** Biểu cảm linh vật; bỏ trống thì dùng `icon` (nếu có). */
  mascot?: MascotExpression;
  icon?: ReactNode;
  /** Hậu tố id SVG của linh vật, cần khác nhau nếu hai linh vật cùng hiện một trang. */
  idSuffix?: string;
  /** Nút hoặc liên kết hành động tiếp theo. */
  action?: ReactNode;
  className?: string;
}

/** Trạng thái rỗng: thẻ kính căn giữa gồm linh vật (hoặc biểu tượng), tiêu đề, mô tả và một hành động. */
export function EmptyState({ title, kicker, children, mascot, icon, idSuffix = "-empty", action, className = "" }: EmptyStateProps) {
  return (
    <div className={`glass-card empty-page ${className}`.trim()}>
      {mascot ? <Mascot expression={mascot} idSuffix={idSuffix} className="empty-page-mascot" /> : icon}
      {kicker && <span>{kicker}</span>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
