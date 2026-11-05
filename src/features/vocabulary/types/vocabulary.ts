export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type PartOfSpeech =
  | "NOUN"
  | "VERB"
  | "ADJECTIVE"
  | "ADVERB"
  | "PRONOUN"
  | "PREPOSITION"
  | "CONJUNCTION"
  | "DETERMINER"
  | "INTERJECTION"
  | "NUMERAL"
  | "PHRASE";

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

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface SessionSummary {
  totalReviewed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
}
