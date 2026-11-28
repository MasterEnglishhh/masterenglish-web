import {
  requestJson,
  type HttpOutcome,
  type PageResponse,
} from "../../../lib/http.ts";
import {
  isRecord,
  isUuid,
  isPageResponse,
} from "../../../lib/api-validation.ts";
import type {
  ActiveAttempt,
  AttemptHistory,
  AttemptResult,
  AttemptSubmit,
  PracticeSet,
  PracticeSetDetail,
  SaveAnswerInput,
  SaveAnswerResponse,
  StartAttemptInput,
} from "../types/practice.ts";

import {
  isActiveAttempt,
  isAttemptResult,
  text,
  nullableText,
  count,
  nullableCount,
  nullableId,
  nullableDate,
  summary,
  isSet,
  isHistory,
} from "./practice-validation.ts";
export { isActiveAttempt, isAttemptResult } from "./practice-validation.ts";
function invalid<T>(): Promise<HttpOutcome<T>> {
  return Promise.resolve({
    ok: false,
    reason: "http",
    status: 400,
    problem: {
      code: "VALIDATION_ERROR",
      detail: "Tham số bài luyện không hợp lệ.",
    },
    retryAfterSeconds: null,
  });
}
export function isUncertain(outcome: HttpOutcome<unknown>) {
  return (
    !outcome.ok &&
    (outcome.status === 0 ||
      outcome.status >= 500 ||
      (outcome.status >= 200 && outcome.status < 300))
  );
}
export function startAttempt(body: StartAttemptInput, key: string) {
  const s = body.source;
  const valid =
    isUuid(key) &&
    (body.mode === undefined || body.mode === "PRACTICE") &&
    (s.type === "PRACTICE_SET"
      ? isUuid(s.practiceSetId) && body.questionCount === undefined
      : count(body.questionCount) &&
        body.questionCount! >= 1 &&
        body.questionCount! <= 100 &&
        (s.type === "GRAMMAR_TOPIC"
          ? isUuid(s.topicId)
          : Array.isArray(s.topicIds) &&
            s.topicIds.length >= 2 &&
            s.topicIds.length <= 10 &&
            s.topicIds.every(isUuid) &&
            new Set(s.topicIds).size === s.topicIds.length));
  return valid
    ? requestJson<ActiveAttempt>("/api/v1/attempts", {
        method: "POST",
        body,
        headers: { "Idempotency-Key": key },
        validate: isActiveAttempt,
      })
    : invalid<ActiveAttempt>();
}
export function fetchAttempt(id: string, signal?: AbortSignal) {
  return isUuid(id)
    ? requestJson<ActiveAttempt>(`/api/v1/attempts/${id}`, {
        signal,
        validate: isActiveAttempt,
      })
    : invalid<ActiveAttempt>();
}
export function saveAnswer(
  id: string,
  snapshotId: string,
  body: SaveAnswerInput,
  key: string
) {
  return isUuid(id) &&
    isUuid(snapshotId) &&
    isUuid(key) &&
    nullableId(body.selectedOptionId) &&
    count(body.expectedVersion)
    ? requestJson<SaveAnswerResponse>(
        `/api/v1/attempts/${id}/answers/${snapshotId}`,
        {
          method: "PUT",
          body,
          headers: { "Idempotency-Key": key },
          validate: (v) =>
            isRecord(v) &&
            v.snapshotId === snapshotId &&
            v.selectedOptionId === body.selectedOptionId &&
            v.version === body.expectedVersion + 1 &&
            nullableDate(v.answeredAt),
        }
      )
    : invalid<SaveAnswerResponse>();
}
export function submitAttempt(id: string) {
  return isUuid(id)
    ? requestJson<AttemptSubmit>(`/api/v1/attempts/${id}/submit`, {
        method: "POST",
        validate: (v) =>
          isRecord(v) &&
          v.attemptId === id &&
          v.status === "SUBMITTED" &&
          summary(v.result) &&
          v.resultsUrl === `/api/v1/attempts/${id}/results`,
      })
    : invalid<AttemptSubmit>();
}
export function fetchResults(id: string, signal?: AbortSignal) {
  return isUuid(id)
    ? requestJson<AttemptResult>(`/api/v1/attempts/${id}/results`, {
        signal,
        validate: isAttemptResult,
      })
    : invalid<AttemptResult>();
}
export interface CatalogQuery {
  q?: string;
  partNumber?: string;
  difficulty?: string;
  page?: number;
}
export function fetchPracticeSets(query: CatalogQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({
    category: "TOEIC",
    page: String(query.page ?? 0),
    size: "12",
  });
  for (const field of ["q", "partNumber", "difficulty"] as const)
    if (query[field]) params.set(field, query[field]!.trim());
  return requestJson<PageResponse<PracticeSet>>(
    `/api/v1/practice-sets?${params}`,
    { signal, validate: (v) => isPageResponse(v, isSet) }
  );
}
export function fetchPracticeSet(id: string, signal?: AbortSignal) {
  return isUuid(id)
    ? requestJson<PracticeSetDetail>(`/api/v1/practice-sets/${id}`, {
        signal,
        validate: (v) =>
          isSet(v) &&
          isRecord(v) &&
          nullableText(v.description) &&
          Array.isArray(v.partBreakdown) &&
          v.partBreakdown.every(
            (p) =>
              isRecord(p) &&
              count(p.partNumber) &&
              text(p.section) &&
              text(p.title) &&
              text(p.description) &&
              nullableCount(p.questionCount) &&
              nullableCount(p.groupCount)
          ),
      })
    : invalid<PracticeSetDetail>();
}
export function fetchHistory(
  query: { category?: string; status?: string; page: number },
  signal?: AbortSignal
) {
  const params = new URLSearchParams({ page: String(query.page), size: "12" });
  if (query.category) params.set("category", query.category);
  if (query.status) params.set("status", query.status);
  return requestJson<PageResponse<AttemptHistory>>(
    `/api/v1/attempts?${params}`,
    { signal, validate: (v) => isPageResponse(v, isHistory) }
  );
}
export function fetchTopicStatistics(signal?: AbortSignal) {
  return requestJson<
    {
      topicId: string;
      attemptCount: number;
      questionCount: number;
      correctCount: number;
      accuracyPercent: number | null;
      view: "allocation";
    }[]
  >("/api/v1/attempts/statistics/topics?category=GRAMMAR&view=allocation", {
    signal,
    validate: (v) =>
      Array.isArray(v) &&
      v.every(
        (s) =>
          isRecord(s) &&
          isUuid(s.topicId) &&
          [s.attemptCount, s.questionCount, s.correctCount].every(count) &&
          nullableCount(s.accuracyPercent) &&
          s.view === "allocation"
      ),
  });
}
