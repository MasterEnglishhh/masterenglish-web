"use client";

import { ArrowRight, Bookmark } from "lucide-react";
import { partOfSpeechLabels } from "../lib/vocabulary-presentation";
import type { SavedWordDto, WordListDto } from "../types/vocabulary";
import { PronunciationPlayer } from "./pronunciation-player";
import { WordSaveButton } from "./word-save-button";
import styles from "./vocabulary.module.css";

export function WordCard({
  word,
  onOpen,
}: {
  word: WordListDto;
  onOpen: (wordId: string) => void;
}) {
  return (
    <article className={styles.wordCard}>
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
                {partOfSpeechLabels[sense.partOfSpeech] || sense.partOfSpeech}
              </span>
            </div>
            <p>{sense.meaningVi}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.textButton}
        onClick={() => onOpen(word.id)}
      >
        Xem nghĩa và ví dụ
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
}

export function SavedWordCard({
  word,
  onOpen,
  onRemoved,
}: {
  word: SavedWordDto;
  onOpen: (wordId: string) => void;
  onRemoved: () => void;
}) {
  return (
    <article className={styles.wordCard}>
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
          onClick={() => onOpen(word.wordId)}
        >
          Chi tiết
          <ArrowRight size={15} />
        </button>
        <WordSaveButton
          senseId={word.wordSenseId}
          initialSaved
          removeOnly
          onRemoved={onRemoved}
        />
      </div>
    </article>
  );
}
