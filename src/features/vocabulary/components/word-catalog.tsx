"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Search,
  SearchX,
} from "lucide-react";
import {
  fetchWords,
  fetchWordDetail,
  fetchSavedWords,
  fetchSavedSenseIds,
  saveWordSense,
  unsaveWordSense,
} from "../lib/vocabulary-client";
import type {
  WordListDto,
  SavedWordDto,
  WordDetailDto,
} from "../types/vocabulary";
import {
  partOfSpeechLabels,
  vocabularyPageNumber,
} from "../lib/vocabulary-presentation";
import { VocabularyPagination } from "./vocabulary-pagination";
import { PronunciationPlayer } from "./pronunciation-player";
import styles from "./vocabulary.module.css";

type Filter = { q: string; cefrLevel: string; partOfSpeech: string };
type Mode = "words" | "saved";

export function WordCatalog({ mode }: { mode: Mode }) {
  const router = useRouter();
  const search = useSearchParams();
  const query = search.toString();
  const filter: Filter = {
    q: search.get("q") || "",
    cefrLevel: search.get("level") || "",
    partOfSpeech: search.get("pos") || "",
  };
  const [draft, setDraft] = useState(filter);
  const [attempt, setAttempt] = useState(0);
  const wordId = search.get("word");
  const page = vocabularyPageNumber(search.get("page"));
  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(query);
      next.set("view", mode);
      Object.entries(updates).forEach(([key, value]) =>
        value ? next.set(key, value) : next.delete(key)
      );
      router.push("/learn/vocabulary?" + next.toString(), { scroll: false });
    },
    [query, mode, router]
  );
  const changePage = useCallback(
    (value: number) => navigate({ page: value ? String(value) : null }),
    [navigate]
  );
  const reload = () => setAttempt((value) => value + 1);
  if (wordId)
    return (
      <WordDetail
        key={wordId + ":" + attempt}
        wordId={wordId}
        back={() => navigate({ word: null })}
        retry={reload}
      />
    );
  return (
    <>
      <form
        className={`${styles.toolbar} ${mode === "saved" ? styles.savedToolbar : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          navigate({
            q: mode === "words" ? draft.q.trim() : null,
            level: draft.cefrLevel,
            pos: mode === "words" ? draft.partOfSpeech : null,
            page: null,
          });
        }}
      >
        {mode === "words" && (
          <label className={styles.field}>
            Tìm từ tiếng Anh
            <span className={styles.inputWrap}>
              <Search size={18} aria-hidden="true" />
              <input
                value={draft.q}
                maxLength={100}
                placeholder="Nhập từ hoặc những chữ đầu..."
                onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              />
            </span>
          </label>
        )}
        <label className={styles.field}>
          Trình độ
          <select
            value={draft.cefrLevel}
            onChange={(e) => setDraft({ ...draft, cefrLevel: e.target.value })}
          >
            <option value="">Tất cả trình độ</option>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        {mode === "words" && (
          <label className={styles.field}>
            Loại từ
            <select
              value={draft.partOfSpeech}
              onChange={(e) =>
                setDraft({ ...draft, partOfSpeech: e.target.value })
              }
            >
              <option value="">Tất cả loại từ</option>
              {Object.entries(partOfSpeechLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className={styles.primary}>
          <Search size={16} aria-hidden="true" />
          Tìm kiếm
        </button>
      </form>
      <WordPage
        key={[
          mode,
          page,
          filter.q,
          filter.cefrLevel,
          filter.partOfSpeech,
          attempt,
        ].join(":")}
        mode={mode}
        page={page}
        filter={filter}
        changePage={changePage}
        open={(id) => navigate({ word: id })}
        reload={reload}
      />
    </>
  );
}

function WordPage({
  mode,
  page,
  filter,
  changePage,
  open,
  reload,
}: {
  mode: Mode;
  page: number;
  filter: Filter;
  changePage: (page: number) => void;
  open: (id: string) => void;
  reload: () => void;
}) {
  const { q, cefrLevel, partOfSpeech } = filter;
  const [data, setData] = useState<{
    words: WordListDto[];
    saved: SavedWordDto[];
    totalItems: number;
    hasNext: boolean;
    totalPages: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      const result =
        mode === "words"
          ? await fetchWords({ q, cefrLevel, partOfSpeech, page, size: 12 })
          : await fetchSavedWords({ cefrLevel, page, size: 12 });
      if (!active) return;
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      if (
        page > 0 &&
        result.data.items.length === 0 &&
        page >= result.data.totalPages
      ) {
        changePage(Math.max(0, result.data.totalPages - 1));
        return;
      }
      setData({
        ...result.data,
        words: mode === "words" ? (result.data.items as WordListDto[]) : [],
        saved: mode === "saved" ? (result.data.items as SavedWordDto[]) : [],
      });
    }
    void load();
    return () => {
      active = false;
    };
  }, [mode, page, q, cefrLevel, partOfSpeech, changePage]);
  if (error)
    return (
      <div role="alert" className={styles.error}>
        <span>{error}</span>
        <button className={styles.secondary} onClick={reload}>
          Thử tải lại
        </button>
      </div>
    );
  if (!data)
    return (
      <div
        className={styles.wordGrid}
        aria-label="Đang tải từ vựng"
        role="status"
      >
        {[0, 1, 2].map((n) => (
          <div key={n} className={styles.skeleton} />
        ))}
      </div>
    );
  return (
    <>
      <div className={styles.resultBar}>
        <h2>{mode === "saved" ? "Sổ tay của bạn" : "Khám phá từ vựng"}</h2>
        <p>
          {data.totalItems} {mode === "saved" ? "nghĩa đã lưu" : "từ phù hợp"}
        </p>
      </div>
      {data.totalItems === 0 ? (
        <div className={styles.empty}>
          <SearchX size={32} aria-hidden="true" />
          <h2>
            {mode === "saved"
              ? "Sổ tay đang trống"
              : "Chưa tìm thấy từ phù hợp"}
          </h2>
          <p>
            {mode === "saved"
              ? "Lưu nghĩa từ khi tra cứu hoặc học flashcard để xem lại tại đây."
              : "Thử một từ khác hoặc thay đổi bộ lọc trình độ và loại từ."}
          </p>
        </div>
      ) : (
        <div className={styles.wordGrid}>
          {data.words.map((word) => (
            <article key={word.id} className={styles.wordCard}>
              <div className={styles.wordTop}>
                <div>
                  <h2 lang="en">{word.lemma}</h2>
                  <span className={styles.ipa}>{word.ipa || "—"}</span>
                </div>
                <PronunciationPlayer
                  audioUrl={word.audioUrl}
                  lemma={word.lemma}
                  compact
                />
              </div>
              <ul className={styles.senseList}>
                {word.senses.map((sense) => (
                  <li key={sense.id}>
                    <div className={styles.badges}>
                      <span
                        className={`${styles.badge} ${styles.level}`}
                        data-level={sense.cefrLevel}
                      >
                        {sense.cefrLevel}
                      </span>
                      <span className={styles.badge}>
                        {partOfSpeechLabels[sense.partOfSpeech] ||
                          sense.partOfSpeech}
                      </span>
                    </div>
                    <p>{sense.meaningVi}</p>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => open(word.id)}
              >
                Xem nghĩa và ví dụ
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
          {data.saved.map((word) => (
            <article key={word.wordSenseId} className={styles.wordCard}>
              <div className={styles.wordTop}>
                <div>
                  <h2 lang="en">{word.lemma}</h2>
                  <span className={styles.ipa}>{word.ipa}</span>
                </div>
                <Bookmark size={20} color="var(--indigo)" aria-hidden="true" />
              </div>
              <div className={styles.badges}>
                <span
                  className={`${styles.badge} ${styles.level}`}
                  data-level={word.cefrLevel}
                >
                  {word.cefrLevel}
                </span>
                <span className={styles.badge}>
                  {partOfSpeechLabels[word.partOfSpeech] || word.partOfSpeech}
                </span>
              </div>
              <p className={styles.definition}>{word.meaningVi}</p>
              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => open(word.wordId)}
                >
                  Chi tiết
                  <ArrowRight size={15} />
                </button>
                <WordAction
                  senseId={word.wordSenseId}
                  initialSaved
                  removeOnly
                  onRemoved={reload}
                />
              </div>
            </article>
          ))}
        </div>
      )}
      <VocabularyPagination
        page={page}
        totalPages={data.totalPages}
        hasNext={data.hasNext}
        change={changePage}
      />
    </>
  );
}

function WordDetail({
  wordId,
  back,
  retry,
}: {
  wordId: string;
  back: () => void;
  retry: () => void;
}) {
  const [data, setData] = useState<WordDetailDto | null>(null);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    window.scrollTo({ top: 0, behavior: "instant" });
    void Promise.all([
      fetchWordDetail(wordId),
      fetchSavedSenseIds(wordId),
    ]).then(([detail, membership]) => {
      if (!active) return;
      if (!detail.success) {
        setError(detail.error.message);
        return;
      }
      setData(detail.data);
      if (membership.success) setSaved(membership.data);
      else setWarning("Chưa tải được trạng thái từ đã lưu. Vui lòng thử lại.");
    });
    return () => {
      active = false;
    };
  }, [wordId]);
  return (
    <div className={styles.detail}>
      <button type="button" className={styles.textButton} onClick={back}>
        <ArrowLeft size={17} />
        Quay lại danh sách
      </button>
      {error ? (
        <div role="alert" className={styles.error}>
          {error}
          <button className={styles.secondary} onClick={retry}>
            Thử lại
          </button>
        </div>
      ) : !data ? (
        <p role="status" className={styles.notice}>
          Đang tải nghĩa và ví dụ...
        </p>
      ) : (
        <>
          <header className={styles.detailHero}>
            <span className="section-kicker">TỪ VỰNG / CHI TIẾT</span>
            <h2 lang="en">{data.lemma}</h2>
            <p className={styles.ipa}>{data.ipa}</p>
            <PronunciationPlayer audioUrl={data.audioUrl} lemma={data.lemma} />
          </header>
          {warning && (
            <div role="alert" className={styles.error}>
              {warning}
              <button className={styles.secondary} onClick={retry}>
                Tải lại
              </button>
            </div>
          )}
          {data.senses.map((sense, index) => (
            <article key={sense.id} className={styles.senseCard}>
              <div className={styles.badges}>
                <span
                  className={`${styles.badge} ${styles.level}`}
                  data-level={sense.cefrLevel}
                >
                  {sense.cefrLevel}
                </span>
                <span className={styles.badge}>
                  {partOfSpeechLabels[sense.partOfSpeech] || sense.partOfSpeech}
                </span>
                <span className={styles.muted}>Nghĩa {index + 1}</span>
              </div>
              <div className={styles.senseHeading}>
                <h3>{sense.meaningVi}</h3>
              </div>
              {sense.definitionEn && (
                <p className={styles.definition} lang="en">
                  {sense.definitionEn}
                </p>
              )}
              {sense.examples.map((example) => (
                <blockquote key={example.id} className={styles.example}>
                  <p lang="en">{example.exampleEn}</p>
                  {example.exampleVi && <p>{example.exampleVi}</p>}
                </blockquote>
              ))}
              <WordAction
                key={sense.id + ":" + String(saved?.includes(sense.id))}
                senseId={sense.id}
                initialSaved={saved ? saved.includes(sense.id) : undefined}
              />
            </article>
          ))}
        </>
      )}
    </div>
  );
}

function WordAction({
  senseId,
  initialSaved,
  removeOnly = false,
  onRemoved,
}: {
  senseId: string;
  initialSaved?: boolean;
  removeOnly?: boolean;
  onRemoved?: () => void;
}) {
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  useEffect(() => () => request.current?.abort(), []);
  async function toggle() {
    if (locked.current || initialSaved === undefined) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    const controller = new AbortController();
    request.current = controller;
    const result = saved
      ? await unsaveWordSense(senseId, controller.signal)
      : await saveWordSense(senseId, controller.signal);
    if (controller.signal.aborted) return;
    locked.current = false;
    setBusy(false);
    if (result.success) {
      setSaved(!saved);
      if (saved && removeOnly) onRemoved?.();
    } else setError(result.error.message);
  }
  return (
    <div>
      <button
        type="button"
        className={styles.secondary}
        disabled={busy || initialSaved === undefined}
        aria-pressed={saved}
        onClick={() => void toggle()}
      >
        {saved ? (
          <Check size={15} aria-hidden="true" />
        ) : (
          <Bookmark size={15} aria-hidden="true" />
        )}
        {busy
          ? "Đang cập nhật..."
          : initialSaved === undefined
            ? "Chưa tải trạng thái lưu"
            : saved
              ? removeOnly
                ? "Bỏ lưu"
                : "Đã lưu · Bỏ lưu"
              : "Lưu nghĩa này"}
      </button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
