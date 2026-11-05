"use client";

import { useState } from "react";
import { Search, Eye, Plus } from "lucide-react";
import type {
  ContentFilterState,
  ContentItem,
  ContentModule,
  ContentRevisionStatus,
} from "../../types/content-ops";
import { ContentStatusBadge } from "./content-status-badge";
import { ContentPreviewModal } from "./content-preview-modal";

interface ContentTableProps {
  items: ContentItem[];
  totalCount: number;
  filters: ContentFilterState;
  onFilterChange: (filters: ContentFilterState) => void;
  onStatusChange: (itemId: string, status: ContentRevisionStatus) => void;
  onDeleteItem: (itemId: string) => void;
}

export function ContentTable({
  items,
  totalCount,
  filters,
  onFilterChange,
  onStatusChange,
}: ContentTableProps) {
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);

  const tabs: { label: string; value: ContentModule | "ALL" }[] = [
    { label: "Tất cả nội dung", value: "ALL" },
    { label: "Từ vựng & Flashcards", value: "VOCABULARY" },
    { label: "Bài học Ngữ pháp", value: "GRAMMAR" },
    { label: "Ngân hàng câu hỏi", value: "QUESTION_BANK" },
    { label: "Đề luyện thi TOEIC", value: "TOEIC" },
  ];

  return (
    <div>
      {/* Module Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={filters.module === tab.value ? "btn-3d-dark btn-sm" : "btn-3d-outline btn-sm"}
            onClick={() => onFilterChange({ ...filters, module: tab.value })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tiêu đề hoặc mã bài..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            className="admin-select"
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value as ContentRevisionStatus | "ALL" })
            }
          >
            <option value="ALL">Tất cả trạng thái xuất bản</option>
            <option value="DRAFT">Bản nháp (Draft)</option>
            <option value="IN_REVIEW">Đang thẩm định (In Review)</option>
            <option value="PUBLISHED">Đã xuất bản (Published)</option>
          </select>

          <button
            type="button"
            className="btn-3d-lime btn-sm"
            onClick={() => alert("Chức năng tạo nội dung mới sẽ được tích hợp với trình soạn thảo Markdown / Media uploader.")}
          >
            <Plus size={14} /> Soạn nội dung mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã / Tiêu đề</th>
              <th>Phân hệ</th>
              <th>Cấp độ</th>
              <th>Phiên bản</th>
              <th>Trạng thái</th>
              <th>Biên soạn</th>
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  Không tìm thấy mục nội dung nào phù hợp.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{it.title}</div>
                    <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                      {it.code}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 750, color: "var(--indigo)" }}>
                      {it.module}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f1eb", padding: "3px 7px", borderRadius: 6 }}>
                      {it.level || "Tất cả"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>v{it.versionNo}</span>
                  </td>
                  <td>
                    <ContentStatusBadge status={it.status} />
                  </td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{it.author}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn-3d-outline btn-sm"
                      onClick={() => setPreviewItem(it)}
                      title="Xem chi tiết & phê duyệt"
                    >
                      <Eye size={13} /> Thẩm định
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="admin-pagination">
          <span>Hiển thị <strong>{items.length}</strong> / <strong>{totalCount}</strong> mục nội dung</span>
          <span>Trang 1 / 1</span>
        </div>
      </div>

      {previewItem && (
        <ContentPreviewModal
          item={previewItem}
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}
