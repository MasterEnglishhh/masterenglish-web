import styles from "./vocabulary.module.css";

export function VocabularyError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className={styles.error} role="alert">
      <p>{message}</p>
      <button className={styles.secondary} onClick={retry}>
        Tải lại dữ liệu
      </button>
    </div>
  );
}

export function VocabularyLoading() {
  return (
    <div
      className={styles.wordGrid}
      role="status"
      aria-label="Đang tải dữ liệu từ vựng"
    >
      {[0, 1, 2].map((n) => (
        <div key={n} className={styles.skeleton} />
      ))}
    </div>
  );
}
