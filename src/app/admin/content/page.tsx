"use client";

import { useAdminContent } from "@/features/admin/hooks/use-admin-content";
import { ContentTable } from "@/features/admin/components/content/content-table";

export default function AdminContentPage() {
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
        <span className="admin-kicker">QUẢN TRỊ NỘI DUNG & NGÂN HÀNG ĐỀ</span>
        <h1 className="admin-title">
          Kiểm duyệt Từ vựng, Ngữ pháp & <em>Đề thi</em>
        </h1>
        <p className="admin-description">
          Quản lý toàn bộ vòng đời nội dung (Bản nháp -&gt; Đang thẩm định -&gt; Đã xuất bản). Tích hợp đồng bộ ngân hàng câu hỏi TOEIC và bộ thẻ Flashcard.
        </p>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "10px 14px", borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
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
