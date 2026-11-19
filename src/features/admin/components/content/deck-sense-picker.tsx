"use client";

import { useDeckSenseSearch } from "../../hooks/use-deck-senses";
import type { PublishedSense } from "../../lib/content-lookup-client";
import { DraftField } from "./draft-field";

const label = (sense: PublishedSense) => `${sense.lemma} (${sense.partOfSpeech}, ${sense.cefrLevel}) — ${sense.meaningVi}`;

/** Chọn các nghĩa từ đã xuất bản làm thẻ của bộ: tìm theo từ rồi bấm Thêm. */
export function DeckSensePicker({
  selected,
  onAdd,
  onRemove,
}: {
  selected: PublishedSense[];
  onAdd: (sense: PublishedSense) => void;
  onRemove: (senseId: string) => void;
}) {
  const { query, setQuery, results, isSearching, error, search } = useDeckSenseSearch();
  return (
    <section className="admin-sense-picker" aria-label="Chọn thẻ cho bộ">
      <DraftField label="Tìm từ đã xuất bản *">
        <input
          type="search"
          className="field-input"
          placeholder="Gõ một từ rồi bấm Tìm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
        />
      </DraftField>
      <button type="button" className="btn-ghost btn-sm" disabled={isSearching || !query.trim()} onClick={() => void search()}>
        {isSearching ? "Đang tìm..." : "Tìm"}
      </button>
      {error && (
        <p role="alert" className="form-alert-error">
          {error}
        </p>
      )}
      {results && (
        <ul className="admin-sense-list" aria-label="Kết quả tìm">
          {results.length === 0 && <li>Không thấy từ đã xuất bản phù hợp.</li>}
          {results.map((sense) => (
            <li key={sense.senseId}>
              <span>{label(sense)}</span>
              <button
                type="button"
                className="btn-ghost btn-sm"
                disabled={selected.some((item) => item.senseId === sense.senseId)}
                onClick={() => onAdd(sense)}
              >
                Thêm
              </button>
            </li>
          ))}
        </ul>
      )}
      <h3 className="field-label">Đã chọn ({selected.length})</h3>
      <ul className="admin-sense-list" aria-label="Thẻ đã chọn">
        {selected.length === 0 && <li>Chưa chọn thẻ nào.</li>}
        {selected.map((sense) => (
          <li key={sense.senseId}>
            <span>{label(sense)}</span>
            <button type="button" className="btn-ghost btn-sm" onClick={() => onRemove(sense.senseId)}>
              Bỏ
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
