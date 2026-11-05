"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Bookmark, LibraryBig, Search } from "lucide-react";
import styles from "./vocabulary.module.css";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import type {
  DeckDto,
  PageResponse,
  WordSenseCardDto,
} from "../types/vocabulary";
import {
  fetchDecks,
  fetchDeckDetail,
  fetchDeckCards,
  fetchDueQueue,
} from "../lib/vocabulary-client";
import { DeckSelector } from "./deck-selector";
import { FlashcardView } from "./flashcard-view";
import { WordCatalog } from "./word-catalog";
import { VocabularyPagination as PageControls } from "./vocabulary-pagination";

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
function Loading() {
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

function DeckLibrary({
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
  filter: { q: string; level: string };
  select: (id: string) => void;
  review: () => void;
  retry: () => void;
  changePage: (page: number) => void;
}) {
  const [data, setData] = useState<{
    decks: PageResponse<DeckDto>;
    due: number;
    warning?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchDecks({ ...filter, page, size: 20 }),
      fetchDueQueue({ limit: 1 }),
    ]).then(([decks, due]) => {
      if (!active) return;
      if (!decks.success) setError(decks.error.message);
      else
        setData({
          decks: decks.data,
          due: due.success ? due.data.totalDue : 0,
          warning: due.success ? undefined : due.error.message,
        });
    });
    return () => {
      active = false;
    };
  }, [filter, page]);
  if (error) return <VocabularyError message={error} retry={retry} />;
  if (!data) return <Loading />;
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
function DeckStudy({ deckId, back }: { deckId: string; back: () => void }) {
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
  const [data, setData] = useState<{
    title: string;
    cards: PageResponse<WordSenseCardDto>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchDeckDetail(deckId),
      fetchDeckCards(deckId, { page, size: 20 }),
    ]).then(([detail, cards]) => {
      if (!active) return;
      if (!detail.success) setError(detail.error.message);
      else if (!cards.success) setError(cards.error.message);
      else setData({ title: detail.data.title, cards: cards.data });
    });
    return () => {
      active = false;
    };
  }, [deckId, page]);
  if (error) return <VocabularyError message={error} retry={reload} />;
  if (!data) return <Loading />;
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
