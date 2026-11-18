"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { partOfSpeechLabels } from "../lib/vocabulary-presentation";
import type { WordFilter, WordListMode } from "../hooks/use-word-list";
import styles from "./vocabulary.module.css";

/** Thanh lọc của trang tra từ / sổ tay. Giữ bản nháp riêng đến khi bấm "Tìm kiếm". */
export function WordFilterBar({
  mode,
  filter,
  onSearch,
}: {
  mode: WordListMode;
  filter: WordFilter;
  onSearch: (updates: Record<string, string | null>) => void;
}) {
  const [draft, setDraft] = useState(filter);
  return (
    <form
      className={`${styles.toolbar} ${mode === "saved" ? styles.savedToolbar : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSearch({
          q: mode === "words" ? draft.q.trim() : null,
          level: draft.cefrLevel,
          pos: mode === "words" ? draft.partOfSpeech : null,
          page: null,
        });
      }}
    >
      {mode === "words" && (
        <label className={styles.field}>
          Tìm từ tiếng Anh
          <span className={styles.inputWrap}>
            <Search size={18} aria-hidden="true" />
            <input
              value={draft.q}
              maxLength={100}
              placeholder="Nhập từ hoặc những chữ đầu..."
              onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            />
          </span>
        </label>
      )}
      <label className={styles.field}>
        Trình độ
        <select
          value={draft.cefrLevel}
          onChange={(e) => setDraft({ ...draft, cefrLevel: e.target.value })}
        >
          <option value="">Tất cả trình độ</option>
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
            <option key={level}>{level}</option>
          ))}
        </select>
      </label>
      {mode === "words" && (
        <label className={styles.field}>
          Loại từ
          <select
            value={draft.partOfSpeech}
            onChange={(e) =>
              setDraft({ ...draft, partOfSpeech: e.target.value })
            }
          >
            <option value="">Tất cả loại từ</option>
            {Object.entries(partOfSpeechLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" className={styles.primary}>
        <Search size={16} aria-hidden="true" />
        Tìm kiếm
      </button>
    </form>
  );
}
