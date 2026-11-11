"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchContentItems } from "../lib/admin-client";
import type { ContentFilterState, ContentItem } from "../types/content-ops";

export function useAdminContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ContentFilterState>({
    search: "",
    module: "ALL",
    status: "ALL",
    page: 1,
    pageSize: 10,
  });

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchContentItems(filters);
      if (res.success) {
        setItems(res.data.items);
        setTotalCount(res.data.totalItems);
        setTotalPages(Math.max(1, res.data.totalPages));
      } else {
        setError(res.error.message);
      }
    } catch {
      setError("Không thể tải danh sách nội dung.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContent();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadContent]);

  return {
    items,
    totalCount,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    refreshContent: loadContent,
  };
}
