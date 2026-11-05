"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Pause } from "lucide-react";
import { fetchPronunciationTicket } from "../lib/vocabulary-client";
import styles from "./pronunciation-player.module.css";

let currentAudio: HTMLAudioElement | null = null;

export function PronunciationPlayer({
  audioUrl,
  lemma,
  compact = false,
}: {
  audioUrl: string | null;
  lemma: string;
  compact?: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const request = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = audio.current;
    return () => {
      request.current?.abort();
      element?.pause();
      if (currentAudio === element) currentAudio = null;
    };
  }, [audioUrl]);

  async function play(rate: number) {
    if (!audioUrl || loading) return;
    if (compact && playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    request.current?.abort();
    const pending = new AbortController();
    request.current = pending;
    setLoading(true);
    setError(null);
    const result = await fetchPronunciationTicket(audioUrl, pending.signal);
    if (pending.signal.aborted) return;
    setLoading(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    const element = audio.current;
    if (!element) return;
    let signed: URL;
    try {
      signed = new URL(result.data.url);
      if (signed.protocol !== "https:") throw new Error("Invalid audio URL");
    } catch {
      setError("Không thể mở âm thanh. Vui lòng thử lại.");
      return;
    }
    currentAudio?.pause();
    currentAudio = element;
    element.src = signed.toString();
    element.playbackRate = rate;
    element.preservesPitch = true;
    setReady(true);
    try {
      await element.play();
    } catch {
      if (!pending.signal.aborted) {
        setError(
          "Nhấn nút phát bên dưới để nghe; nếu chưa được, chọn Nghe phát âm để thử lại."
        );
      }
    }
  }

  return (
    <div className={`${styles.player} ${compact ? styles.compact : ""}`}>
      <div className={styles.actions}>
        <button
          type="button"
          className="button button-light"
          disabled={loading || !audioUrl}
          aria-label={`Nghe phát âm từ ${lemma}`}
          title={
            audioUrl ? `Nghe phát âm từ ${lemma}` : "Âm thanh chưa sẵn sàng"
          }
          onClick={() => void play(1)}
        >
          {playing ? (
            <Pause size={18} aria-hidden="true" />
          ) : (
            <Volume2 size={18} aria-hidden="true" />
          )}
          {!compact && (loading ? "Đang tải..." : "Nghe phát âm")}
        </button>
        {!compact && (
          <button
            type="button"
            className="button button-light"
            disabled={loading || !audioUrl}
            aria-label={`Nghe chậm từ ${lemma}`}
            onClick={() => void play(0.8)}
          >
            Nghe chậm
          </button>
        )}
      </div>
      {!compact && (
        <small className={styles.note}>
          {audioUrl
            ? "Anh–Anh · Giọng tổng hợp"
            : "Âm thanh chưa sẵn sàng cho từ này."}
        </small>
      )}
      <audio
        ref={audio}
        controls={ready && !compact}
        hidden={!ready || compact}
        preload="none"
        className={styles.audio}
        aria-label={`Phát âm từ ${lemma}`}
        onPlay={() => {
          if (currentAudio !== audio.current) currentAudio?.pause();
          currentAudio = audio.current;
          setError(null);
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setError("Không tải được âm thanh. Chọn Nghe phát âm để thử lại.");
        }}
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
