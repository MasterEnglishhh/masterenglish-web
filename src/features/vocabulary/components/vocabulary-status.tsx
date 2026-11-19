import { Skeleton } from "@/components/skeleton";
import styles from "./vocabulary.module.css";

/** Ba thẻ giữ chỗ trong lưới từ vựng/bộ từ khi đang tải. */
export function VocabularyLoading({ label = "Đang tải dữ liệu từ vựng" }: { label?: string }) {
  return (
    <div className={styles.wordGrid} role="status" aria-label={label}>
      {[0, 1, 2].map((n) => (
        <Skeleton key={n} variant="card" />
      ))}
    </div>
  );
}
