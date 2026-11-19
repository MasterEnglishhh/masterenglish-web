"use client";

import { useId } from "react";
import { Dialog } from "@/components/dialog";
import { useContentReview } from "../../hooks/use-content-review";
import type { ContentItem } from "../../types/content-ops";
import { ContentStatusBadge } from "./content-status-badge";

interface ContentPreviewModalProps {
  item: ContentItem;
  onClose: () => void;
  onReload: () => void;
}

export function ContentPreviewModal({ item, onClose, onReload }: ContentPreviewModalProps) {
  const review = useContentReview(item, onReload, onClose);
  const noteId = useId();
  const reasonId = useId();
  const busy = review.isSubmitting;

  return (
    <Dialog
      kicker="THẨM ĐỊNH & XUẤT BẢN NỘI DUNG"
      kickerAside={<ContentStatusBadge status={item.status} />}
      title={item.title}
      description={
        <p className="admin-modal-note">
          Mã: <code className="admin-code">{item.code}</code> · Module: {item.module} · Phiên bản: v{item.versionNo}
        </p>
      }
      busy={busy}
      onClose={onClose}
    >
      {review.error && (
        <div role="alert" className="form-alert-error">
          {review.error}
        </div>
      )}

      <div className="admin-preview-meta">
        <strong>NỘI DUNG TỔNG QUAN</strong>
        <p className="admin-modal-note">{item.summary || "Chưa có tóm tắt nội dung."}</p>
        <div className="admin-pagination admin-preview-foot">
          <span>
            Biên soạn: <strong>{item.author}</strong>
          </span>
          <span>Cập nhật: {new Date(item.updatedAt).toLocaleDateString("vi-VN")}</span>
        </div>
      </div>

      {(item.status === "IN_REVIEW" || item.status === "DRAFT") && (
        <div>
          <label htmlFor={noteId} className="field-label">
            Ghi chú thẩm định / Lý do yêu cầu chỉnh sửa:
          </label>
          <textarea
            id={noteId}
            className="admin-textarea"
            placeholder="Nhập ghi chú phản hồi cho giảng viên..."
            value={review.reviewNote}
            onChange={(e) => review.setReviewNote(e.target.value)}
          />
        </div>
      )}

      <div className="admin-form">
        <span className="admin-kicker">HÀNH ĐỘNG THEO VÒNG ĐỜI HỌC LIỆU</span>
        <div className="admin-tabs">
          {item.status === "DRAFT" && (
            <button type="button" disabled={busy} className="btn-lime btn-sm" onClick={review.submitForReview}>
              Gửi Thẩm định (Submit for Review)
            </button>
          )}
          {item.status === "IN_REVIEW" && (
            <>
              <button type="button" disabled={busy} className="btn-lime btn-sm" onClick={review.approve}>
                Phê duyệt (Approve)
              </button>
              <button type="button" disabled={busy} className="btn-danger-soft btn-sm" onClick={review.reject}>
                Từ chối (Reject)
              </button>
            </>
          )}
          {item.status === "APPROVED" && (
            <button type="button" disabled={busy} className="btn-lime btn-sm" onClick={review.publish}>
              Xuất bản chính thức (Publish)
            </button>
          )}
          {item.status !== "ARCHIVED" && (
            <button type="button" disabled={busy} className="btn-ghost btn-sm" onClick={review.archive}>
              {review.isArchiving ? "Xác nhận lưu trữ" : "Lưu trữ (Archive)"}
            </button>
          )}
        </div>
        {review.isArchiving && (
          <div>
            <label htmlFor={reasonId} className="field-label">
              Lý do lưu trữ / thu hồi nội dung:
            </label>
            <input
              id={reasonId}
              type="text"
              className="field-input"
              value={review.archiveReason}
              onChange={(e) => review.setArchiveReason(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="admin-form-actions">
        <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
          Đóng
        </button>
      </div>
    </Dialog>
  );
}
