// Theo hợp đồng backend: masterenglish-api/docs/admin/CONTRACT.md §2.3.
// Backend hiện chỉ quản lý nội dung Từ vựng (WORD) và Bộ thẻ (DECK).
export type ContentModule = "VOCABULARY";

export type ContentType = "WORD" | "DECK";

export type ContentRevisionStatus =
  "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED" | "ARCHIVED";

/** Giá trị `status` mà `GET /admin/content/items` chấp nhận (không có REJECTED). */
export type ContentStatusFilter =
  Exclude<ContentRevisionStatus, "REJECTED"> | "ALL";

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
  reviewer?: string | null;
  updatedAt: string;
  level?: string | null;
  latestRevisionId?: string | null;
}

export interface ContentFilterState {
  search: string;
  contentType: ContentType | "ALL";
  status: ContentStatusFilter;
  page: number;
  pageSize: number;
}

export interface AdminRevisionDto {
  revisionId: string;
  contentItemId: string;
  status: ContentRevisionStatus;
  versionNo: number;
  reviewNote?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
}

export interface CreateWordDraftPayload {
  lemma: string;
  partOfSpeech: string;
  cefrLevel: string;
  meaningVi: string;
  definitionEn?: string;
  ipa?: string;
  examplesEn?: string[];
  examplesVi?: string[];
  changeSummary?: string;
  sourceId?: string;
}

export interface CreateDeckDraftPayload {
  title: string;
  description?: string;
  level?: string;
  wordSenseIds?: string[];
  changeSummary?: string;
  sourceId?: string;
}
