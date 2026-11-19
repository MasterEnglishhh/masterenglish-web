type SkeletonVariant = "line" | "line-lg" | "line-sm" | "card";

/** Khối giữ chỗ khi đang tải. Ẩn khỏi trình đọc màn hình; nơi dùng tự gắn role="status" cho cả vùng. */
export function Skeleton({ variant = "line", className = "" }: { variant?: SkeletonVariant; className?: string }) {
  return <div aria-hidden="true" className={`skeleton skeleton-${variant} ${className}`.trim()} />;
}
