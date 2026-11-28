import { requestJson, type HttpOutcome } from "../../../lib/http.ts";
import {
  isRecord,
  isUuid,
  isPageResponse,
} from "../../../lib/api-validation.ts";
import type { PageResponse } from "../../../lib/http.ts";

export interface GrammarTopic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  difficulty: string | null;
  sortOrder: number;
}
export interface LessonSummary {
  id: string;
  title: string;
  sortOrder: number;
  estimatedMinutes: number | null;
}
export type LessonBlock =
  | { type: "heading" | "paragraph" | "note"; text: string }
  | { type: "example"; example_en: string; example_vi?: string | null }
  | { type: "table"; rows: string[][] };
export interface GrammarLesson {
  id: string;
  topicId: string;
  title: string;
  estimatedMinutes: number | null;
  body: { blocks: LessonBlock[] };
}
export interface LessonProgress {
  lessonId: string;
  state: "IN_PROGRESS" | "COMPLETED";
  completedAt: string | null;
  lastCompletedRevisionId: string | null;
}
const nullableString = (v: unknown) => v === null || typeof v === "string";
const nullableNumber = (v: unknown) =>
  v === null || (typeof v === "number" && Number.isFinite(v));
const isTopic = (v: unknown) =>
  isRecord(v) &&
  typeof v.id === "string" &&
  typeof v.slug === "string" &&
  typeof v.name === "string" &&
  nullableString(v.description) &&
  nullableString(v.difficulty) &&
  typeof v.sortOrder === "number";
const isSummary = (v: unknown) =>
  isRecord(v) &&
  typeof v.id === "string" &&
  typeof v.title === "string" &&
  nullableNumber(v.estimatedMinutes) &&
  typeof v.sortOrder === "number";
const isProgress = (v: unknown) =>
  isRecord(v) &&
  typeof v.lessonId === "string" &&
  (v.state === "IN_PROGRESS" || v.state === "COMPLETED") &&
  nullableString(v.completedAt) &&
  nullableString(v.lastCompletedRevisionId);

function isBlock(v: unknown): boolean {
  if (!isRecord(v)) return false;
  if (v.type === "heading" || v.type === "paragraph" || v.type === "note")
    return typeof v.text === "string";
  if (v.type === "example")
    return (
      typeof v.example_en === "string" &&
      (v.example_vi === undefined || nullableString(v.example_vi))
    );
  return (
    v.type === "table" &&
    Array.isArray(v.rows) &&
    v.rows.length <= 100 &&
    v.rows.every(
      (row) =>
        Array.isArray(row) &&
        row.length <= 20 &&
        row.every((cell) => typeof cell === "string")
    )
  );
}
export function isLesson(v: unknown): v is GrammarLesson {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.topicId === "string" &&
    typeof v.title === "string" &&
    nullableNumber(v.estimatedMinutes) &&
    isRecord(v.body) &&
    Array.isArray(v.body.blocks) &&
    v.body.blocks.length <= 100 &&
    v.body.blocks.every(isBlock)
  );
}
function badId<T>(): Promise<HttpOutcome<T>> {
  return Promise.resolve({
    ok: false,
    reason: "http",
    status: 400,
    problem: { detail: "Mã nội dung trong đường dẫn không hợp lệ." },
    retryAfterSeconds: null,
  });
}
export function fetchTopics(page = 0, signal?: AbortSignal) {
  return requestJson<PageResponse<GrammarTopic>>(
    `/api/v1/grammar/topics?page=${page}&size=12`,
    { signal, validate: (v) => isPageResponse(v, isTopic) }
  );
}
export function fetchLessons(topicId: string, signal?: AbortSignal) {
  return isUuid(topicId)
    ? requestJson<LessonSummary[]>(
        `/api/v1/grammar/topics/${encodeURIComponent(topicId)}/lessons`,
        { signal, validate: (v) => Array.isArray(v) && v.every(isSummary) }
      )
    : badId<LessonSummary[]>();
}
export function fetchLesson(lessonId: string, signal?: AbortSignal) {
  return isUuid(lessonId)
    ? requestJson<GrammarLesson>(
        `/api/v1/grammar/lessons/${encodeURIComponent(lessonId)}`,
        { signal, validate: isLesson }
      )
    : badId<GrammarLesson>();
}
export function fetchLessonProgress(signal?: AbortSignal) {
  return requestJson<LessonProgress[]>("/api/v1/grammar/progress", {
    signal,
    validate: (v) => Array.isArray(v) && v.every(isProgress),
  });
}
export function updateLessonProgress(
  lessonId: string,
  state: LessonProgress["state"],
  signal?: AbortSignal
) {
  return isUuid(lessonId)
    ? requestJson<LessonProgress>(
        `/api/v1/grammar/lessons/${encodeURIComponent(lessonId)}/progress`,
        { method: "PUT", body: { state }, signal, validate: isProgress }
      )
    : badId<LessonProgress>();
}
export function fetchExercises(topicId: string, signal?: AbortSignal) {
  return isUuid(topicId)
    ? requestJson<{ topicId: string; availableQuestions: number }>(
        `/api/v1/grammar/topics/${encodeURIComponent(topicId)}/exercises`,
        {
          signal,
          validate: (v) =>
            isRecord(v) &&
            typeof v.topicId === "string" &&
            typeof v.availableQuestions === "number" &&
            v.availableQuestions >= 0,
        }
      )
    : badId<{ topicId: string; availableQuestions: number }>();
}
