"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useApiResource } from "@/lib/use-api-resource";
import { useStartAttempt } from "@/features/practice";
import { fetchExercises } from "../lib/grammar-client";

export function useGrammarPractice(topicId: string) {
  const load = useCallback(
    (signal: AbortSignal) => fetchExercises(topicId, signal),
    [topicId]
  );
  const resource = useApiResource(load);
  const [count, setCount] = useState(10);
  const launch = useStartAttempt();
  async function start(event: FormEvent) {
    event.preventDefault();
    const available = resource.data?.availableQuestions ?? 0;
    if (!available || !Number.isInteger(count) || count < 1) return;
    await launch.start({
      source: { type: "GRAMMAR_TOPIC", topicId },
      questionCount: Math.min(count, available, 100),
      mode: "PRACTICE",
    });
  }
  return {
    ...resource,
    count,
    setCount,
    pending: launch.pending,
    failure: launch.failure,
    retrying: launch.hasRetry,
    start,
  };
}
