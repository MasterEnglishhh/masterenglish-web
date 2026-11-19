"use client";

import { useEffect, useState } from "react";
import { fetchDeckDetail, fetchDeckWords } from "../lib/vocabulary-client";
import type { DeckDetailDto, WordSenseCardDto } from "../types/vocabulary";

export interface DeckDetailData {
  deck: DeckDetailDto;
  previewCards: WordSenseCardDto[];
  totalCards: number;
}

/**
 * Tải thông tin chi tiết bộ từ (DeckDetailDto) và các thẻ xem trước đầu tiên.
 * Khi yêu cầu cũ đổi hoặc unmount, phản hồi cũ bị bỏ qua để tránh race condition.
 */
export function useDeckDetail(deckId: string) {
  const [data, setData] = useState<DeckDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = () => {
    setData(null);
    setError(null);
    setAttempt((prev) => prev + 1);
  };

  useEffect(() => {
    let active = true;

    void Promise.all([
      fetchDeckDetail(deckId),
      fetchDeckWords(deckId, { page: 0, size: 5 }),
    ])
      .then(([detailRes, wordsRes]) => {
        if (!active) return;

        if (!detailRes.success) {
          setError(detailRes.error.message);
          return;
        }

        const previewCards = wordsRes.success ? wordsRes.data.items : [];
        setData({
          deck: detailRes.data,
          previewCards,
          totalCards: detailRes.data.cardCount,
        });
      })
      .catch(() => {
        if (!active) return;
        setError("Không thể tải thông tin chi tiết bộ từ.");
      });

    return () => {
      active = false;
    };
  }, [deckId, attempt]);

  const isLoading = !data && !error;

  return { data, error, isLoading, reload };
}
