import { isRecord, isUuid } from "../../../lib/api-validation.ts";
import type { ActiveAttempt, AttemptResult } from "../types/practice.ts";
export const text = (v: unknown) => typeof v === "string";
export const nullableText = (v: unknown) => v === null || text(v);
export const count = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
export const nullableCount = (v: unknown) => v === null || count(v);
export const nullableId = (v: unknown) => v === null || isUuid(v);
const date = (v: unknown) =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
export const nullableDate = (v: unknown) => v === null || date(v);
const oneOf = (v: unknown, values: string[]) =>
  typeof v === "string" && values.includes(v);
const category = (v: unknown) => oneOf(v, ["GRAMMAR", "VOCABULARY", "TOEIC"]);
const status = (v: unknown) =>
  oneOf(v, ["IN_PROGRESS", "SUBMITTED", "ABANDONED"]);
const sourceType = (v: unknown) =>
  oneOf(v, ["GRAMMAR_TOPIC", "MIXED_GRAMMAR", "PRACTICE_SET"]);
const refs = (v: unknown) =>
  Array.isArray(v) &&
  v.every((r) => isRecord(r) && text(r.materialKey) && nullableText(r.anchor));
const source = (v: unknown) =>
  isRecord(v) &&
  sourceType(v.type) &&
  nullableId(v.practiceSetId) &&
  Array.isArray(v.topicIds) &&
  v.topicIds.every(isUuid);
function inlines(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length <= 400 &&
    v.every(
      (n) =>
        isRecord(n) &&
        (n.type === "text"
          ? text(n.text) &&
            (n.marks === undefined ||
              (Array.isArray(n.marks) &&
                n.marks.every((m) =>
                  oneOf(m, ["BOLD", "ITALIC", "UNDERLINE"])
                )))
          : n.type === "blank"
            ? text(n.blank_key)
            : n.type === "insert"
              ? count(n.position) &&
                (n.position as number) >= 1 &&
                (n.position as number) <= 4
              : n.type === "line_break")
    )
  );
}
function materialBody(type: unknown, v: unknown): boolean {
  if (!isRecord(v)) return false;
  switch (type) {
    case "AUDIO":
      return (
        (v.duration_seconds === undefined || count(v.duration_seconds)) &&
        (v.directions_text === undefined || text(v.directions_text))
      );
    case "IMAGE":
      return text(v.alt_text) && (v.caption === undefined || text(v.caption));
    case "RICH_TEXT":
      return (
        text(v.document_kind) &&
        (v.header === undefined ||
          (isRecord(v.header) && Object.values(v.header).every(text))) &&
        Array.isArray(v.blocks) &&
        v.blocks.length <= 200 &&
        v.blocks.every(
          (b) =>
            isRecord(b) &&
            (b.type === "paragraph"
              ? inlines(b.inlines)
              : b.type === "heading"
                ? count(b.level) && inlines(b.inlines)
                : b.type === "list" &&
                  typeof b.ordered === "boolean" &&
                  Array.isArray(b.items) &&
                  b.items.every((i) => isRecord(i) && inlines(i.inlines)))
        )
      );
    case "TABLE":
      return (
        Array.isArray(v.headers) &&
        v.headers.every(text) &&
        Array.isArray(v.rows) &&
        v.rows.every((r) => Array.isArray(r) && r.every(text))
      );
    case "CHAT":
      return (
        text(v.channel) &&
        Array.isArray(v.messages) &&
        v.messages.every(
          (m) => isRecord(m) && [m.anchor, m.author, m.time, m.text].every(text)
        )
      );
    case "TRANSCRIPT":
      return (
        Array.isArray(v.segments) &&
        v.segments.every(
          (s) =>
            isRecord(s) &&
            (s.type === "speech"
              ? text(s.speaker) && text(s.text)
              : s.type === "pause" && count(s.seconds))
        )
      );
    default:
      return false;
  }
}
const materials = (v: unknown, attemptId: string, review: boolean) =>
  Array.isArray(v) &&
  v.length <= 100 &&
  v.every(
    (m) =>
      isRecord(m) &&
      text(m.materialKey) &&
      count(m.position) &&
      oneOf(
        m.materialType,
        review
          ? ["AUDIO", "IMAGE", "RICH_TEXT", "CHAT", "TABLE", "TRANSCRIPT"]
          : ["AUDIO", "IMAGE", "RICH_TEXT", "CHAT", "TABLE"]
      ) &&
      materialBody(m.materialType, m.body) &&
      (m.mediaUrl === null ||
        (typeof m.mediaUrl === "string" &&
          m.mediaUrl.startsWith(`/api/v1/attempts/${attemptId}/media/`) &&
          isUuid(
            m.mediaUrl.slice(`/api/v1/attempts/${attemptId}/media/`.length)
          )))
  );
const question = (v: unknown, id: string, review: boolean) =>
  isRecord(v) &&
  isUuid(v.snapshotId) &&
  count(v.ordinal) &&
  count(v.displayNumber) &&
  nullableId(v.groupSnapshotId) &&
  nullableCount(v.partNumber) &&
  oneOf(v.questionKind, [
    "STANDARD",
    "GRAPHIC",
    "INTENT",
    "SENTENCE_INSERTION",
    "INSERTION_POSITION",
    "NOT_EXCEPT",
  ]) &&
  oneOf(v.optionDisplay, ["TEXT", "LABEL_ONLY"]) &&
  nullableText(v.prompt) &&
  nullableText(v.blankKey) &&
  nullableText(v.insertSentence) &&
  refs(v.refs) &&
  materials(v.materials, id, review) &&
  Array.isArray(v.options) &&
  v.options.length > 0 &&
  v.options.length <= 10 &&
  v.options.every(
    (o) =>
      isRecord(o) &&
      isUuid(o.optionId) &&
      text(o.label) &&
      nullableText(o.body) &&
      (v.optionDisplay !== "LABEL_ONLY" || o.body === null)
  ) &&
  (review ||
    !["review", "answer", "correctOptionId", "explanation", "answerKey"].some(
      (key) => key in v
    ));
