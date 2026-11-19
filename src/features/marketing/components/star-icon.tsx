import type { CSSProperties } from "react";

/** Ngôi sao bốn cánh dùng làm điểm nhấn trang trí. */
export function StarIcon({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="currentColor" />
    </svg>
  );
}
