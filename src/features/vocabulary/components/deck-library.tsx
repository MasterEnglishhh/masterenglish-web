"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useDeckLibrary, type DeckFilter } from "../hooks/use-deck-library";
import { DeckSelector } from "./deck-selector";
import { VocabularyPagination as PageControls } from "./vocabulary-pagination";
import { VocabularyError, VocabularyLoading } from "./vocabulary-status";
import styles from "./vocabulary.module.css";

export function DeckLibrary({
  select,
  review,
}: {
  select: (id: string) => void;
  review: () => void;
}) {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState({ q: "", level: "" });
  const [draft, setDraft] = useState({ q: "", level: "" });
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <form
        className={`${styles.toolbar} ${styles.deckToolbar}`}
        onSubmit={(event) => {
          event.preventDefault();
          setFilter(draft);
          setPage(0);
        }}
      >
        <label className={styles.field}>
          Tìm bộ từ
          <input
            value={draft.q}
            maxLength={100}
            placeholder="Tên chủ đề bạn muốn học..."
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Trình độ
          <select
            value={draft.level}
            onChange={(e) => setDraft({ ...draft, level: e.target.value })}
          >
            <option value="">Tất cả trình độ</option>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <button className={styles.primary} type="submit">
          <Search size={16} />
          Tìm kiếm
        </button>
      </form>
      <DeckLibraryPage
        key={[page, filter.q, filter.level, attempt].join(":")}
        page={page}
        filter={filter}
        select={select}
        review={review}
        retry={() => setAttempt((value) => value + 1)}
        changePage={setPage}
      />
    </>
  );
}

function DeckLibraryPage({
  page,
  filter,
  select,
  review,
  retry,
  changePage,
}: {
  page: number;
  filter: DeckFilter;
  select: (id: string) => void;
  review: () => void;
  retry: () => void;
  changePage: (page: number) => void;
}) {
  const { data, error } = useDeckLibrary(filter, page);
  if (error) return <VocabularyError message={error} retry={retry} />;
  if (!data) return <VocabularyLoading />;
  return (
    <>
      {data.warning && (
        <p role="status">Không tải được số thẻ đến hạn: {data.warning}</p>
      )}
      <div className={styles.resultBar}>
        <h2>Bộ từ theo chủ đề</h2>
        <p>{data.decks.totalItems} bộ từ phù hợp</p>
      </div>
      {data.decks.items.length === 0 ? (
        <div className={styles.empty}>
          <h2>Chưa có bộ từ phù hợp</h2>
          <p>Thử một chủ đề khác hoặc thay đổi bộ lọc trình độ.</p>
        </div>
      ) : (
        <DeckSelector
          decks={data.decks.items}
          totalDue={data.due}
          onSelectDeck={select}
          onOpenReview={review}
        />
      )}
      <PageControls
        page={page}
        totalPages={data.decks.totalPages}
        hasNext={data.decks.hasNext}
        change={changePage}
      />
    </>
  );
}
