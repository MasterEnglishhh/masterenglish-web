"use client";

import { useState } from "react";
import {
  approveContentRevision,
  archiveContentItem,
  publishContentRevision,
  rejectContentRevision,
  submitContentRevision,
} from "../lib/admin-client";
import type { ContentItem } from "../types/content-ops";

const DEFAULT_ARCHIVE_REASON = "Thu hồi bản quyền hoặc nội dung cũ";

/**
 * Các thao tác vòng đời của một mục nội dung (gửi duyệt, duyệt, từ chối, xuất bản, lưu trữ).
 * Mọi lỗi (kể cả thiếu mã phiên bản hoặc thiếu lý do) hiện ngay trong hộp thoại qua `error`, không dùng alert().
 */
export function useContentReview(item: ContentItem, onReload: () => void, onClose: () => void) {
  const [reviewNote, setReviewNote] = useState("");
  const [archiveReason, setArchiveReason] = useState(DEFAULT_ARCHIVE_REASON);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revisionId = item.latestRevisionId;

  async function run(call: () => Promise<{ success: boolean; error?: { message: string } }>) {
    setIsSubmitting(true);
    setError(null);
    const res = await call();
    setIsSubmitting(false);
    if (res.success) {
      onReload();
      onClose();
    } else {
      setError(res.error?.message ?? "Thao tác không thành công.");
    }
  }

  /** Thao tác trên phiên bản: cần có mã phiên bản. */
  function onRevision(call: (revisionId: string) => Promise<{ success: boolean; error?: { message: string } }>) {
    if (!revisionId) {
      setError("Không tìm thấy mã phiên bản (Revision ID).");
      return;
    }
    void run(() => call(revisionId));
  }

  return {
    reviewNote,
    setReviewNote,
    archiveReason,
    setArchiveReason,
    isArchiving,
    isSubmitting,
    error,
    submitForReview: () => onRevision(submitContentRevision),
    approve: () => onRevision((id) => approveContentRevision(id, reviewNote || "Đạt chuẩn xuất bản")),
    reject: () => {
      if (!reviewNote.trim()) {
        setError("Bắt buộc nhập ghi chú lý do từ chối yêu cầu sửa đổi.");
        return;
      }
      onRevision((id) => rejectContentRevision(id, reviewNote.trim()));
    },
    publish: () => onRevision(publishContentRevision),
    /** Bấm lần đầu để hiện ô lý do, bấm lần hai để xác nhận lưu trữ. */
    archive: () => {
      if (!isArchiving) {
        setIsArchiving(true);
        return;
      }
      if (!archiveReason.trim()) {
        setError("Nhập lý do lưu trữ/thu hồi nội dung.");
        return;
      }
      void run(() => archiveContentItem(item.id, archiveReason.trim()));
    },
  };
}
