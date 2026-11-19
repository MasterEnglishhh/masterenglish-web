import { Repeat2 } from "lucide-react";
import type { WordSenseCardDto } from "../types/vocabulary";
import { partOfSpeechLabels } from "../lib/vocabulary-presentation";
import styles from "./vocabulary.module.css";

/** Thẻ lật 3D: mặt trước hỏi từ, mặt sau cho nghĩa và ví dụ. */
export function FlashcardCard({
  card,
  flipped,
  disabled,
  onFlip,
}: {
  card: WordSenseCardDto;
  flipped: boolean;
  disabled: boolean;
  onFlip: () => void;
}) {
  const example = card.examples[0];
  return (
    <button
      type="button"
      className={styles.flipCard}
      data-flipped={flipped}
      onClick={onFlip}
      disabled={disabled}
      aria-label={flipped ? "Xem lại mặt trước thẻ" : "Lật thẻ xem nghĩa tiếng Việt"}
      aria-pressed={flipped}
    >
      <span className={styles.flipCardInner}>
        <span className={styles.cardFace} aria-hidden={flipped}>
          <span className={styles.cardEyebrow}>BẠN CÓ NHỚ TỪ NÀY?</span>
          <span className={styles.lemma} lang="en">
            {card.lemma}
          </span>
          <span className={styles.ipa}>{card.ipa || ""}</span>
          <span className={styles.badges}>
            <span className={styles.badge}>{partOfSpeechLabels[card.partOfSpeech] || card.partOfSpeech}</span>
            <span className={styles.badge}>{card.cefrLevel}</span>
          </span>
          <span className={styles.flipHint}>
            <Repeat2 size={15} />
            Chạm hoặc nhấn Space để lật thẻ
          </span>
        </span>
        <span className={`${styles.cardFace} ${styles.cardBack}`} aria-hidden={!flipped}>
          <span className={styles.cardEyebrow}>NGHĨA & VÍ DỤ</span>
          <span className={styles.meaning}>{card.meaningVi}</span>
          {card.definitionEn && (
            <span className={styles.cardDefinition} lang="en">
              {card.definitionEn}
            </span>
          )}
          {example && (
            <span className={styles.cardExample}>
              <span lang="en">“{example.exampleEn}”</span>
              {example.exampleVi && <small>{example.exampleVi}</small>}
            </span>
          )}
          <span className={styles.flipHint}>
            <Repeat2 size={15} />
            Chạm để xem lại từ
          </span>
        </span>
      </span>
    </button>
  );
}
