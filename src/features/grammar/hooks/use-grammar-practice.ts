"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useApiResource } from "@/lib/use-api-resource";
import { apiErrorMessage } from "@/lib/http";
import { startAttempt } from "@/features/practice";
import { fetchExercises } from "../lib/grammar-client";

export function useGrammarPractice(topicId: string) {
  const router = useRouter();
  const load = useCallback(
    (signal: AbortSignal) => fetchExercises(topicId, signal),
    [topicId]
  );
  const resource = useApiResource(load);
  const [count, setCount] = useState(10);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [request, setRequest] = useState<{ key: string; count: number } | null>(
    null
  );
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function start(event: FormEvent) {
    event.preventDefault();
    const available = resource.data?.availableQuestions ?? 0;
    if (!available || busy.current || !Number.isInteger(count) || count < 1)
      return;
    busy.current = true;
    setPending(true);
    setFailure(null);
    const current = request ?? {
      key: crypto.randomUUID(),
      count: Math.min(count, available, 100),
    };
    setRequest(current);
    try {
      const result = await startAttempt(
        {
          source: { type: "GRAMMAR_TOPIC", topicId },
          questionCount: current.count,
          mode: "PRACTICE",
        },
        current.key
      );
      if (!mounted.current) return;
      if (result.ok) {
        const path =
          result.data.status === "SUBMITTED"
            ? "/learn/results?view=grammar&attempt="
            : "/learn/practice?attempt=";
        router.push(path + encodeURIComponent(result.data.id));
      } else {
        setFailure(apiErrorMessage(result));
        // Một phản hồi 2xx không đọc được vẫn có thể đã tạo lượt thành công.
        if (result.status >= 400 && result.status < 500) setRequest(null);
      }
    } catch {
      if (mounted.current)
        setFailure("Chưa xác nhận được lượt luyện. Hãy thử lại yêu cầu này.");
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return {
    ...resource,
    count,
    setCount,
    pending,
    failure,
    retrying: request !== null,
    start,
  };
}
