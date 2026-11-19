import type { ReactNode } from "react";

interface PaginationProps {
  /** Trang hiện tại, đánh số từ 1. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Khóa nút khi đang tải. */
  busy?: boolean;
  /** Ghi đè khi máy chủ cho biết rõ còn trang sau hay không. */
  hasNext?: boolean;
  label?: string;
  /** Dòng tóm tắt bên trái (vd. "Hiển thị 10 / 42 tài khoản"). Có thì thanh luôn hiện. */
  summary?: ReactNode;
  className?: string;
}

/** Thanh phân trang dùng chung. Ẩn khi chỉ có một trang và không có dòng tóm tắt. */
export function Pagination({
  page,
  totalPages,
  onChange,
  busy = false,
  hasNext = page < totalPages,
  label = "Phân trang",
  summary,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1 && page <= 1 && !summary) return null;
  return (
    <nav aria-label={label} className={`pager ${className}`.trim()}>
      {summary && <span className="pager-summary">{summary}</span>}
      <div className="pager-controls">
        <button type="button" className="btn-ghost btn-sm" disabled={busy || page <= 1} onClick={() => onChange(page - 1)}>
          Trang trước
        </button>
        <span aria-live="polite">
          Trang <strong>{page}</strong> / <strong>{Math.max(totalPages, 1)}</strong>
        </span>
        <button type="button" className="btn-ghost btn-sm" disabled={busy || !hasNext} onClick={() => onChange(page + 1)}>
          Trang tiếp
        </button>
      </div>
    </nav>
  );
}
