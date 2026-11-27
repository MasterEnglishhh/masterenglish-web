"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiErrorMessage } from "@/lib/http";
import { isUncertain, startAttempt } from "../lib/practice-client";
import type { StartAttemptInput } from "../types/practice";

export function useStartAttempt() {
  const router = useRouter();
  const mounted = useRef(false);
  const request = useRef<{ body: StartAttemptInput; key: string } | null>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [hasRetry, setHasRetry] = useState(false);
  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(() => {
      if (mounted.current && !busy.current && request.current) {
        setPending(false);
        setHasRetry(true);
      }
    });
    return () => {
      mounted.current = false;
    };
  }, []);
  async function start(body: StartAttemptInput) {
    if (busy.current) return;
    const current = request.current ?? { body, key: crypto.randomUUID() };
    request.current = current;
    busy.current = true;
    setPending(true);
    setFailure(null);
    try {
      const result = await startAttempt(current.body, current.key);
      if (!mounted.current) return;
      if (result.ok) {
        router.push(
          `/learn/${result.data.status === "SUBMITTED" ? "results" : "practice"}?attempt=${encodeURIComponent(result.data.id)}`
        );
      } else {
        const code = result.problem?.code;
        setFailure(
          code === "OPEN_ATTEMPT_LIMIT_REACHED"
            ? "Bạn đang có quá nhiều bài chưa nộp. Mở lịch sử để tiếp tục và nộp một bài trước."
            : code === "NO_ELIGIBLE_QUESTIONS"
              ? "Bộ đề chưa có câu hỏi phù hợp. Hãy chọn bộ đề khác."
              : code === "INSUFFICIENT_QUESTIONS"
                ? "Bộ đề hiện chưa đủ câu hỏi để bắt đầu."
                : apiErrorMessage(result)
        );
        if (!isUncertain(result)) request.current = null;
        setHasRetry(Boolean(request.current));
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return { start, pending, failure, hasRetry };
}
