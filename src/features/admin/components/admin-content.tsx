"use client";

import { useState } from "react";
import { useAdminContent } from "../hooks/use-admin-content";
import { ContentTable } from "./content/content-table";
import { SourceTable } from "./content/source-table";

export function AdminContent() {
  const [activeTab, setActiveTab] = useState<"CONTENT" | "SOURCES">("CONTENT");

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
          {activeTab === "CONTENT" ? (
            <>
              Kiểm duyệt <em>Từ vựng & Bộ thẻ</em>
            </>
          ) : (
            <>
              Quản lý <em>Nguồn trích dẫn</em>
            </>
          )}
        </h1>
        <p className="admin-description">
          {activeTab === "CONTENT"
            ? "Quản lý vòng đời nội dung từ vựng và bộ thẻ Flashcard: Bản nháp, Đang thẩm định, Đã duyệt, Đã xuất bản."
            : "Quản lý nguồn trích dẫn, giấy phép bản quyền và dòng ghi công của học liệu."}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Phân hệ quản trị nội dung"
        className="admin-tabs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "CONTENT"}
          className={
            activeTab === "CONTENT" ? "btn-primary btn-sm" : "btn-ghost btn-sm"
          }
          onClick={() => setActiveTab("CONTENT")}
        >
          Từ vựng & Bộ thẻ
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "SOURCES"}
          className={
            activeTab === "SOURCES" ? "btn-primary btn-sm" : "btn-ghost btn-sm"
          }
          onClick={() => setActiveTab("SOURCES")}
        >
          Nguồn trích dẫn
        </button>
      </div>

      {activeTab === "CONTENT" ? (
        <>
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
        </>
      ) : (
        <SourceTable />
      )}
    </div>
  );
}
