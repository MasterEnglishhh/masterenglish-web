"use client";

import { useAdminContent } from "../hooks/use-admin-content";
import { ContentTable } from "./content/content-table";

export function AdminContent() {
  const {
    items,
    totalCount,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    refreshContent,
  } = useAdminContent();

  return (
    <div>
      <div className="admin-heading">
        <span className="admin-kicker">QUẢN TRỊ NỘI DUNG</span>
        <h1 className="admin-title">
          Kiểm duyệt <em>Từ vựng & Bộ thẻ</em>
        </h1>
        <p className="admin-description">
          Quản lý vòng đời nội dung từ vựng và bộ thẻ Flashcard: Bản nháp, Đang thẩm định, Đã duyệt, Đã xuất bản.
        </p>
      </div>

      {error && (
        <div role="alert" className="admin-alert">
          {error}
        </div>
      )}

      <ContentTable
        items={items}
        totalCount={totalCount}
        totalPages={totalPages}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onReload={refreshContent}
      />
    </div>
  );
}
