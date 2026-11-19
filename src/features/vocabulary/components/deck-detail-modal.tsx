"use client";

import { ArrowRight } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/skeleton";
import { useDeckDetail } from "../hooks/use-deck-detail";
import type { DeckDto } from "../types/vocabulary";
import styles from "./deck-detail-modal.module.css";

export interface DeckDetailModalProps {
  deckId: string;
  initialDeck?: DeckDto | null;
  onClose: () => void;
  onStartStudy: (deckId: string) => void;
}

export function DeckDetailModal({
  deckId,
  initialDeck,
  onClose,
  onStartStudy,
}: DeckDetailModalProps) {
  const { data, error, isLoading, reload } = useDeckDetail(deckId);

  const deck = data?.deck ?? initialDeck;
  const cards = data?.previewCards ?? [];
  const totalCards = deck?.cardCount ?? 0;
  const studiedCount = cards.filter((c) => c.progress != null).length;

  const title = deck?.title ?? "Chi tiết bộ từ";
  const level = deck?.level;

  const createdDate = deck?.createdAt
    ? new Date(deck.createdAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Dialog
      kicker="CHI TIẾT BỘ TỪ VỰNG"
      kickerAside={
        level ? (
          <span className={`${styles.badge} ${styles.levelBadge}`}>
            {level}
          </span>
        ) : null
      }
      title={title}
      description={
        <p className={styles.description}>
          {deck?.description || "Học nghĩa của từ qua ví dụ và phát âm."}
        </p>
      }
      busy={isLoading}
      onClose={onClose}
    >
      <div className={styles.modalBody}>
        {isLoading && !data && (
          <div className={styles.loadingSkeleton} role="status" aria-label="Đang tải chi tiết bộ từ">
            <Skeleton variant="line-lg" />
            <Skeleton variant="line" />
            <Skeleton variant="card" />
          </div>
        )}

        {error && !data && (
          <ErrorState
            variant="inline"
            message={error}
            onRetry={reload}
            retryLabel="Thử tải lại"
          />
        )}

        {deck && (
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Trình độ</span>
              <span className={styles.metaValue}>{deck.level || "Tất cả trình độ"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Tổng số thẻ</span>
              <span className={styles.metaValue}>{totalCards} từ vựng</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Ngày tạo</span>
              <span className={styles.metaValue}>{createdDate || "Mới tạo"}</span>
            </div>
          </div>
        )}

        {data && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Xem trước từ vựng</h3>
              <span className={styles.sectionCount}>
                {cards.length > 0
                  ? `Hiển thị ${cards.length}/${totalCards} từ`
                  : "Chưa có thẻ"}
                {studiedCount > 0 && ` · ${studiedCount} từ đã học`}
              </span>
            </div>

            {cards.length === 0 ? (
              <EmptyState
                title="Chưa có từ xem trước"
                mascot="thinking"
                idSuffix="-deck-detail-empty"
              >
                Bộ từ này chưa có thẻ từ vựng nào để hiển thị xem trước.
              </EmptyState>
            ) : (
              <div className={styles.previewList} role="list" aria-label="Danh sách từ xem trước">
                {cards.map((card) => (
                  <article
                    key={card.wordSenseId}
                    className={styles.previewItem}
                    role="listitem"
                  >
                    <div className={styles.previewHeader}>
                      <span className={styles.lemma}>{card.lemma}</span>
                      {card.ipa && (
                        <span className={`ipa-text ${styles.ipa}`}>{card.ipa}</span>
                      )}
                      <div className={styles.badges}>
                        {card.partOfSpeech && (
                          <span className={styles.badge}>{card.partOfSpeech}</span>
                        )}
                        {card.cefrLevel && (
                          <span className={`${styles.badge} ${styles.levelBadge}`}>
                            {card.cefrLevel}
                          </span>
                        )}
                        {card.progress != null && (
                          <span className={styles.progressTag}>
                            Đã ôn {card.progress.repetitions} lần
                          </span>
                        )}
                        {card.isSaved && (
                          <span className={styles.progressTag}>Đã lưu</span>
                        )}
                      </div>
                    </div>
                    <p className={styles.meaning}>{card.meaningVi}</p>
                    {card.definitionEn && (
                      <p className={styles.definition}>{card.definitionEn}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.ghostAction}
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => onStartStudy(deckId)}
          >
            Bắt đầu học
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Dialog>
  );
}
