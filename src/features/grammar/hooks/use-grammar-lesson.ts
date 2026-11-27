"use client";

import { useCallback, useRef, useState } from "react";
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
      let current = progress.ok
        ? (progress.data.find((item) => item.lessonId === id) ?? null)
        : null;
      let warning = progress.ok ? null : apiErrorMessage(progress);
      if (progress.ok && current?.state !== "COMPLETED" && !signal.aborted) {
        const updated = await updateLessonProgress(id, "IN_PROGRESS", signal);
        if (updated.ok) current = updated.data;
        else warning = apiErrorMessage(updated);
      }
      return {
        ok: true,
        status: 200,
        data: { lesson: lesson.data, progress: current, warning },
      };
    },
    [id]
  );
  const resource = useApiResource(load);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const busy = useRef(false);
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
  return { ...resource, complete, isSaving, saveError };
}
