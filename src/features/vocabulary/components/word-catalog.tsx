"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { vocabularyPageNumber } from "../lib/vocabulary-presentation";
import type { WordFilter, WordListMode } from "../hooks/use-word-list";
import { WordDetail } from "./word-detail";
import { WordFilterBar } from "./word-filter-bar";
import { WordPage } from "./word-page";

/** Tra từ / sổ tay: giữ bộ lọc và trang trên URL, hiện chi tiết khi có `?word=`. */
export function WordCatalog({ mode }: { mode: WordListMode }) {
  const router = useRouter();
  const search = useSearchParams();
  const query = search.toString();
  const filter: WordFilter = {
    q: search.get("q") || "",
    cefrLevel: search.get("level") || "",
    partOfSpeech: search.get("pos") || "",
  };
  const [attempt, setAttempt] = useState(0);
  const wordId = search.get("word");
  const page = vocabularyPageNumber(search.get("page"));
  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(query);
      next.set("view", mode);
      Object.entries(updates).forEach(([key, value]) =>
        value ? next.set(key, value) : next.delete(key)
      );
      router.push("/learn/vocabulary?" + next.toString(), { scroll: false });
    },
    [query, mode, router]
  );
  const changePage = useCallback(
    (value: number) => navigate({ page: value ? String(value) : null }),
    [navigate]
  );
  const reload = () => setAttempt((value) => value + 1);
  if (wordId)
    return (
      <WordDetail
        key={wordId + ":" + attempt}
        wordId={wordId}
        back={() => navigate({ word: null })}
        retry={reload}
      />
    );
  return (
    <>
      <WordFilterBar mode={mode} filter={filter} onSearch={navigate} />
      <WordPage
        key={[
          mode,
          page,
          filter.q,
          filter.cefrLevel,
          filter.partOfSpeech,
          attempt,
        ].join(":")}
        mode={mode}
        page={page}
        filter={filter}
        changePage={changePage}
        open={(id) => navigate({ word: id })}
        reload={reload}
      />
    </>
  );
}
