"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage, type HttpOutcome } from "./http";

/** Dữ liệu chỉ thuộc lần tải hiện tại; giữ bản xác nhận cũ khi tải lại thất bại. */
export function useApiResource<T>(load: (signal: AbortSignal) => Promise<HttpOutcome<T>>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await load(controller.signal);
        if (controller.signal.aborted) return;
        if (result.ok) setData(result.data);
        else setError(apiErrorMessage(result));
      } catch {
        if (!controller.signal.aborted) setError("Chưa tải được dữ liệu. Vui lòng thử lại.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    });
    return () => controller.abort();
  }, [load, attempt]);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  return { data, error, isLoading, reload };
}
