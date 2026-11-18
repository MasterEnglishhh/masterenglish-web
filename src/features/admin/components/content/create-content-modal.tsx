"use client";

import { Dialog } from "@/components/dialog";
import { useCreateContent } from "../../hooks/use-create-content";
import { DeckDraftFields } from "./deck-draft-fields";
import { WordDraftFields } from "./word-draft-fields";

interface CreateContentModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateContentModal({
  onClose,
  onCreated,
}: CreateContentModalProps) {
  const create = useCreateContent({ onCreated, onClose });

  return (
    <Dialog
      kicker="SOẠN NỘI DUNG HỌC LIỆU MỚI"
      title="Tạo Bản Thảo (Draft v1)"
      description={
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          Bản thảo tạo mới sẽ ở trạng thái DRAFT. Sau khi lưu, bạn có thể bấm Thẩm định để nộp duyệt.
        </p>
      }
      busy={create.isSubmitting}
      onClose={onClose}
    >
      {create.error && (
        <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {create.error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {(
          [
            ["WORD", "Từ vựng (Word)"],
            ["DECK", "Bộ thẻ (Flashcard Deck)"],
          ] as const
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            className={create.contentType === type ? "btn-3d-lime btn-sm" : "btn-3d-outline btn-sm"}
            onClick={() => create.setContentType(type)}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={create.submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {create.contentType === "WORD" ? (
          <WordDraftFields value={create.word} onChange={create.patchWord} />
        ) : (
          <DeckDraftFields value={create.deck} onChange={create.patchDeck} />
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
          <button type="button" className="btn-3d-outline btn-sm" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" disabled={create.isSubmitting} className="btn-3d-lime btn-sm">
            {create.isSubmitting ? "Đang lưu..." : "Lưu Bản Thảo (Draft)"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
