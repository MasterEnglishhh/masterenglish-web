"use client";

import { Dialog } from "@/components/dialog";
import { useCreateContent } from "../../hooks/use-create-content";
import { DeckDraftFields } from "./deck-draft-fields";
import { WordDraftFields } from "./word-draft-fields";

interface CreateContentModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const TYPES = [
  ["WORD", "Từ vựng (Word)"],
  ["DECK", "Bộ thẻ (Flashcard Deck)"],
] as const;

export function CreateContentModal({ onClose, onCreated }: CreateContentModalProps) {
  const create = useCreateContent({ onCreated, onClose });

  return (
    <Dialog
      kicker="SOẠN NỘI DUNG HỌC LIỆU MỚI"
      title="Tạo Bản Thảo (Draft v1)"
      description={
        <p className="admin-modal-note">
          Bản thảo tạo mới sẽ ở trạng thái DRAFT. Sau khi lưu, bạn có thể bấm Thẩm định để nộp duyệt.
        </p>
      }
      busy={create.isSubmitting}
      onClose={onClose}
    >
      {create.error && (
        <div role="alert" className="form-alert-error">
          {create.error}
        </div>
      )}
      <div className="admin-tabs">
        {TYPES.map(([type, label]) => (
          <button
            key={type}
            type="button"
            aria-pressed={create.contentType === type}
            className={create.contentType === type ? "btn-lime btn-sm" : "btn-ghost btn-sm"}
            onClick={() => create.setContentType(type)}
          >
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={create.submit} className="admin-form">
        {create.contentType === "WORD" ? (
          <WordDraftFields value={create.word} onChange={create.patchWord} />
        ) : (
          <DeckDraftFields value={create.deck} onChange={create.patchDeck} />
        )}
        <div className="admin-form-actions">
          <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" disabled={create.isSubmitting} className="btn-lime btn-sm">
            {create.isSubmitting ? "Đang lưu..." : "Lưu Bản Thảo (Draft)"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
