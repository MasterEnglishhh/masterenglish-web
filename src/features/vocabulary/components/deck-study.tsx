"use client";

import { useEffect, useState } from "react";
import { useDeckBatch } from "../hooks/use-deck-batch";
import { FlashcardView } from "./flashcard-view";
import { VocabularyPagination as PageControls } from "./vocabulary-pagination";
import { VocabularyError, VocabularyLoading } from "./vocabulary-status";
import styles from "./vocabulary.module.css";

export function DeckStudy({
  deckId,
  back,
}: {
  deckId: string;
  back: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <button className={styles.textButton} onClick={back}>
        ← Danh sách bộ từ
      </button>
      <DeckBatch
        key={[deckId, page, attempt].join(":")}
        deckId={deckId}
        page={page}
        back={back}
        reload={() => setAttempt((value) => value + 1)}
        changePage={setPage}
      />
    </>
  );
}
function DeckBatch({
  deckId,
  page,
  back,
  reload,
  changePage,
}: {
  deckId: string;
  page: number;
  back: () => void;
  reload: () => void;
  changePage: (page: number) => void;
}) {
  const { data, error } = useDeckBatch(deckId, page);
  if (error) return <VocabularyError message={error} retry={reload} />;
  if (!data) return <VocabularyLoading />;
  return (
    <>
      <FlashcardView
        cards={data.cards.items}
        title={data.title}
        onBackToDecks={back}
        onReloadQueue={reload}
      />
      <PageControls
        page={page}
        totalPages={data.cards.totalPages}
        hasNext={data.cards.hasNext}
        change={changePage}
      />
    </>
  );
}
