import type { ReactNode } from "react";
import { Search } from "lucide-react";

interface AdminFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Nhãn đọc cho trình đọc màn hình. */
  searchLabel: string;
  placeholder: string;
  /** Các bộ lọc và nút hành động nằm bên phải ô tìm kiếm. */
  children?: ReactNode;
}

/** Thanh công cụ của bảng quản trị: ô tìm kiếm bên trái, bộ lọc và hành động bên phải. */
export function AdminFilterBar({ search, onSearchChange, searchLabel, placeholder, children }: AdminFilterBarProps) {
  return (
    <div className="admin-toolbar">
      <label className="admin-search-box">
        <Search size={16} aria-hidden="true" />
        <input
          type="text"
          className="admin-search-input"
          placeholder={placeholder}
          aria-label={searchLabel}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <div className="admin-filters">{children}</div>
    </div>
  );
}
