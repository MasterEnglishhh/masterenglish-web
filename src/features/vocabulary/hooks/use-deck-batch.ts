"use client";

import { useEffect, useState } from "react";
import { fetchDeckCards, fetchDeckDetail } from "../lib/vocabulary-client";
import type { PageResponse, WordSenseCardDto } from "../types/vocabulary";

export interface DeckBatchData {
  title: string;
  cards: PageResponse<WordSenseCardDto>;
}

/** Tải tên bộ từ và một trang thẻ để học. Phản hồi của yêu cầu cũ bị bỏ qua. */
export function useDeckBatch(deckId: string, page: number) {
  const [data, setData] = useState<DeckBatchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchDeckDetail(deckId),
      fetchDeckCards(deckId, { page, size: 20 }),
    ]).then(([detail, cards]) => {
      if (!active) return;
      if (!detail.success) setError(detail.error.message);
      else if (!cards.success) setError(cards.error.message);
      else setData({ title: detail.data.title, cards: cards.data });
    });
    return () => {
      active = false;
    };
  }, [deckId, page]);
  return { data, error };
}
