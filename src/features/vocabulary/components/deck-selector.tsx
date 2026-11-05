"use client";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  HeartPulse,
  Laptop,
  Plane,
  Utensils,
} from "lucide-react";
import type { DeckDto } from "../types/vocabulary";
import styles from "./vocabulary.module.css";

export interface DeckSelectorProps {
  decks: DeckDto[];
  totalDue?: number;
  onSelectDeck: (id: string) => void;
  onOpenReview: () => void;
}
function topic(title: string) {
  const value = title.toLowerCase();
  if (value.includes("travel")) return { Icon: Plane, tone: "peach" };
  if (value.includes("food")) return { Icon: Utensils, tone: "green" };
  if (value.includes("technology")) return { Icon: Laptop, tone: "purple" };
  if (value.includes("health")) return { Icon: HeartPulse, tone: "green" };
  if (value.includes("academic")) return { Icon: GraduationCap, tone: "peach" };
  return { Icon: BriefcaseBusiness, tone: "purple" };
}
export function DeckSelector({
  decks,
  totalDue = 0,
  onSelectDeck,
  onOpenReview,
}: DeckSelectorProps) {
  return (
    <>
      {totalDue > 0 && (
        <section className={styles.dueBanner}>
          <div>
            <span className="section-kicker" style={{ color: "var(--lime)" }}>
              ĐẾN LÚC ÔN TẬP
            </span>
            <h2>{totalDue} nghĩa từ đang chờ bạn</h2>
            <p>Dành vài phút ôn lại những từ đã học.</p>
          </div>
          <button className={styles.primary} onClick={onOpenReview}>
            Ôn tập ngay
            <ArrowRight size={17} />
          </button>
        </section>
      )}
      <div className={styles.deckGrid}>
        {decks.map((deck) => {
          const { Icon, tone } = topic(deck.title);
          return (
            <article key={deck.id} className={styles.deckCard}>
              <div className={styles.deckCover} data-tone={tone}>
                <Icon aria-hidden="true" />
                <span
                  className={`${styles.badge} ${styles.level}`}
                  data-level={deck.level || ""}
                >
                  {deck.level || "Tổng hợp"}
                </span>
              </div>
              <div className={styles.deckBody}>
                <span className={styles.muted}>
                  {deck.cardCount} thẻ từ vựng
                </span>
                <h3>{deck.title}</h3>
                <p>
                  {deck.description || "Học nghĩa của từ qua ví dụ và phát âm."}
                </p>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => onSelectDeck(deck.id)}
                >
                  Bắt đầu học
                  <ArrowRight size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