const group = (v: unknown, id: string, review: boolean) =>
  isRecord(v) &&
  isUuid(v.groupSnapshotId) &&
  count(v.ordinal) &&
  count(v.partNumber) &&
  text(v.groupType) &&
  nullableText(v.title) &&
  nullableCount(v.speakerCount) &&
  materials(v.materials, id, review) &&
  (review ? materials(v.reviewMaterials, id, true) : !("reviewMaterials" in v));
const common = (
  v: unknown
): v is Record<string, unknown> & {
  id: string;
  questions: Record<string, unknown>[];
  groups: Record<string, unknown>[];
} =>
  isRecord(v) &&
  isUuid(v.id) &&
  category(v.category) &&
  v.attemptMode === "PRACTICE" &&
  status(v.status) &&
  source(v.source) &&
  Array.isArray(v.questions) &&
  v.questions.length <= 1000 &&
  Array.isArray(v.groups);
export function isActiveAttempt(v: unknown): v is ActiveAttempt {
  return (
    common(v) &&
    count(v.totalCount) &&
    v.totalCount === v.questions.length &&
    date(v.startedAt) &&
    date(v.lastActiveAt) &&
    nullableDate(v.deadlineAt) &&
    v.groups.every((g) => group(g, v.id, false)) &&
    v.questions.every((q) => question(q, v.id, false)) &&
    isRecord(v.savedAnswers) &&
    v.questions.every((q) => {
      const a = (v.savedAnswers as Record<string, unknown>)[
        q.snapshotId as string
      ];
      return (
        isRecord(a) &&
        nullableId(a.selectedOptionId) &&
        count(a.version) &&
        (a.selectedOptionId === null ||
          (q.options as Record<string, unknown>[]).some(
            (o) => o.optionId === a.selectedOptionId
          ))
      );
    }) &&
    !("result" in v)
  );
}
export const summary = (v: unknown) =>
  isRecord(v) &&
  [
    v.totalCount,
    v.correctCount,
    v.wrongCount,
    v.unansweredCount,
    v.accuracyPercent,
    v.durationSeconds,
  ].every(count) &&
  nullableCount(v.listeningCorrect) &&
  nullableCount(v.readingCorrect) &&
  date(v.submittedAt) &&
  date(v.effectiveFinishedAt) &&
  oneOf(v.submitReason, ["MANUAL", "TIME_LIMIT"]) &&
  Array.isArray(v.partBreakdown) &&
  v.partBreakdown.every(
    (p) =>
      isRecord(p) &&
      [
        p.partNumber,
        p.totalCount,
        p.correctCount,
        p.wrongCount,
        p.unansweredCount,
      ].every(count)
  );
export function isAttemptResult(v: unknown): v is AttemptResult {
  return (
    common(v) &&
    v.status === "SUBMITTED" &&
    summary(v.result) &&
    v.groups.every((g) => group(g, v.id, true)) &&
    v.questions.every(
      (q) =>
        question(q, v.id, true) &&
        isRecord(q.answer) &&
        nullableId(q.answer.selectedOptionId) &&
        typeof q.answer.isCorrect === "boolean" &&
        isRecord(q.review) &&
        isUuid(q.review.correctOptionId) &&
        text(q.review.correctOptionLabel) &&
        nullableText(q.review.explanation) &&
        refs(q.review.evidence) &&
        Array.isArray(q.review.optionTranscripts) &&
        q.review.optionTranscripts.every(
          (t) =>
            isRecord(t) &&
            text(t.label) &&
            nullableText(t.speaker) &&
            text(t.text)
        ) &&
        (q.review.promptTranscript === null ||
          (isRecord(q.review.promptTranscript) &&
            nullableText(q.review.promptTranscript.speaker) &&
            text(q.review.promptTranscript.text)))
    )
  );
}
export const isSet = (v: unknown) =>
  isRecord(v) &&
  isUuid(v.id) &&
  category(v.category) &&
  text(v.title) &&
  nullableCount(v.partNumber) &&
  (v.difficulty === null || oneOf(v.difficulty, ["EASY", "MEDIUM", "HARD"])) &&
  oneOf(v.selectionMode, ["FIXED", "DYNAMIC"]) &&
  nullableCount(v.questionCount) &&
  count(v.groupCount) &&
  nullableCount(v.timeLimitSeconds);
export const isHistory = (v: unknown) =>
  isRecord(v) &&
  isUuid(v.id) &&
  category(v.category) &&
  sourceType(v.sourceType) &&
  nullableId(v.sourceSetId) &&
  Array.isArray(v.topicIds) &&
  v.topicIds.every(isUuid) &&
  status(v.status) &&
  count(v.totalCount) &&
  nullableCount(v.correctCount) &&
  nullableCount(v.score) &&
  date(v.startedAt) &&
  nullableDate(v.submittedAt);
