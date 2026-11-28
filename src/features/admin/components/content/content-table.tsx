"use client";

import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { AdminFilterBar } from "../admin-filter-bar";
import type {
  ContentFilterState,
  ContentItem,
  ContentStatusFilter,
  ContentType,
} from "../../types/content-ops";
import { ContentPreviewModal } from "./content-preview-modal";
import { ContentStatusBadge } from "./content-status-badge";
import { CreateContentModal } from "./create-content-modal";

interface ContentTableProps {
  items: ContentItem[];
  totalCount: number;
  totalPages?: number;
  isLoading?: boolean;
  hasLoadError?: boolean;
  filters: ContentFilterState;
  onFilterChange: (filters: ContentFilterState) => void;
  onReload: () => void;
}

// Backend (admin/CONTRACT.md §2.3) chỉ lọc theo contentType WORD | DECK | ALL.
const TABS: { label: string; value: ContentType | "ALL" }[] = [
  { label: "Tất cả nội dung", value: "ALL" },
  { label: "Từ vựng", value: "WORD" },
  { label: "Bộ thẻ Flashcard", value: "DECK" },
];

export function ContentTable({
  items,
  totalCount,
  totalPages = 1,
  isLoading = false,
  hasLoadError = false,
  filters,
  onFilterChange,
  onReload,
}: ContentTableProps) {
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <div
        role="group"
        aria-label="Lọc theo loại nội dung"
        className="admin-tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={filters.contentType === tab.value}
            className={
              filters.contentType === tab.value
                ? "btn-primary btn-sm"
                : "btn-ghost btn-sm"
            }
            onClick={() =>
              onFilterChange({ ...filters, contentType: tab.value, page: 1 })
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminFilterBar
        search={filters.search}
        onSearchChange={(search) =>
          onFilterChange({ ...filters, search, page: 1 })
        }
        searchLabel="Tìm nội dung theo tiêu đề hoặc mã"
        placeholder="Tìm theo tiêu đề hoặc mã..."
      >
        <select
          className="admin-select"
          aria-label="Lọc theo trạng thái"
          value={filters.status}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              status: e.target.value as ContentStatusFilter,
              page: 1,
            })
          }
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (Draft)</option>
          <option value="IN_REVIEW">Chờ thẩm định (In Review)</option>
          <option value="APPROVED">Đã phê duyệt (Approved)</option>
          <option value="PUBLISHED">Đã xuất bản (Published)</option>
          <option value="ARCHIVED">Đã lưu trữ (Archived)</option>
        </select>
        <button
          type="button"
          className="btn-lime btn-sm"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={14} aria-hidden="true" /> Soạn nội dung mới
        </button>
      </AdminFilterBar>

      {isLoading && (
        <p className="admin-card-note" role="status">
          Đang tải nội dung...
        </p>
      )}
      {!isLoading && !hasLoadError && items.length === 0 && (
        <EmptyState
          className="admin-empty"
          title="Không tìm thấy mục nội dung phù hợp"
        />
      )}
      {(items.length > 0 || filters.page > 1) && (
        <div className="admin-table-wrap">
          {items.length > 0 && (
            <div
              className="admin-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Bảng nội dung"
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã / Tiêu đề</th>
                    <th>Phân hệ</th>
                    <th>Cấp độ</th>
                    <th>Phiên bản</th>
                    <th>Trạng thái</th>
                    <th>Biên soạn</th>
                    <th className="cell-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <div className="cell-name">{it.title}</div>
                        <span className="cell-sub admin-code">{it.code}</span>
                      </td>
                      <td className="cell-name">{it.module}</td>
                      <td>
                        <span className="admin-badge">
                          {it.level || "Tất cả"}
                        </span>
                      </td>
                      <td>
                        <strong>v{it.versionNo}</strong>
                      </td>
                      <td>
                        <ContentStatusBadge status={it.status} />
                      </td>
                      <td className="cell-sub">{it.author}</td>
                      <td className="cell-right">
                        <button
                          type="button"
                          className="btn-ghost btn-sm"
                          onClick={() => setPreviewItem(it)}
                          title="Xem chi tiết & thẩm định"
                        >
                          <Eye size={13} aria-hidden="true" /> Thẩm định
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            className="admin-pagination"
            label="Phân trang nội dung"
            page={filters.page}
            totalPages={totalPages}
            busy={isLoading}
            onChange={(page) => onFilterChange({ ...filters, page })}
            summary={
              <>
                Hiển thị <strong>{items.length}</strong> /{" "}
                <strong>{totalCount}</strong> mục nội dung
              </>
            }
          />
        </div>
      )}

      {previewItem && (
        <ContentPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onReload={onReload}
        />
      )}
      {isCreateOpen && (
        <CreateContentModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={onReload}
        />
      )}
    </div>
  );
}
