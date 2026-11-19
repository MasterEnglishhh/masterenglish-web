export type RatingType = "AGAIN" | "HARD" | "GOOD";

export interface ExampleDto {
  id: string;
  position: number;
  exampleEn: string;
  exampleVi: string | null;
}

export interface SenseSummaryDto {
  id: string;
  senseNo: number;
  partOfSpeech: string;
  cefrLevel: string;
  meaningVi: string;
  definitionEn: string | null;
}

export interface SenseDetailDto extends SenseSummaryDto {
  examples: ExampleDto[];
}

export interface WordListDto {
  id: string;
  lemma: string;
  languageCode: string;
  ipa: string | null;
  audioUrl: string | null;
  senses: SenseSummaryDto[];
}

export interface WordDetailDto {
  id: string;
  lemma: string;
  languageCode: string;
  ipa: string | null;
  audioUrl: string | null;
  senses: SenseDetailDto[];
}

export interface DeckDto {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  cardCount: number;
  createdAt: string;
}

export interface DeckDetailDto extends DeckDto {
  publishedRevisionId: string;
}

export interface ProgressSummaryDto {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  dueAt: string;
  version: number;
}

export interface WordSenseCardDto {
  deckId: string | null;
  deckRevisionId: string | null;
  position: number;
  wordSenseId: string;
  wordId: string;
  wordRevisionId: string;
  lemma: string;
  ipa: string | null;
  partOfSpeech: string;
  cefrLevel: string;
  meaningVi: string;
  definitionEn: string | null;
  examples: ExampleDto[];
  audioUrl: string | null;
  isSaved?: boolean;
  progress?: ProgressSummaryDto | null;
}

export interface SavedWordDto {
  wordSenseId: string;
  wordId: string;
  lemma: string;
  ipa: string | null;
  partOfSpeech: string;
  cefrLevel: string;
  meaningVi: string;
  definitionEn: string | null;
  savedAt: string;
}

export interface SavedSenseIdsResponse {
  savedSenseIds: string[];
}

export interface DueQueueResponse {
  totalDue: number;
  cards: WordSenseCardDto[];
}

export interface ReviewRequest {
  wordSenseId: string;
  sourceWordId: string;
  sourceRevisionId: string;
  deckId?: string | null;
  deckRevisionId?: string | null;
  rating: RatingType;
  reviewRequestId: string;
  expectedProgressVersion?: number | null;
}

export interface ReviewResponse {
  reviewId: string;
  wordSenseId: string;
  rating: RatingType;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextDueAt: string;
  progressVersion: number;
}

export type { PageResponse } from "../../../lib/http.ts";

export interface SessionSummary {
  totalReviewed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
}

export interface ReviewHistoryItemDto {
  reviewId: string;
  wordSenseId: string;
  wordId: string;
  lemma: string | null;
  meaningVi: string | null;
  rating: RatingType;
  reviewedAt: string;
  previousDueAt: string | null;
  nextDueAt: string;
}

export interface LearningProgressResponse {
  studiedSenses: number;
  masteredSenses: number;
  dueNow: number;
  savedSenses: number;
  totalReviews: number;
  reviewsLast7Days: number;
}
