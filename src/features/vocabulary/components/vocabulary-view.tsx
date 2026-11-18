"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Bookmark, LibraryBig, Search } from "lucide-react";
import styles from "./vocabulary.module.css";
import { useAuthSession } from "@/features/auth";
import { DeckLibrary } from "./deck-library";
import { DeckStudy } from "./deck-study";
import { WordCatalog } from "./word-catalog";

export function VocabularyView() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuthSession();
  const deckId = params.get("deck");
  const back = () => router.push("/learn/vocabulary");
  const view =
    params.get("view") === "words" || params.get("view") === "saved"
      ? params.get("view")
      : "decks";
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
      <nav aria-label="Danh mục từ vựng" className={styles.tabs}>
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
    </>
  );
}
