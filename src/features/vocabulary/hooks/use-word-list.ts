"use client";

import { useEffect, useState } from "react";
import { fetchSavedWords, fetchWords } from "../lib/vocabulary-client";
import type { SavedWordDto, WordListDto } from "../types/vocabulary";

export type WordFilter = { q: string; cefrLevel: string; partOfSpeech: string };
export type WordListMode = "words" | "saved";

export interface WordListData {
  words: WordListDto[];
  saved: SavedWordDto[];
  totalItems: number;
  hasNext: boolean;
  totalPages: number;
}

interface Options {
  mode: WordListMode;
  /** Số trang bắt đầu từ 0. */
  page: number;
  filter: WordFilter;
  /** Gọi khi trang yêu cầu đã vượt quá trang cuối (xoá bớt từ đã lưu, đổi bộ lọc...). */
  changePage: (page: number) => void;
}

/**
 * Tải một trang từ vựng (tra từ hoặc sổ tay). Phản hồi của yêu cầu cũ bị bỏ qua, và nếu
 * trang yêu cầu đã trống vì vượt quá trang cuối thì lùi về trang cuối còn dữ liệu.
 */
export function useWordList({ mode, page, filter, changePage }: Options) {
  const { q, cefrLevel, partOfSpeech } = filter;
  const [data, setData] = useState<WordListData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      const result =
        mode === "words"
          ? await fetchWords({ q, cefrLevel, partOfSpeech, page, size: 12 })
          : await fetchSavedWords({ cefrLevel, page, size: 12 });
      if (!active) return;
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      if (
        page > 0 &&
        result.data.items.length === 0 &&
        page >= result.data.totalPages
      ) {
        changePage(Math.max(0, result.data.totalPages - 1));
        return;
      }
      setData({
        ...result.data,
        words: mode === "words" ? (result.data.items as WordListDto[]) : [],
        saved: mode === "saved" ? (result.data.items as SavedWordDto[]) : [],
      });
    }
    void load();
    return () => {
      active = false;
    };
  }, [mode, page, q, cefrLevel, partOfSpeech, changePage]);
  return { data, error };
}
