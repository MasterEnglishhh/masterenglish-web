"use client";

import { useAdminContent } from "@/features/admin/hooks/use-admin-content";
import { ContentTable } from "@/features/admin/components/content/content-table";

export default function AdminContentPage() {
  const {
    items,
    totalCount,
    filters,
    setFilters,
    changeRevisionStatus,
    deleteContentItem,
  } = useAdminContent();

  return (
    <div>
      <div className="admin-heading">
        <span className="admin-kicker">M08 / QUẢN TRỊ NỘI DUNG & NGÂN HÀNG ĐỀ</span>
        <h1 className="admin-title">
          Kiểm duyệt Từ vựng, Ngữ pháp & <em>Đề thi</em>
        </h1>
        <p className="admin-description">
          Quản lý toàn bộ vòng đời nội dung (Bản nháp -&gt; Đang thẩm định -&gt; Đã xuất bản). Tích hợp đồng bộ ngân hàng câu hỏi TOEIC và bộ thẻ Flashcard.
        </p>
      </div>

      <ContentTable
        items={items}
        totalCount={totalCount}
        filters={filters}
        onFilterChange={setFilters}
        onStatusChange={changeRevisionStatus}
        onDeleteItem={deleteContentItem}
      />
    </div>
  );
}
