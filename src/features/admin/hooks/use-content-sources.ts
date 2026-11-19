"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createContentSource,
  fetchContentSources,
  type ContentSource,
  type CreateSourcePayload,
} from "../lib/content-lookup-client";

/** Danh sách nguồn trích dẫn và thao tác thêm nguồn mới; nội dung chỉ xuất bản được khi có nguồn. */
export function useContentSources() {
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await fetchContentSources();
    if (res.success) setSources(res.data.items);
    else setError(res.error.message);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi hộp thoại mở
    void load();
  }, [load]);

  /** Trả về nguồn vừa tạo, hoặc lý do lỗi. */
  async function addSource(payload: CreateSourcePayload) {
    const res = await createContentSource(payload);
    if (!res.success) return { source: null, error: res.error.message };
    setSources((previous) => [res.data, ...previous]);
    return { source: res.data, error: null };
  }

  return { sources, isLoading, error, reload: load, addSource };
}
