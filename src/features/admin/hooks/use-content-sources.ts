"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLatestRequestTracker } from "@/lib/latest-request";
import {
  createContentSource,
  fetchContentSources,
  type ContentSource,
  type CreateSourcePayload,
} from "../lib/content-lookup-client";

const sourceListeners = new Set<() => void>();

export function notifyContentSourcesChanged() {
  sourceListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Bỏ qua lỗi listener để không chặn luồng chính
    }
  });
}

export function subscribeContentSources(fn: () => void) {
  sourceListeners.add(fn);
  return () => {
    sourceListeners.delete(fn);
  };
}

export interface UseContentSourcesOptions {
  paginated?: boolean;
  pageSize?: number;
}

/** Danh sách nguồn trích dẫn và thao tác thêm nguồn mới; nội dung chỉ xuất bản được khi có nguồn. */
export function useContentSources(options?: UseContentSourcesOptions) {
  const isPaginated = options?.paginated ?? false;
  const pageSize = options?.pageSize ?? 10;

  const [sources, setSources] = useState<ContentSource[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requests = useRef(createLatestRequestTracker());

  const load = useCallback(async () => {
    const tracker = requests.current;
    const ticket = tracker.begin();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchContentSources(
        isPaginated
          ? { search: search.trim() || undefined, page, size: pageSize }
          : undefined
      );
      if (!tracker.isCurrent(ticket)) return;
      if (res.success) {
        setSources(res.data.items);
        setTotalCount(res.data.totalItems);
        setTotalPages(Math.max(1, res.data.totalPages));
      } else {
        setError(res.error.message);
      }
    } catch {
      if (!tracker.isCurrent(ticket)) return;
      setError("Không thể tải danh sách nguồn trích dẫn.");
    }
    setIsLoading(false);
  }, [isPaginated, search, page, pageSize]);

  useEffect(() => {
    const tracker = requests.current;
    if (isPaginated) {
      const timer = setTimeout(() => {
        void load();
      }, 250);
      return () => {
        clearTimeout(timer);
        tracker.invalidate();
      };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi hộp thoại mở
    void load();
    return () => {
      tracker.invalidate();
    };
  }, [load, isPaginated]);

  useEffect(() => {
    return subscribeContentSources(() => {
      void load();
    });
  }, [load]);

  /** Trả về nguồn vừa tạo, hoặc lý do lỗi. */
  async function addSource(payload: CreateSourcePayload) {
    const res = await createContentSource(payload);
    if (!res.success) return { source: null, error: res.error.message };
    notifyContentSourcesChanged();
    return { source: res.data, error: null };
  }

  return {
    sources,
    totalCount,
    totalPages,
    search,
    setSearch,
    page,
    setPage,
    isLoading,
    error,
    reload: load,
    addSource,
  };
}
