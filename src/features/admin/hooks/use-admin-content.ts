"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLatestRequestTracker } from "@/lib/latest-request";
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
    contentType: "ALL",
    status: "ALL",
    page: 1,
    pageSize: 10,
  });

  // Phản hồi của lần tải cũ không được ghi đè lần tải mới (gõ tìm kiếm nhanh, đổi trang).
  const requests = useRef(createLatestRequestTracker());

  const loadContent = useCallback(async () => {
    const ticket = requests.current.begin();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchContentItems(filters);
      if (!requests.current.isCurrent(ticket)) return;
      if (res.success) {
        setItems(res.data.items);
        setTotalCount(res.data.totalItems);
        setTotalPages(Math.max(1, res.data.totalPages));
        if (filters.page > Math.max(1, res.data.totalPages)) {
          setFilters({ ...filters, page: Math.max(1, res.data.totalPages) });
        }
      } else {
        setError(res.error.message);
      }
    } catch {
      if (!requests.current.isCurrent(ticket)) return;
      setError("Không thể tải danh sách nội dung.");
    }
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    const tracker = requests.current;
    const timer = setTimeout(() => {
      loadContent();
    }, 250);
    return () => {
      clearTimeout(timer);
      tracker.invalidate();
    };
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
