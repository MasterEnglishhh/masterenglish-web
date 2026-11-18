"use client";

import { SearchX } from "lucide-react";
import {
  useWordList,
  type WordFilter,
  type WordListMode,
} from "../hooks/use-word-list";
import { SavedWordCard, WordCard } from "./word-card";
import { VocabularyPagination } from "./vocabulary-pagination";
import styles from "./vocabulary.module.css";

/** Một trang kết quả tra từ / sổ tay. Nơi gọi đổi `key` để tải lại khi bộ lọc hoặc trang đổi. */
export function WordPage({
  mode,
  page,
  filter,
  changePage,
  open,
  reload,
}: {
  mode: WordListMode;
  page: number;
  filter: WordFilter;
  changePage: (page: number) => void;
  open: (wordId: string) => void;
  reload: () => void;
}) {
  const { data, error } = useWordList({ mode, page, filter, changePage });
  if (error)
    return (
      <div role="alert" className={styles.error}>
        <span>{error}</span>
        <button className={styles.secondary} onClick={reload}>
          Thử tải lại
        </button>
      </div>
    );
  if (!data)
    return (
      <div
        className={styles.wordGrid}
        aria-label="Đang tải từ vựng"
        role="status"
      >
        {[0, 1, 2].map((n) => (
          <div key={n} className={styles.skeleton} />
        ))}
      </div>
    );
  return (
    <>
      <div className={styles.resultBar}>
        <h2>{mode === "saved" ? "Sổ tay của bạn" : "Khám phá từ vựng"}</h2>
        <p>
          {data.totalItems} {mode === "saved" ? "nghĩa đã lưu" : "từ phù hợp"}
        </p>
      </div>
      {data.totalItems === 0 ? (
        <div className={styles.empty}>
          <SearchX size={32} aria-hidden="true" />
          <h2>
            {mode === "saved"
              ? "Sổ tay đang trống"
              : "Chưa tìm thấy từ phù hợp"}
          </h2>
          <p>
            {mode === "saved"
              ? "Lưu nghĩa từ khi tra cứu hoặc học flashcard để xem lại tại đây."
              : "Thử một từ khác hoặc thay đổi bộ lọc trình độ và loại từ."}
          </p>
        </div>
      ) : (
        <div className={styles.wordGrid}>
          {data.words.map((word) => (
            <WordCard key={word.id} word={word} onOpen={open} />
          ))}
          {data.saved.map((word) => (
            <SavedWordCard
              key={word.wordSenseId}
              word={word}
              onOpen={open}
              onRemoved={reload}
            />
          ))}
        </div>
      )}
      <VocabularyPagination
        page={page}
        totalPages={data.totalPages}
        hasNext={data.hasNext}
        change={changePage}
      />
    </>
  );
}
