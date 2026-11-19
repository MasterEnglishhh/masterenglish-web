"use client";

import { useEffect, useRef, useState } from "react";
import { RATINGS, SAMPLE_WORDS } from "../data/content";
import { SampleTag } from "@/components/sample-tag";

const FLY_MS = 420;
const FLY_CLASS = ["is-fly-left", "is-fly-down", "is-fly-right"]; // Quên, Khó, Đã nhớ

/**
 * Thẻ từ mẫu: bấm để lật, rồi chấm Quên / Khó / Đã nhớ (hoặc phím 1, 2, 3 khi đang tập trung vào khung).
 * Giống màn ôn tập thật ở chỗ chỉ được chấm sau khi lật. Chỉ là minh họa, không lưu gì.
 */
export function FlipCardDemo({ compact = false }: { compact?: boolean }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flying, setFlying] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function rate(choice: number) {
    if (!flipped || flying !== null) return;
    setFlying(choice);
    timer.current = setTimeout(() => {
      setIndex((i) => (i + 1) % SAMPLE_WORDS.length);
      setFlipped(false);
      setFlying(null);
    }, FLY_MS);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    const choice = RATINGS.findIndex((r) => r.key === e.key);
    if (choice >= 0) rate(choice);
  }

  const word = SAMPLE_WORDS[index];
  const next = SAMPLE_WORDS[(index + 1) % SAMPLE_WORDS.length];

  return (
    <div
      className={`lp-flipdemo ${compact ? "is-compact" : ""}`}
      role="group"
      aria-label="Thẻ từ mẫu để thử ôn tập"
      onKeyDown={onKeyDown}
    >
      <SampleTag />
      <div className="lp-flipstage">
        <div className="lp-flipcard lp-flipcard-peek" aria-hidden="true">
          <div className="lp-flipface">
            <strong>{next.lemma}</strong>
          </div>
        </div>
        <button
          type="button"
          className={`lp-flipcard ${flipped ? "is-flipped" : ""} ${flying !== null ? FLY_CLASS[flying] : ""}`}
          aria-pressed={flipped}
          aria-label={flipped ? "Xem lại mặt trước thẻ" : "Lật thẻ xem nghĩa tiếng Việt"}
          onClick={() => setFlipped((f) => !f)}
        >
          <span className="lp-flipface lp-flipfront">
            <strong>{word.lemma}</strong>
            <span className="ipa-text">{word.ipa}</span>
            <small>
              {word.cefr} · {word.pos}
            </small>
          </span>
          <span className="lp-flipface lp-flipback">
            <strong>{word.meaning}</strong>
            <span lang="en">{word.example}</span>
          </span>
        </button>
      </div>
      <p className="lp-flip-hint">{flipped ? "Bạn nhớ từ này đến đâu?" : "Bấm vào thẻ để lật."}</p>
      <div className="lp-rates">
        {RATINGS.map((r, i) => (
          <button key={r.key} type="button" className={`lp-rate lp-rate-${i}`} disabled={!flipped || flying !== null} onClick={() => rate(i)}>
            {r.label} <kbd>{r.key}</kbd>
          </button>
        ))}
      </div>
    </div>
  );
}
