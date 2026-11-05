"use client";
import styles from "./vocabulary.module.css";
export function VocabularyPagination({
  page,
  totalPages,
  hasNext,
  change,
}: {
  page: number;
  totalPages: number;
  hasNext: boolean;
  change: (page: number) => void;
}) {
  if (totalPages <= 1 && page === 0) return null;
  return (
    <nav aria-label="Phân trang từ vựng" className={styles.pagination}>
      <button
        type="button"
        className={styles.secondary}
        disabled={page === 0}
        onClick={() => change(page - 1)}
      >
        Trang trước
      </button>
      <span aria-live="polite">
        Trang {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        className={styles.secondary}
        disabled={!hasNext}
        onClick={() => change(page + 1)}
      >
        Trang tiếp
      </button>
    </nav>
  );
}
