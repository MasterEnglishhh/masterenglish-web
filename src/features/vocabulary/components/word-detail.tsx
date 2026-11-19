"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { partOfSpeechLabels } from "../lib/vocabulary-presentation";
import { useWordDetail } from "../hooks/use-word-detail";
import { PronunciationPlayer } from "./pronunciation-player";
import { WordSaveButton } from "./word-save-button";
import styles from "./vocabulary.module.css";

export function WordDetail({
  wordId,
  back,
  retry,
}: {
  wordId: string;
  back: () => void;
  retry: () => void;
}) {
  const { data, saved, error, warning } = useWordDetail(wordId);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
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
              <WordSaveButton
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
