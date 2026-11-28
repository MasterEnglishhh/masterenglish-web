"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage, type HttpOutcome } from "@/lib/http";
import { useApiResource } from "@/lib/use-api-resource";
import {
  fetchLesson,
  fetchLessonProgress,
  updateLessonProgress,
  type GrammarLesson,
  type LessonProgress,
} from "../lib/grammar-client";

interface LessonData {
  lesson: GrammarLesson;
  progress: LessonProgress | null;
  warning: string | null;
}
export function useGrammarLesson(id: string) {
  const load = useCallback(
    async (signal: AbortSignal): Promise<HttpOutcome<LessonData>> => {
      const [lesson, progress] = await Promise.all([
        fetchLesson(id, signal),
        fetchLessonProgress(signal),
      ]);
      if (!lesson.ok) return lesson;
      const current = progress.ok
        ? (progress.data.find((item) => item.lessonId === id) ?? null)
        : null;
      const warning = progress.ok ? null : apiErrorMessage(progress);
      return {
        ok: true,
        status: 200,
        data: { lesson: lesson.data, progress: current, warning },
      };
    },
    [id]
  );
  const resource = useApiResource(load);
  const { reload } = resource;
  const [saveError, setSaveError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const busy = useRef(false);
  const begun = useRef<string | null>(null);
  const begin = useCallback(
    async (signal?: AbortSignal) => {
      if (busy.current) return;
      busy.current = true;
      setIsSaving(true);
      setStartError(null);
      try {
        const result = await updateLessonProgress(id, "IN_PROGRESS", signal);
        if (signal?.aborted) return;
        if (result.ok) reload();
        else setStartError(apiErrorMessage(result));
      } finally {
        busy.current = false;
        if (!signal?.aborted) setIsSaving(false);
      }
    },
    [id, reload]
  );
  useEffect(() => {
    const data = resource.data;
    if (
      !data ||
      data.lesson.id !== id ||
      data.warning ||
      data.progress ||
      begun.current === id
    )
      return;
    const controller = new AbortController();
    begun.current = id;
    void begin(controller.signal);
    return () => {
      controller.abort();
    };
  }, [id, resource.data, begin]);
  async function complete() {
    if (busy.current) return;
    busy.current = true;
    setIsSaving(true);
    setSaveError(null);
    const result = await updateLessonProgress(id, "COMPLETED");
    busy.current = false;
    setIsSaving(false);
    if (result.ok) resource.reload();
    else setSaveError(apiErrorMessage(result));
  }
  return { ...resource, begin, complete, isSaving, saveError, startError };
}
