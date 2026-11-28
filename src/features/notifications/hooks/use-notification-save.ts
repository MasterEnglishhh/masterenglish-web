"use client";

import { useEffect, useRef, useState } from "react";
import { apiErrorMessage, type HttpOutcome } from "@/lib/http";

/** Hai form thông báo chỉ nhận bản lưu đã được máy chủ xác nhận. */
export function useNotificationSave<TInput, TData>(
  send: (input: TInput, signal: AbortSignal) => Promise<HttpOutcome<TData>>
) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const current = new AbortController();
    controller.current = current;
    return () => current.abort();
  }, []);
  const save = async (input: TInput): Promise<TData | null> => {
    const signal = controller.current?.signal;
    if (pending.current || !signal || signal.aborted) return null;
    pending.current = true;
    setIsSaving(true);
    setError(null);
    try {
      const result = await send(input, signal);
      if (signal.aborted) return null;
      if (!result.ok) {
        setError(apiErrorMessage(result));
        return null;
      }
      return result.data;
    } catch {
      if (!signal.aborted)
        setError("Chưa lưu được thay đổi. Vui lòng thử lại.");
      return null;
    } finally {
      pending.current = false;
      if (!signal.aborted) setIsSaving(false);
    }
  };
  return { isSaving, error, save };
}
