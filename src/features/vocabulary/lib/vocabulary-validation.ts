import { isRecord, isPageResponse } from "../../../lib/api-validation.ts";

const text = (v: unknown) => typeof v === "string";
const nullableText = (v: unknown) => v === null || text(v);
const numeric = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v as string));
const rating = (v: unknown) => v === "AGAIN" || v === "HARD" || v === "GOOD";
const example = (v: unknown) => isRecord(v) && text(v.exampleEn) && nullableText(v.exampleVi);
const sense = (v: unknown) => isRecord(v) && text(v.id) && text(v.partOfSpeech) && text(v.cefrLevel) && text(v.meaningVi);
const word = (v: unknown) => isRecord(v) && text(v.id) && text(v.lemma) && nullableText(v.ipa) && nullableText(v.audioUrl) && Array.isArray(v.senses) && v.senses.every(sense);
const detail = (v: unknown) => word(v) && isRecord(v) && (v.senses as unknown[]).every(s => isRecord(s) && Array.isArray(s.examples) && s.examples.every(example));
const deck = (v: unknown) => isRecord(v) && text(v.id) && text(v.title) && nullableText(v.description) && nullableText(v.level) && numeric(v.cardCount);
const progress = (v: unknown) => isRecord(v) && [v.repetitions, v.intervalDays, v.easeFactor, v.version].every(numeric) && date(v.dueAt);
const card = (v: unknown) => isRecord(v) && [v.wordSenseId, v.wordId, v.wordRevisionId, v.lemma, v.partOfSpeech, v.cefrLevel, v.meaningVi].every(text)
  && nullableText(v.ipa) && nullableText(v.audioUrl) && Array.isArray(v.examples) && v.examples.every(example) && typeof v.isSaved === "boolean" && (v.progress === null || progress(v.progress));

export function isVocabularyResponse(path: string, value: unknown): boolean {
  const url = path.split("?")[0];
  if (url.endsWith("/ticket")) return isRecord(value) && text(value.url) && /^https:\/\//i.test(value.url as string);
  if (url.endsWith("/saved-senses")) return Array.isArray(value) && value.every(text);
  if (url.endsWith("/reviews/due")) return isRecord(value) && numeric(value.totalDue) && Array.isArray(value.cards) && value.cards.every(card);
  if (url.endsWith("/reviews/history")) return isPageResponse(value, v => isRecord(v) && text(v.reviewId) && nullableText(v.lemma) && nullableText(v.meaningVi) && rating(v.rating) && date(v.reviewedAt) && date(v.nextDueAt));
  if (url.endsWith("/progress")) return isRecord(value) && [value.studiedSenses, value.masteredSenses, value.dueNow, value.savedSenses, value.totalReviews, value.reviewsLast7Days].every(numeric);
  if (url.endsWith("/reviews")) return isRecord(value) && text(value.reviewId) && rating(value.rating) && [value.repetitions, value.intervalDays, value.easeFactor, value.progressVersion].every(numeric) && date(value.nextDueAt);
  if (/\/decks\/[^/]+\/words$/.test(url)) return isPageResponse(value, card);
  if (url.endsWith("/decks")) return isPageResponse(value, deck);
  if (/\/decks\/[^/]+$/.test(url)) return deck(value) && isRecord(value) && text(value.publishedRevisionId);
  if (url.endsWith("/words")) return isPageResponse(value, word);
  if (/\/words\/[^/]+$/.test(url)) return detail(value);
  if (url.endsWith("/saved-words")) return isPageResponse(value, v => isRecord(v) && [v.wordSenseId, v.wordId, v.lemma, v.partOfSpeech, v.cefrLevel, v.meaningVi].every(text));
  return true; // Các thao tác lưu/bỏ lưu trả 204, không có DTO đọc.
}
