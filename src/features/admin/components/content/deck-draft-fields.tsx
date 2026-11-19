"use client";

import type { DeckDraft } from "../../hooks/use-create-content";
import { CEFR_OPTIONS, DraftField } from "./draft-field";

/** Bộ thẻ chỉ có các cấp độ A1–C1 (không có C2). */
const DECK_LEVELS = CEFR_OPTIONS.filter(([code]) => code !== "C2");

export function DeckDraftFields({
  value,
  onChange,
}: {
  value: DeckDraft;
  onChange: (patch: Partial<DeckDraft>) => void;
}) {
  return (
    <>
      <DraftField label="Tiêu đề bộ thẻ Flashcard *">
        <input
          type="text"
          required
          className="field-input"
          placeholder="ví dụ: 600 Từ Vựng TOEIC Căn Bản"
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </DraftField>

      <DraftField label="Mô tả bộ thẻ">
        <textarea
          className="admin-textarea"
          placeholder="Mô tả nội dung, mục tiêu của bộ thẻ từ vựng..."
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </DraftField>

      <DraftField label="Cấp độ bộ thẻ">
        <select
          className="admin-select field-select"
          value={value.level}
          onChange={(e) => onChange({ level: e.target.value })}
        >
          {DECK_LEVELS.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </DraftField>
    </>
  );
}
