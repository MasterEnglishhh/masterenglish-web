"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  CheckCircle2,
  RotateCcw,
  Repeat2,
} from "lucide-react";
import type { WordSenseCardDto, RatingType } from "../types/vocabulary";
import { useVocabularyPractice } from "../hooks/use-vocabulary-practice";
import { partOfSpeechLabels } from "../lib/vocabulary-presentation";
import { PronunciationPlayer } from "./pronunciation-player";
import styles from "./vocabulary.module.css";

export interface FlashcardViewProps {
  cards: WordSenseCardDto[];
  title?: string;
  onCardReviewed?: (card: WordSenseCardDto) => void;
  onBackToDecks?: () => void;
  onReloadQueue?: () => void;
}
export function FlashcardView({
  cards,
  title,
  onCardReviewed,
  onBackToDecks,
  onReloadQueue,
}: FlashcardViewProps) {
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
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        !currentCard ||
        isFinished ||
        event.repeat ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            "button,a,input,textarea,select,audio,video,[contenteditable]"
          ))
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        flip();
      } else if (event.code === "ArrowRight" && !canRate) nextPreview();
      else if (flipped && !isPending && !isSaving && canRate && !uncertain) {
        const rating: Record<string, RatingType> = {
          "1": "AGAIN",
          "2": "HARD",
          "3": "GOOD",
        };
        if (rating[event.key]) void rate(rating[event.key]);
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [
    currentCard,
    isFinished,
    flip,
    flipped,
    isPending,
    isSaving,
    rate,
    canRate,
    uncertain,
    nextPreview,
  ]);
  if (!cards.length)
    return (
      <div className={styles.empty}>
        <h2>Chưa có thẻ trong lượt này</h2>
        <p>Chọn bộ từ khác hoặc quay lại danh sách để tiếp tục học.</p>
        {onBackToDecks && (
          <button className={styles.secondary} onClick={onBackToDecks}>
            Về danh sách bộ từ
          </button>
        )}
      </div>
    );
  if (isFinished)
    return (
      <section className={styles.study}>
        <div className={styles.finished}>
          <CheckCircle2 size={42} aria-hidden="true" />
          <h2>
            {summary.totalReviewed
              ? "Hoàn thành lượt học!"
              : "Bạn đã xem hết lượt thẻ."}
          </h2>
          <p className={styles.muted}>
            {summary.totalReviewed
              ? `Đã lưu kết quả của ${summary.totalReviewed} nghĩa từ. Hẹn gặp bạn ở lượt ôn tiếp theo.`
              : "Bạn có thể xem lại nội dung; lịch ôn được giữ nguyên."}
          </p>
          {summary.totalReviewed > 0 && (
            <div className={styles.summary}>
              <div>
                <strong>{summary.goodCount}</strong>
                <span>Đã nhớ</span>
              </div>
              <div>
                <strong>{summary.hardCount}</strong>
                <span>Còn khó</span>
              </div>
              <div>
                <strong>{summary.againCount}</strong>
                <span>Cần học lại</span>
              </div>
            </div>
          )}
          <div className={styles.finishedActions}>
            <button className={styles.primary} onClick={restart}>
              <RotateCcw size={16} />
              Xem lại thẻ
            </button>
            {onReloadQueue && (
              <button className={styles.secondary} onClick={onReloadQueue}>
                Cập nhật tiến độ
              </button>
            )}
            {onBackToDecks ? (
              <button className={styles.secondary} onClick={onBackToDecks}>
                Danh sách bộ từ
              </button>
            ) : (
              <Link className={styles.secondary} href="/learn/vocabulary">
                Danh sách bộ từ
              </Link>
            )}
          </div>
        </div>
      </section>
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
        <PronunciationPlayer
          key={currentCard.wordRevisionId}
          lemma={currentCard.lemma}
          audioUrl={currentCard.audioUrl}
        />
        <button
          type="button"
          className={styles.secondary}
          disabled={isSaving || isPending}
          onClick={() => void toggleSave()}
          aria-pressed={!!currentCard.isSaved}
        >
          {currentCard.isSaved ? <Check size={16} /> : <Bookmark size={16} />}
          {isSaving
            ? "Đang lưu..."
            : currentCard.isSaved
              ? "Đã lưu · Bỏ lưu"
              : "Lưu từ"}
        </button>
      </div>
      <button
        key={currentCard.wordSenseId}
        type="button"
        className={styles.flipCard}
        data-flipped={flipped}
        onClick={flip}
        disabled={isPending}
        aria-label={
          flipped ? "Xem lại mặt trước thẻ" : "Lật thẻ xem nghĩa tiếng Việt"
        }
        aria-pressed={flipped}
      >
        <span className={styles.flipCardInner}>
          <span className={styles.cardFace} aria-hidden={flipped}>
            <span className={styles.cardEyebrow}>BẠN CÓ NHỚ TỪ NÀY?</span>
            <span className={styles.lemma} lang="en">
              {currentCard.lemma}
            </span>
            <span className={styles.ipa} style={{ color: "#ddd8fb" }}>
              {currentCard.ipa || ""}
            </span>
            <span className={styles.badges}>
              <span className={styles.badge}>
                {partOfSpeechLabels[currentCard.partOfSpeech] ||
                  currentCard.partOfSpeech}
              </span>
              <span className={styles.badge}>{currentCard.cefrLevel}</span>
            </span>
            <span className={styles.flipHint}>
              <Repeat2 size={15} />
              Chạm hoặc nhấn Space để lật thẻ
            </span>
          </span>
          <span
            className={`${styles.cardFace} ${styles.cardBack}`}
            aria-hidden={!flipped}
          >
            <span className={styles.cardEyebrow}>NGHĨA & VÍ DỤ</span>
            <span className={styles.meaning}>{currentCard.meaningVi}</span>
            {currentCard.definitionEn && (
              <span className={styles.cardDefinition} lang="en">
                {currentCard.definitionEn}
              </span>
            )}
            {currentCard.examples[0] && (
              <span className={styles.cardExample}>
                <span lang="en">“{currentCard.examples[0].exampleEn}”</span>
                {currentCard.examples[0].exampleVi && (
                  <small>{currentCard.examples[0].exampleVi}</small>
                )}
              </span>
            )}
            <span className={styles.flipHint}>
              <Repeat2 size={15} />
              Chạm để xem lại từ
            </span>
          </span>
        </span>
      </button>
      {error && (
        <div role="alert" className={styles.error}>
          <span>{error}</span>
          {uncertain && (
            <button
              className={styles.secondary}
              disabled={isPending}
              onClick={() => void retry()}
            >
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
          <p>
            {flipped
              ? "Bạn nhớ nghĩa này thế nào?"
              : "Lật thẻ để kiểm tra nghĩa, rồi tự đánh giá."}
          </p>
          <div className={styles.ratingButtons}>
            {(
              [
                ["AGAIN", "Quên", "Ôn lại sau 10 phút", "1"],
                ["HARD", "Khó", "Cần thêm thời gian nhớ", "2"],
                ["GOOD", "Đã nhớ", "Tự tin với nghĩa này", "3"],
              ] as const
            ).map(([value, label, hint, key]) => (
              <button
                key={value}
                type="button"
                className={styles.rating}
                data-rating={value}
                onClick={() => void rate(value)}
                disabled={
                  !flipped || isPending || isSaving || !canRate || uncertain
                }
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
