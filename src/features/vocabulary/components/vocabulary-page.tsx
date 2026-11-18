import { Suspense } from "react";
import { VocabularyView } from "./vocabulary-view";
import styles from "./vocabulary.module.css";

/** Trang học từ vựng: danh mục, bộ thẻ và ôn tập. */
export function VocabularyPage() {
  return (
    <main className={`learning-content ${styles.page}`}>
      <Suspense
        fallback={
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", color: "var(--indigo)" }}>✳</div>
            <p style={{ fontSize: "14px", color: "#777", marginTop: "12px" }}>
              Đang mở không gian từ vựng...
            </p>
          </div>
        }
      >
        <VocabularyView />
      </Suspense>
    </main>
  );
}
