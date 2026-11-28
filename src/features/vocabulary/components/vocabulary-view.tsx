"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { BookOpen, Bookmark, LibraryBig, Search } from "lucide-react";
import { RouteTransition } from "@/components/route-transition";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";
import styles from "./vocabulary.module.css";
import { useAuthSession } from "@/features/auth";
import { DeckLibrary } from "./deck-library";
import { DeckStudy } from "./deck-study";
import { WordCatalog } from "./word-catalog";
import { isUuid } from "@/lib/api-validation";
import { ErrorState } from "@/components/error-state";

const VIEWS = ["decks", "words", "saved"] as const;

export function VocabularyView() {
  const router = useRouter();
  const tabsRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const params = useSearchParams();
  const { user } = useAuthSession();
  const deckId = params.get("deck");
  const back = () => router.push("/learn/vocabulary");
  const requestedView = params.get("view");
  const view: (typeof VIEWS)[number] =
    requestedView === "words" || requestedView === "saved" ? requestedView : "decks";
  useSlidingIndicator(tabsRef, indicatorRef, deckId ? "" : view);
  if (deckId && !isUuid(deckId)) return <><h1>Bộ từ vựng</h1><ErrorState message="Mã bộ từ trong đường dẫn không hợp lệ." onRetry={back} retryLabel="Về danh sách bộ từ" /></>;
  if (deckId)
    return (
      <DeckStudy key={user?.id + ":" + deckId} deckId={deckId} back={back} />
    );
  return (
    <>
      <header className={styles.header}>
        <div>
          <span className="section-kicker">KHÔNG GIAN TỪ VỰNG</span>
          <h1>
            Từ mới, <em>thêm tự tin.</em>
          </h1>
          <p>
            Chọn bộ từ, nghe phát âm và lưu lại những nghĩa bạn muốn ghi nhớ.
          </p>
        </div>
        <span className={styles.headerIcon}>
          <BookOpen size={30} aria-hidden="true" />
        </span>
      </header>
      <nav ref={tabsRef} aria-label="Danh mục từ vựng" className={styles.tabs}>
        <span ref={indicatorRef} className={`slide-indicator ${styles.tabIndicator}`} aria-hidden="true" />
        {[
          ["decks", "Bộ từ"],
          ["words", "Tra từ"],
          ["saved", "Từ đã lưu"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={styles.tab}
            aria-current={view === key ? "page" : undefined}
            onClick={() => router.push("/learn/vocabulary?view=" + key)}
          >
            {key === "decks" ? (
              <LibraryBig size={17} />
            ) : key === "words" ? (
              <Search size={17} />
            ) : (
              <Bookmark size={17} />
            )}
            {label}
          </button>
        ))}
      </nav>
      <RouteTransition transitionKey={view} order={VIEWS.indexOf(view)}>
        {view === "words" || view === "saved" ? (
          <WordCatalog key={user?.id + ":" + params.toString()} mode={view} />
        ) : (
          <DeckLibrary
            key={user?.id}
            select={(id) =>
              router.push("/learn/vocabulary?deck=" + encodeURIComponent(id))
            }
            review={() => router.push("/learn/review")}
          />
        )}
      </RouteTransition>
    </>
  );
}
