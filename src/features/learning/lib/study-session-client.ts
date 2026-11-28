import { requestJson } from "../../../lib/http.ts";
import { isRecord, isUuid } from "../../../lib/api-validation.ts";

export interface StudySession { sessionId: string; creditToken: string; version: number; todayActiveMinutes: number; closedAt: string | null; rolledOver: boolean }
export type StudySource = "LESSON" | "PRACTICE";
const valid = (v: unknown) => isRecord(v) && isUuid(v.sessionId) && isUuid(v.creditToken) && typeof v.version === "number" && Number.isSafeInteger(v.version) && v.version >= 0 && typeof v.todayActiveMinutes === "number" && (v.closedAt === null || typeof v.closedAt === "string") && typeof v.rolledOver === "boolean";
export function startStudySession(sourceType: StudySource, id: string) {
  return requestJson<StudySession>("/api/v1/study-sessions", { method: "POST", body: { sourceType, [sourceType === "LESSON" ? "lessonId" : "attemptId"]: id, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, validate: valid });
}
export function heartbeatStudySession(id: string, body: { creditToken: string; version: number; active: boolean }) {
  return requestJson<StudySession>(`/api/v1/study-sessions/${encodeURIComponent(id)}/heartbeat`, { method: "POST", body, validate: valid });
}
export function closeStudySession(id: string, creditToken: string) {
  return requestJson<StudySession>(`/api/v1/study-sessions/${encodeURIComponent(id)}/close`, { method: "POST", body: { creditToken }, validate: valid });
}
