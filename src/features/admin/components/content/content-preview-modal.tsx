"use client";

import type { ContentItem, ContentRevisionStatus } from "../../types/content-ops";
import { ContentStatusBadge } from "./content-status-badge";

interface ContentPreviewModalProps {
  item: ContentItem;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (itemId: string, status: ContentRevisionStatus) => void;
}

export function ContentPreviewModal({
  item,
  isOpen,
  onClose,
  onStatusChange,
}: ContentPreviewModalProps) {
  if (!isOpen) return null;

  const handleUpdate = (status: ContentRevisionStatus) => {
    onStatusChange(item.id, status);
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal" style={{ maxWidth: 600 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="admin-kicker">PHÊ DUYỆT & XUẤT BẢN</span>
            <ContentStatusBadge status={item.status} />
          </div>
          <h2 className="admin-modal-title">{item.title}</h2>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
            Mã: {item.code} · Module: {item.module} · Phiên bản: v{item.versionNo}
          </span>
        </div>

        <div style={{ background: "#fafaf7", padding: 18, borderRadius: 14, border: "1px solid var(--line)" }}>
          <strong style={{ fontSize: 12, color: "var(--ink)", display: "block", marginBottom: 6 }}>
            NỘI DUNG TỔNG QUAN:
          </strong>
          <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
            {item.summary}
          </p>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed var(--line)", fontSize: 12, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
            <span>Biên soạn: <strong>{item.author}</strong></span>
            <span>Cập nhật: {new Date(item.updatedAt).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <strong style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Chuyển trạng thái quy trình xuất bản:
          </strong>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {item.status !== "DRAFT" && (
              <button
                type="button"
                className="btn-3d-outline btn-sm"
                onClick={() => handleUpdate("DRAFT")}
              >
                Trả về Bản nháp (Draft)
              </button>
            )}
            {item.status !== "IN_REVIEW" && (
              <button
                type="button"
                className="btn-3d-outline btn-sm"
                onClick={() => handleUpdate("IN_REVIEW")}
              >
                Gửi Thẩm định (In Review)
              </button>
            )}
            {item.status !== "PUBLISHED" && (
              <button
                type="button"
                className="btn-3d-lime btn-sm"
                onClick={() => handleUpdate("PUBLISHED")}
              >
                Xuất bản chính thức (Publish)
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn-3d-outline btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
