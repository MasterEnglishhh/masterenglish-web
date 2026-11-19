"use client";

import { useState } from "react";
import { searchPublishedSenses, type PublishedSense } from "../lib/content-lookup-client";

/** Tìm nghĩa trong các từ đã xuất bản để đưa vào bộ thẻ (danh sách đã chọn do `useCreateContent` giữ). */
export function useDeckSenseSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublishedSense[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    const res = await searchPublishedSenses(query);
    if (res.success) setResults(res.data);
    else setError(res.error.message);
    setIsSearching(false);
  }

  return { query, setQuery, results, isSearching, error, search };
}
