export type ContentModule = "VOCABULARY" | "GRAMMAR" | "QUESTION_BANK" | "TOEIC";

export type ContentType =
  | "WORD"
  | "FLASHCARD_DECK"
  | "GRAMMAR_LESSON"
  | "QUESTION"
  | "PRACTICE_SET";

export type ContentRevisionStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

export interface ContentItem {
  id: string;
  title: string;
  code: string;
  module: ContentModule;
  type: ContentType;
  status: ContentRevisionStatus;
  versionNo: number;
  summary: string;
  author: string;
  reviewer?: string;
  updatedAt: string;
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "TOEIC 500" | "TOEIC 750";
  latestRevisionId?: string | null;
}

export interface ContentFilterState {
  search: string;
  module: ContentModule | "ALL";
  status: ContentRevisionStatus | "ALL";
  page: number;
  pageSize: number;
}
