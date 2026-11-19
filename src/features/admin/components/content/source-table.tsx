"use client";

import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { useContentSources } from "../../hooks/use-content-sources";
import { AdminFilterBar } from "../admin-filter-bar";
import { CreateSourceModal } from "./create-source-modal";

export function SourceTable() {
  const {
    sources,
    totalCount,
    totalPages,
    search,
    setSearch,
    page,
    setPage,
    isLoading,
    error,
    reload,
    addSource,
  } = useContentSources({ paginated: true, pageSize: 10 });

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <AdminFilterBar
        search={search}
        onSearchChange={(query) => {
          setSearch(query);
          setPage(1);
        }}
        searchLabel="Tìm kiếm nguồn trích dẫn theo tiêu đề"
        placeholder="Tìm theo tên nguồn, tác giả..."
      >
        <button
          type="button"
          className="btn-lime btn-sm"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={14} aria-hidden="true" /> Thêm nguồn mới
        </button>
      </AdminFilterBar>

      {error && (
        <div role="alert" className="admin-alert">
          {error}{" "}
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => void reload()}
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nguồn trích dẫn</th>
              <th>Loại nguồn</th>
              <th>Tác giả</th>
              <th>Giấy phép</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan={6} className="cell-empty">
                  {isLoading
                    ? "Đang tải dữ liệu..."
                    : "Không tìm thấy nguồn trích dẫn nào phù hợp."}
                </td>
              </tr>
            ) : (
              sources.map((src) => (
                <tr key={src.id}>
                  <td>
                    <div className="cell-name">{src.title}</div>
                    {src.sourceUrl && (
                      <a
                        href={src.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cell-sub admin-code"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {src.sourceUrl}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    )}
                  </td>
                  <td>
                    <span className="admin-badge badge-role-learner">
                      {src.sourceType}
                    </span>
                  </td>
                  <td className="cell-sub">{src.author || "Chưa có"}</td>
                  <td>
                    <span className="admin-badge">
                      {src.licenseCode || "Chưa có"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`admin-badge ${src.status === "ACTIVE" ? "badge-active" : ""}`}
                    >
                      {src.status === "ACTIVE" ? "Hoạt động" : src.status}
                    </span>
                  </td>
                  <td className="cell-sub">
                    {src.createdAt
                      ? new Date(src.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          className="admin-pagination"
          label="Phân trang nguồn trích dẫn"
          page={page}
          totalPages={totalPages}
          busy={isLoading}
          onChange={setPage}
          summary={
            <>
              Hiển thị <strong>{sources.length}</strong> /{" "}
              <strong>{totalCount}</strong> nguồn trích dẫn
            </>
          }
        />
      </div>

      {isCreateOpen && (
        <CreateSourceModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => void reload()}
          createSourceFn={addSource}
        />
      )}
    </div>
  );
}
