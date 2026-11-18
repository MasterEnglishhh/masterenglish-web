"use client";

import type { WordDraft } from "../../hooks/use-create-content";
import { CEFR_OPTIONS, DraftField, DraftRow } from "./draft-field";

const PARTS_OF_SPEECH = [
  ["NOUN", "Danh từ (NOUN)"],
  ["VERB", "Động từ (VERB)"],
  ["ADJECTIVE", "Tính từ (ADJECTIVE)"],
  ["ADVERB", "Trạng từ (ADVERB)"],
  ["PREPOSITION", "Giới từ (PREPOSITION)"],
  ["CONJUNCTION", "Liên từ (CONJUNCTION)"],
] as const;

export function WordDraftFields({
  value,
  onChange,
}: {
  value: WordDraft;
  onChange: (patch: Partial<WordDraft>) => void;
}) {
  return (
    <>
      <DraftRow>
        <DraftField label="Từ vựng (Lemma) *">
          <input
            type="text"
            required
            className="admin-search-input"
            style={{ width: "100%" }}
            placeholder="ví dụ: persistent"
            value={value.lemma}
            onChange={(e) => onChange({ lemma: e.target.value })}
          />
        </DraftField>
        <DraftField label="Phiên âm IPA">
          <input
            type="text"
            className="admin-search-input"
            style={{ width: "100%" }}
            placeholder="ví dụ: /pəˈsɪstənt/"
            value={value.ipa}
            onChange={(e) => onChange({ ipa: e.target.value })}
          />
        </DraftField>
      </DraftRow>

      <DraftRow>
        <DraftField label="Từ loại">
          <select
            className="admin-select"
            style={{ width: "100%" }}
            value={value.partOfSpeech}
            onChange={(e) => onChange({ partOfSpeech: e.target.value })}
          >
            {PARTS_OF_SPEECH.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </DraftField>
        <DraftField label="Cấp độ CEFR">
          <select
            className="admin-select"
            style={{ width: "100%" }}
            value={value.cefrLevel}
            onChange={(e) => onChange({ cefrLevel: e.target.value })}
          >
            {CEFR_OPTIONS.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </DraftField>
      </DraftRow>

      <DraftField label="Nghĩa tiếng Việt *">
        <input
          type="text"
          required
          className="admin-search-input"
          style={{ width: "100%" }}
          placeholder="ví dụ: Kiên trì, bền bỉ"
          value={value.meaningVi}
          onChange={(e) => onChange({ meaningVi: e.target.value })}
        />
      </DraftField>

      <DraftField label="Định nghĩa tiếng Anh">
        <input
          type="text"
          className="admin-search-input"
          style={{ width: "100%" }}
          placeholder="ví dụ: Continuing firmly or obstinately in a course of action..."
          value={value.definitionEn}
          onChange={(e) => onChange({ definitionEn: e.target.value })}
        />
      </DraftField>

      <DraftRow>
        <DraftField label="Ví dụ câu tiếng Anh">
          <input
            type="text"
            className="admin-search-input"
            style={{ width: "100%" }}
            placeholder="She is a persistent learner."
            value={value.exampleEn}
            onChange={(e) => onChange({ exampleEn: e.target.value })}
          />
        </DraftField>
        <DraftField label="Dịch nghĩa câu ví dụ">
          <input
            type="text"
            className="admin-search-input"
            style={{ width: "100%" }}
            placeholder="Cô ấy là một người học kiên trì."
            value={value.exampleVi}
            onChange={(e) => onChange({ exampleVi: e.target.value })}
          />
        </DraftField>
      </DraftRow>
    </>
  );
}
