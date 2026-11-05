"use client";

import { useMemo, useState } from "react";
import { mockAdminContent } from "../data/mock-admin-content";
import type { ContentFilterState, ContentItem, ContentRevisionStatus } from "../types/content-ops";

export function useAdminContent() {
  const [items, setItems] = useState<ContentItem[]>(mockAdminContent);
  const [filters, setFilters] = useState<ContentFilterState>({
    search: "",
    module: "ALL",
    status: "ALL",
    page: 1,
    pageSize: 10,
  });

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        filters.search === "" ||
        item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.code.toLowerCase().includes(filters.search.toLowerCase());

      const matchModule =
        filters.module === "ALL" || item.module === filters.module;

      const matchStatus =
        filters.status === "ALL" || item.status === filters.status;

      return matchSearch && matchModule && matchStatus;
    });
  }, [items, filters]);

  const changeRevisionStatus = (itemId: string, newStatus: ContentRevisionStatus) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          status: newStatus,
          versionNo: newStatus === "PUBLISHED" ? it.versionNo + 1 : it.versionNo,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteContentItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  return {
    items: filteredItems,
    totalCount: filteredItems.length,
    filters,
    setFilters,
    changeRevisionStatus,
    deleteContentItem,
  };
}
