"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { apiErrorMessage } from "@/lib/http";
import { useStudySession } from "@/features/learning";
import { AnswerQueue } from "../lib/answer-queue";
import {
  fetchAttempt,
  isUncertain,
  saveAnswer,
  submitAttempt,
} from "../lib/practice-client";
import type { ActiveAttempt, AttemptStatus } from "../types/practice";

export function useAttemptSession(attempt: ActiveAttempt) {
  const router = useRouter();
  const mounted = useRef(false);
  const generation = useRef(0);
  const previousAttempt = useRef(attempt);
  const [closedStatus, setClosedStatus] = useState<AttemptStatus>(
    attempt.status
  );
  const [queue] = useState(
    () =>
      new AnswerQueue(
        attempt.savedAnswers,
        (snapshotId, body, key) =>
          saveAnswer(attempt.id, snapshotId, body, key),
        async () => {
          const result = await fetchAttempt(attempt.id);
          return result.ok ? result.data : null;
        },
        (status) => {
          setClosedStatus(status);
          if (status === "SUBMITTED")
            router.replace(`/learn/results?attempt=${attempt.id}`);
        }
      )
  );
  const saves = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot
  );
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitUncertain, setSubmitUncertain] = useState(false);
  const uncertain = useRef(false);
  const busy = useRef(false);
  const deadline = attempt.deadlineAt ? Date.parse(attempt.deadlineAt) : null;
  const remaining =
    deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
  const expired = remaining === 0;
  const study = useStudySession(
    "PRACTICE",
    attempt.id,
    closedStatus === "IN_PROGRESS" && !expired
  );
  const checkDeadline = useCallback(async () => {
    const currentGeneration = generation.current;
    const result = await fetchAttempt(attempt.id);
    if (!mounted.current || currentGeneration !== generation.current) return;
    if (result.ok && result.data.status !== "IN_PROGRESS") {
      queue.stop();
      setClosedStatus(result.data.status);
      if (result.data.status === "SUBMITTED")
        router.replace(`/learn/results?attempt=${attempt.id}`);
    } else if (!result.ok) setSubmitError(apiErrorMessage(result));
  }, [attempt.id, queue, router]);
  useEffect(() => {
    const effectGeneration = generation.current;
    mounted.current = true;
    queue.activate();
    void Promise.resolve().then(() => {
      if (mounted.current && uncertain.current) {
        setSubmitting(false);
        setSubmitUncertain(true);
        setSubmitError(
          "Chưa xác nhận được lần nộp trước. Hãy thử nộp lại để nhận kết quả."
        );
      }
    });
    return () => {
      generation.current = effectGeneration + 1;
      if (busy.current) uncertain.current = true;
      mounted.current = false;
      queue.stop();
    };
  }, [queue]);
  useEffect(() => {
    if (previousAttempt.current !== attempt) {
      previousAttempt.current = attempt;
      queue.acceptFresh(attempt);
    }
  }, [attempt, queue]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!expired || closedStatus !== "IN_PROGRESS") return;
    void Promise.resolve().then(checkDeadline);
    const timer = setInterval(() => {
      void checkDeadline();
    }, 5000);
    return () => clearInterval(timer);
  }, [expired, closedStatus, checkDeadline]);
  useEffect(() => {
    if (closedStatus === "SUBMITTED")
      router.replace(`/learn/results?attempt=${attempt.id}`);
  }, [attempt.id, closedStatus, router]);
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    if (!saves.settled || submitting)
      window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [saves.settled, submitting]);
  async function submit() {
    if (
      busy.current ||
      !queue.getSnapshot().settled ||
      closedStatus !== "IN_PROGRESS"
    )
      return;
    busy.current = true;
    const currentGeneration = generation.current;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAttempt(attempt.id);
      if (!mounted.current || currentGeneration !== generation.current) return;
      if (result.ok) {
        queue.stop();
        setClosedStatus("SUBMITTED");
        router.replace(`/learn/results?attempt=${attempt.id}`);
      } else {
        uncertain.current = isUncertain(result);
        setSubmitUncertain(uncertain.current);
        setSubmitError(apiErrorMessage(result));
        if (result.status === 409) await checkDeadline();
      }
    } finally {
      busy.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }
  function select(id: string, value: string | null) {
    if (
      !busy.current &&
      !uncertain.current &&
      closedStatus === "IN_PROGRESS" &&
      !expired
    )
      queue.choose(id, value);
  }
  return {
    saves,
    select,
    retrySave: queue.retry,
    remaining,
    expired,
    closedStatus,
    submitting,
    submit,
    submitError,
    submitUncertain,
    studyWarning: study.warning,
  };
}
