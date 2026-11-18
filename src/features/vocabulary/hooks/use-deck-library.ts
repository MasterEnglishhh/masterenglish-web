"use client";

import { useEffect, useState } from "react";
import { fetchDecks, fetchDueQueue } from "../lib/vocabulary-client";
import type { DeckDto, PageResponse } from "../types/vocabulary";

export type DeckFilter = { q: string; level: string };

export interface DeckLibraryData {
  decks: PageResponse<DeckDto>;
  /** Số thẻ đến hạn; 0 nếu không tải được (kèm `warning`). */
  due: number;
  warning?: string;
}

/** Tải một trang bộ từ cùng số thẻ đến hạn. Phản hồi của yêu cầu cũ bị bỏ qua. */
export function useDeckLibrary(filter: DeckFilter, page: number) {
  const [data, setData] = useState<DeckLibraryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchDecks({ ...filter, page, size: 20 }),
      fetchDueQueue({ limit: 1 }),
    ]).then(([decks, due]) => {
      if (!active) return;
      if (!decks.success) setError(decks.error.message);
      else
        setData({
          decks: decks.data,
          due: due.success ? due.data.totalDue : 0,
          warning: due.success ? undefined : due.error.message,
        });
    });
    return () => {
      active = false;
    };
  }, [filter, page]);
  return { data, error };
}
