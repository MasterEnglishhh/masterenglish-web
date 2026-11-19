"use client";

import { useEffect } from "react";
import type { RatingType } from "../types/vocabulary";

const RATING_KEYS: Record<string, RatingType> = { "1": "AGAIN", "2": "HARD", "3": "GOOD" };
/** Phím tắt không được chạy khi người dùng đang thao tác trong các phần tử này. */
const INTERACTIVE = "button,a,input,textarea,select,audio,video,[contenteditable]";

interface FlashcardHotkeys {
  /** Tắt toàn bộ phím tắt (hết thẻ hoặc đã xong lượt). */
  enabled: boolean;
  flipped: boolean;
  isPending: boolean;
  isSaving: boolean;
  canRate: boolean;
  uncertain: boolean;
  flip: () => void;
  nextPreview: () => void;
  rate: (rating: RatingType) => unknown;
}

/** Space lật thẻ, ArrowRight xem thẻ tiếp khi chỉ xem lại, 1/2/3 chấm Quên/Khó/Đã nhớ sau khi lật. */
export function useFlashcardHotkeys({
  enabled,
  flipped,
  isPending,
  isSaving,
  canRate,
  uncertain,
  flip,
  nextPreview,
  rate,
}: FlashcardHotkeys) {
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (!enabled || event.repeat) return;
      if (event.target instanceof HTMLElement && event.target.closest(INTERACTIVE)) return;
      if (event.code === "Space") {
        event.preventDefault();
        flip();
      } else if (event.code === "ArrowRight" && !canRate) nextPreview();
      else if (flipped && !isPending && !isSaving && canRate && !uncertain) {
        const rating = RATING_KEYS[event.key];
        if (rating) void rate(rating);
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [enabled, flip, flipped, isPending, isSaving, rate, canRate, uncertain, nextPreview]);
}
