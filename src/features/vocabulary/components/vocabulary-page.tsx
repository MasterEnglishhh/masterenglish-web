import { Mascot } from "@/components/mascot";
import { Suspense } from "react";
import { VocabularyView } from "./vocabulary-view";
import styles from "./vocabulary.module.css";

/** Trang học từ vựng: danh mục, bộ thẻ và ôn tập. */
export function VocabularyPage() {
  return (
    <main className={`learning-content ${styles.page}`}>
      <Suspense
        fallback={
          <div className="page-loading" role="status">
            <Mascot expression="thinking" idSuffix="-loading" className="page-loading-mascot" />
            <p>Đang mở không gian từ vựng...</p>
          </div>
        }
      >
        <VocabularyView />
      </Suspense>
    </main>
  );
}
