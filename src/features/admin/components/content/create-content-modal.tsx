"use client";

import { Dialog } from "@/components/dialog";
import { useAuthSession } from "@/features/auth";
import { useCreateContent } from "../../hooks/use-create-content";
import { DeckDraftFields } from "./deck-draft-fields";
import { DeckSensePicker } from "./deck-sense-picker";
import { SourceSelect } from "./source-select";
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
  const { user } = useAuthSession();
  const canCreateDeck = user?.roles.includes("LEARNER") === true;
  const create = useCreateContent({ onCreated, onClose, canCreateDeck });

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
            disabled={create.isSubmitting === true || (type === "DECK" && !canCreateDeck)}
            aria-describedby={type === "DECK" && !canCreateDeck ? "admin-deck-unavailable" : undefined}
            className={create.contentType === type ? "btn-lime btn-sm" : "btn-ghost btn-sm"}
            onClick={() => create.setContentType(type)}
          >
            {label}
          </button>
        ))}
      </div>
      {!canCreateDeck && <p id="admin-deck-unavailable" className="admin-modal-note">
        Bộ chọn thẻ cần vai trò LEARNER để tra cứu từ vựng đã xuất bản. Hệ thống chưa có API tra cứu dành cho quản trị viên.
      </p>}
      <form onSubmit={create.submit} className="admin-form">
        {create.contentType === "WORD" ? (
          <WordDraftFields value={create.word} onChange={create.patchWord} />
        ) : (
          <>
            <DeckDraftFields value={create.deck} onChange={create.patchDeck} />
            <DeckSensePicker selected={create.deckSenses} onAdd={create.addSense} onRemove={create.removeSense} />
          </>
        )}
        <SourceSelect value={create.sourceId} onChange={create.setSourceId} />
        <div className="admin-form-actions">
          <button type="button" className="btn-ghost btn-sm" disabled={create.isSubmitting} onClick={onClose}>
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
