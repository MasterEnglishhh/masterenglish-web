"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Check } from "lucide-react";
import { saveWordSense, unsaveWordSense } from "../lib/vocabulary-client";
import styles from "./vocabulary.module.css";

/** Nút lưu / bỏ lưu một nghĩa của từ. Chống bấm đúp và huỷ yêu cầu khi rời khỏi trang. */
export function WordSaveButton({
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
