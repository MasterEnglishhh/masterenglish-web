import { Suspense } from "react";
import { VocabularyView } from "@/features/vocabulary/components/vocabulary-view";
import styles from "@/features/vocabulary/components/vocabulary.module.css";

export default function VocabularyPage() {
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
