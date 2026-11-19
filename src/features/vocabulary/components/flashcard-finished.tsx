import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Mascot } from "@/components/mascot";
import styles from "./vocabulary.module.css";

interface FinishedSummary {
  totalReviewed: number;
  goodCount: number;
  hardCount: number;
  againCount: number;
}

/** Màn hoàn thành lượt học: linh vật ăn mừng, ba chỉ số chấm điểm và các lối đi tiếp. */
export function FlashcardFinished({
  summary,
  onRestart,
  onReloadQueue,
  onBackToDecks,
}: {
  summary: FinishedSummary;
  onRestart: () => void;
  onReloadQueue?: () => void;
  onBackToDecks?: () => void;
}) {
  const reviewed = summary.totalReviewed > 0;
  return (
    <section className={styles.study}>
      <div className={styles.finished}>
        <Mascot expression="celebrating" idSuffix="-done" className={styles.finishedMascot} />
        <h2>{reviewed ? "Hoàn thành lượt học!" : "Bạn đã xem hết lượt thẻ."}</h2>
        <p className={styles.muted}>
          {reviewed
            ? `Đã lưu kết quả của ${summary.totalReviewed} nghĩa từ. Hẹn gặp bạn ở lượt ôn tiếp theo.`
            : "Bạn có thể xem lại nội dung; lịch ôn được giữ nguyên."}
        </p>
        {reviewed && (
          <div className={styles.summary}>
            <div>
              <strong>{summary.goodCount}</strong>
              <span>Đã nhớ</span>
            </div>
            <div>
              <strong>{summary.hardCount}</strong>
              <span>Còn khó</span>
            </div>
            <div>
              <strong>{summary.againCount}</strong>
              <span>Cần học lại</span>
            </div>
          </div>
        )}
        <div className={styles.finishedActions}>
          <button className={styles.primary} onClick={onRestart}>
            <RotateCcw size={16} />
            Xem lại thẻ
          </button>
          {onReloadQueue && (
            <button className={styles.secondary} onClick={onReloadQueue}>
              Cập nhật tiến độ
            </button>
          )}
          {onBackToDecks ? (
            <button className={styles.secondary} onClick={onBackToDecks}>
              Danh sách bộ từ
            </button>
          ) : (
            <Link className={styles.secondary} href="/learn/vocabulary">
              Danh sách bộ từ
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
