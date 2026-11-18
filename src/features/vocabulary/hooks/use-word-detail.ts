"use client";

import { useEffect, useState } from "react";
import { fetchSavedSenseIds, fetchWordDetail } from "../lib/vocabulary-client";
import type { WordDetailDto } from "../types/vocabulary";

/**
 * Tải chi tiết một từ cùng danh sách nghĩa đã lưu. Lỗi tải chi tiết là `error`; chỉ riêng
 * trạng thái "đã lưu" lỗi thì vẫn hiện từ và báo `warning`.
 */
export function useWordDetail(wordId: string) {
  const [data, setData] = useState<WordDetailDto | null>(null);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchWordDetail(wordId),
      fetchSavedSenseIds(wordId),
    ]).then(([detail, membership]) => {
      if (!active) return;
      if (!detail.success) {
        setError(detail.error.message);
        return;
      }
      setData(detail.data);
      if (membership.success) setSaved(membership.data);
      else setWarning("Chưa tải được trạng thái từ đã lưu. Vui lòng thử lại.");
    });
    return () => {
      active = false;
    };
  }, [wordId]);
  return { data, saved, error, warning };
}
