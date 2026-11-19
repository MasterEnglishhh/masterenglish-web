"use client";

import { Bookmark, Check } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { WordSenseCardDto } from "../types/vocabulary";
import { useFlashcardHotkeys } from "../hooks/use-flashcard-hotkeys";
import { useVocabularyPractice } from "../hooks/use-vocabulary-practice";
import { FlashcardCard } from "./flashcard-card";
import { FlashcardFinished } from "./flashcard-finished";
import { PronunciationPlayer } from "./pronunciation-player";
import styles from "./vocabulary.module.css";

export interface FlashcardViewProps {
  cards: WordSenseCardDto[];
  title?: string;
  onCardReviewed?: (card: WordSenseCardDto) => void;
  onBackToDecks?: () => void;
  onReloadQueue?: () => void;
}

const RATINGS = [
  ["AGAIN", "Quên", "Ôn lại sau 10 phút", "1"],
  ["HARD", "Khó", "Cần thêm thời gian nhớ", "2"],
  ["GOOD", "Đã nhớ", "Tự tin với nghĩa này", "3"],
] as const;

export function FlashcardView({ cards, title, onCardReviewed, onBackToDecks, onReloadQueue }: FlashcardViewProps) {
  const {
    currentIndex,
    totalCards,
    currentCard,
    flipped,
    isPending,
    error,
    isFinished,
    summary,
    flip,
    toggleSave,
    rate,
    retry,
    restart,
    canRate,
    uncertain,
    requiresReload,
    previewOnly,
    nextPreview,
    isSaving,
  } = useVocabularyPractice({ cards, onCardReviewed });
  useFlashcardHotkeys({
    enabled: !!currentCard && !isFinished,
    flipped,
    isPending,
    isSaving,
    canRate,
    uncertain,
    flip,
    nextPreview,
    rate,
  });
  if (!cards.length)
    return (
      <EmptyState
        title="Chưa có thẻ trong lượt này"
        mascot="thinking"
        idSuffix="-cards-empty"
        action={
          onBackToDecks && (
            <button className="btn-ghost btn-sm" onClick={onBackToDecks}>
              Về danh sách bộ từ
            </button>
          )
        }
      >
        Chọn bộ từ khác hoặc quay lại danh sách để tiếp tục học.
      </EmptyState>
    );
  if (isFinished)
    return (
      <FlashcardFinished
        summary={summary}
        onRestart={restart}
        onReloadQueue={onReloadQueue}
        onBackToDecks={onBackToDecks}
      />
    );
  if (!currentCard) return null;
  return (
    <section className={styles.study} aria-label="Học flashcard">
      <div className={styles.studyHeading}>
        <h2>{title || "Học từ vựng"}</h2>
        <span className={styles.counter}>
          Thẻ {currentIndex + 1} / {totalCards}
        </span>
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label="Tiến độ lượt học"
        aria-valuenow={currentIndex}
        aria-valuemin={0}
        aria-valuemax={totalCards}
      >
        <span style={{ width: `${(100 * currentIndex) / totalCards}%` }} />
      </div>
      <div className={styles.studyTools}>
        <PronunciationPlayer key={currentCard.wordRevisionId} lemma={currentCard.lemma} audioUrl={currentCard.audioUrl} />
        <button
          type="button"
          className={styles.secondary}
          disabled={isSaving || isPending}
          onClick={() => void toggleSave()}
          aria-pressed={!!currentCard.isSaved}
        >
          {currentCard.isSaved ? <Check size={16} /> : <Bookmark size={16} />}
          {isSaving ? "Đang lưu..." : currentCard.isSaved ? "Đã lưu · Bỏ lưu" : "Lưu từ"}
        </button>
      </div>
      <FlashcardCard key={currentCard.wordSenseId} card={currentCard} flipped={flipped} disabled={isPending} onFlip={flip} />
      {error && (
        <div role="alert" className={styles.error}>
          <span>{error}</span>
          {uncertain && (
            <button className={styles.secondary} disabled={isPending} onClick={() => void retry()}>
              Gửi lại cùng đánh giá
            </button>
          )}
          {onReloadQueue && (
            <button className={styles.secondary} onClick={onReloadQueue}>
              Tải lại tiến độ
            </button>
          )}
        </div>
      )}
      {!canRate && !requiresReload && !uncertain ? (
        <div className={styles.notice}>
          <span>
            {previewOnly
              ? "Bạn đang xem lại thẻ; lịch ôn được giữ nguyên."
              : "Thẻ chưa đến hạn ôn. Bạn vẫn có thể xem nội dung và nghe phát âm."}
          </span>
          <button className={styles.secondary} onClick={nextPreview}>
            Xem thẻ tiếp →
          </button>
        </div>
      ) : (
        <div className={styles.ratings}>
          <p>{flipped ? "Bạn nhớ nghĩa này thế nào?" : "Lật thẻ để kiểm tra nghĩa, rồi tự đánh giá."}</p>
          <div className={styles.ratingButtons}>
            {RATINGS.map(([value, label, hint, key]) => (
              <button
                key={value}
                type="button"
                className={styles.rating}
                data-rating={value}
                onClick={() => void rate(value)}
                disabled={!flipped || isPending || isSaving || !canRate || uncertain}
                title={`Phím ${key}`}
              >
                <span>
                  {isPending ? "Đang lưu..." : label}
                  <span aria-hidden="true"> · {key}</span>
                </span>
                <small>{hint}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
