"use client";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Pagination } from "@/components/pagination";
import {
  useWordList,
  type WordFilter,
  type WordListMode,
} from "../hooks/use-word-list";
import { SavedWordCard, WordCard } from "./word-card";
import { VocabularyLoading } from "./vocabulary-status";
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
    return <ErrorState message={error} onRetry={reload} idSuffix="-words-error" />;
  if (!data) return <VocabularyLoading label="Đang tải từ vựng" />;
  return (
    <>
      <div className={styles.resultBar}>
        <h2>{mode === "saved" ? "Sổ tay của bạn" : "Khám phá từ vựng"}</h2>
        <p>
          {data.totalItems} {mode === "saved" ? "nghĩa đã lưu" : "từ phù hợp"}
        </p>
      </div>
      {data.totalItems === 0 ? (
        <EmptyState
          title={mode === "saved" ? "Sổ tay đang trống" : "Chưa tìm thấy từ phù hợp"}
          mascot={mode === "saved" ? "sleepy" : "thinking"}
          idSuffix="-words-empty"
        >
          {mode === "saved"
            ? "Lưu nghĩa từ khi tra cứu hoặc học flashcard để xem lại tại đây."
            : "Thử một từ khác hoặc thay đổi bộ lọc trình độ và loại từ."}
        </EmptyState>
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
      <Pagination
        page={page + 1}
        totalPages={data.totalPages}
        hasNext={data.hasNext}
        onChange={(next) => changePage(next - 1)}
        label="Phân trang từ vựng"
      />
    </>
  );
}
