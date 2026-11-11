"use client";

import { useState } from "react";
import type { ContentItem } from "../../types/content-ops";
import { ContentStatusBadge } from "./content-status-badge";
import {
  approveContentRevision,
  archiveContentItem,
  publishContentRevision,
  rejectContentRevision,
  submitContentRevision,
} from "../../lib/admin-client";

interface ContentPreviewModalProps {
  item: ContentItem;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export function ContentPreviewModal({
  item,
  isOpen,
  onClose,
  onReload,
}: ContentPreviewModalProps) {
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const revisionId = item.latestRevisionId;

  const handleSubmitForReview = async () => {
    if (!revisionId) {
      alert("Không tìm thấy mã phiên bản (Revision ID).");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const res = await submitContentRevision(revisionId);
    setIsSubmitting(false);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setError(res.error.message);
    }
  };

  const handleApprove = async () => {
    if (!revisionId) {
      alert("Không tìm thấy mã phiên bản (Revision ID).");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const res = await approveContentRevision(revisionId, reviewNote || "Đạt chuẩn xuất bản");
    setIsSubmitting(false);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setError(res.error.message);
    }
  };

  const handleReject = async () => {
    if (!revisionId) {
      alert("Không tìm thấy mã phiên bản (Revision ID).");
      return;
    }
    if (!reviewNote.trim()) {
      alert("Bắt buộc nhập ghi chú lý do từ chối yêu cầu sửa đổi.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const res = await rejectContentRevision(revisionId, reviewNote.trim());
    setIsSubmitting(false);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setError(res.error.message);
    }
  };

  const handlePublish = async () => {
    if (!revisionId) {
      alert("Không tìm thấy mã phiên bản (Revision ID).");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const res = await publishContentRevision(revisionId);
    setIsSubmitting(false);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setError(res.error.message);
    }
  };

  const handleArchive = async () => {
    const reason = prompt("Nhập lý do lưu trữ/thu hồi nội dung:", "Thu hồi bản quyền hoặc nội dung cũ");
    if (!reason) return;
    setIsSubmitting(true);
    setError(null);
    const res = await archiveContentItem(item.id, reason);
    setIsSubmitting(false);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setError(res.error.message);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal" style={{ maxWidth: 640 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="admin-kicker">THẨM ĐỊNH & XUẤT BẢN NỘI DUNG</span>
            <ContentStatusBadge status={item.status} />
          </div>
          <h2 className="admin-modal-title">{item.title}</h2>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
            Mã: {item.code} · Module: {item.module} · Phiên bản: v{item.versionNo}
          </span>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ background: "#fafaf7", padding: 18, borderRadius: 14, border: "1px solid var(--line)" }}>
          <strong style={{ fontSize: 12, color: "var(--ink)", display: "block", marginBottom: 6 }}>
            NỘI DUNG TỔNG QUAN:
          </strong>
          <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
            {item.summary || "Chưa có tóm tắt nội dung."}
          </p>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed var(--line)", fontSize: 12, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
            <span>Biên soạn: <strong>{item.author}</strong></span>
            <span>Cập nhật: {new Date(item.updatedAt).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>

        {/* Input for review note when reviewing */}
        {(item.status === "IN_REVIEW" || item.status === "DRAFT") && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 6 }}>
              Ghi chú thẩm định / Lý do yêu cầu chỉnh sửa:
            </label>
            <textarea
              className="admin-search-input"
              style={{ width: "100%", height: 70, resize: "vertical", fontFamily: "inherit" }}
              placeholder="Nhập ghi chú phản hồi cho giảng viên..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <strong style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Hành động theo vòng đời học liệu:
          </strong>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {item.status === "DRAFT" && (
              <button
                type="button"
                disabled={isSubmitting}
                className="btn-3d-lime btn-sm"
                onClick={handleSubmitForReview}
              >
                Gửi Thẩm định (Submit for Review)
              </button>
            )}

            {item.status === "IN_REVIEW" && (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="btn-3d-lime btn-sm"
                  onClick={handleApprove}
                >
                  Phê duyệt (Approve)
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="btn-3d-outline btn-sm"
                  style={{ color: "#dc2626" }}
                  onClick={handleReject}
                >
                  Từ chối (Reject)
                </button>
              </>
            )}

            {item.status === "APPROVED" && (
              <button
                type="button"
                disabled={isSubmitting}
                className="btn-3d-lime btn-sm"
                onClick={handlePublish}
              >
                Xuất bản chính thức (Publish)
              </button>
            )}

            {item.status !== "ARCHIVED" && (
              <button
                type="button"
                disabled={isSubmitting}
                className="btn-3d-outline btn-sm"
                onClick={handleArchive}
              >
                Lưu trữ (Archive)
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
