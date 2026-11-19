"use client";

import { useState } from "react";
import { Dialog } from "@/components/dialog";
import {
  type ContentSource,
  type CreateSourcePayload,
} from "../../lib/content-lookup-client";
import { DraftField, DraftRow } from "./draft-field";

interface CreateSourceModalProps {
  onClose: () => void;
  onCreated?: (source: ContentSource) => void;
  createSourceFn: (
    payload: CreateSourcePayload
  ) => Promise<{ source: ContentSource | null; error: string | null }>;
}

export function CreateSourceModal({
  onClose,
  onCreated,
  createSourceFn,
}: CreateSourceModalProps) {
  const [draft, setDraft] = useState<CreateSourcePayload>({
    title: "",
    sourceType: "EXTERNAL",
    author: "",
    sourceUrl: "",
    licenseCode: "CC-BY",
    licenseUrl: "",
    attribution: "",
    permissionNote: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("Vui lòng nhập tên nguồn trích dẫn.");
      return;
    }
    if (!draft.licenseCode?.trim()) {
      setError("Vui lòng nhập mã giấy phép.");
      return;
    }
    if (!draft.attribution?.trim()) {
      setError("Vui lòng nhập dòng ghi công.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createSourceFn({
        title: draft.title.trim(),
        sourceType: draft.sourceType || "EXTERNAL",
        author: draft.author?.trim() || undefined,
        sourceUrl: draft.sourceUrl?.trim() || undefined,
        licenseCode: draft.licenseCode.trim(),
        licenseUrl: draft.licenseUrl?.trim() || undefined,
        attribution: draft.attribution.trim(),
        permissionNote: draft.permissionNote?.trim() || undefined,
      });

      if (res.source) {
        onCreated?.(res.source);
        onClose();
      } else {
        setError(res.error || "Không thể tạo nguồn trích dẫn.");
      }
    } catch {
      setError("Đã xảy ra lỗi khi tạo nguồn trích dẫn.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      kicker="QUẢN TRỊ NGUỒN HỌC LIỆU"
      title="Thêm nguồn trích dẫn mới"
      description={
        <p className="admin-modal-note">
          Nguồn trích dẫn dùng để chứng minh bản quyền và ghi công khi xuất bản từ vựng hoặc bộ thẻ.
        </p>
      }
      busy={isSubmitting}
      onClose={onClose}
    >
      {error && (
        <div role="alert" className="form-alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form">
        <DraftRow>
          <DraftField label="Tên nguồn trích dẫn *">
            <input
              type="text"
              required
              className="field-input"
              placeholder="ví dụ: Oxford Learner's Dictionaries, Cambridge..."
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </DraftField>
          <DraftField label="Loại nguồn *">
            <select
              className="admin-select field-select"
              value={draft.sourceType}
              onChange={(e) => setDraft({ ...draft, sourceType: e.target.value })}
            >
              <option value="EXTERNAL">EXTERNAL (Nguồn bên ngoài)</option>
              <option value="INTERNAL">INTERNAL (Nội bộ hệ thống)</option>
            </select>
          </DraftField>
        </DraftRow>

        <DraftRow>
          <DraftField label="Tác giả / Nhà xuất bản">
            <input
              type="text"
              className="field-input"
              placeholder="ví dụ: Oxford University Press"
              value={draft.author || ""}
              onChange={(e) => setDraft({ ...draft, author: e.target.value })}
            />
          </DraftField>
          <DraftField label="Đường dẫn nguồn (URL)">
            <input
              type="url"
              className="field-input"
              placeholder="https://..."
              value={draft.sourceUrl || ""}
              onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
            />
          </DraftField>
        </DraftRow>

        <DraftRow>
          <DraftField label="Mã giấy phép *">
            <input
              type="text"
              required
              className="field-input"
              placeholder="ví dụ: CC-BY, EDITORIAL_CITATION"
              value={draft.licenseCode}
              onChange={(e) => setDraft({ ...draft, licenseCode: e.target.value })}
            />
          </DraftField>
          <DraftField label="Đường dẫn giấy phép (URL)">
            <input
              type="url"
              className="field-input"
              placeholder="https://creativecommons.org/..."
              value={draft.licenseUrl || ""}
              onChange={(e) => setDraft({ ...draft, licenseUrl: e.target.value })}
            />
          </DraftField>
        </DraftRow>

        <DraftField label="Dòng ghi công (Attribution) *">
          <input
            type="text"
            required
            className="field-input"
            placeholder="ví dụ: Trích từ Oxford Learner's Dictionaries theo giấy phép sử dụng học thuật"
            value={draft.attribution}
            onChange={(e) => setDraft({ ...draft, attribution: e.target.value })}
          />
        </DraftField>

        <DraftField label="Ghi chú cấp phép (Permission Note)">
          <input
            type="text"
            className="field-input"
            placeholder="Ghi chú thêm về thỏa thuận bản quyền nếu có..."
            value={draft.permissionNote || ""}
            onChange={(e) => setDraft({ ...draft, permissionNote: e.target.value })}
          />
        </DraftField>

        <div className="admin-form-actions">
          <button type="button" className="btn-ghost btn-sm" disabled={isSubmitting} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-lime btn-sm">
            {isSubmitting ? "Đang lưu..." : "Lưu nguồn trích dẫn"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
