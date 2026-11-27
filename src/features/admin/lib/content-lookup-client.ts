import type { PageResponse } from "../../../lib/http.ts";
import { isPageResponse, isRecord, isUuid } from "../../../lib/api-validation.ts";
import { requestWithAuth, type AdminResult } from "./admin-client.ts";
import { isContentSource } from "./admin-validation.ts";

export interface ContentSource {
  id: string;
  title: string;
  sourceType: string;
  licenseCode: string | null;
  status: string;
}

export interface CreateSourcePayload {
  title: string;
  sourceType: "EXTERNAL";
  sourceUrl?: string;
  author?: string;
  licenseCode: string;
  attribution: string;
}

/** Một nghĩa của từ đã xuất bản, đủ thông tin để chọn vào bộ thẻ. */
export interface PublishedSense {
  senseId: string;
  lemma: string;
  partOfSpeech: string;
  cefrLevel: string;
  meaningVi: string;
}

interface WordWithSenses {
  lemma: string;
  senses: { id: string; partOfSpeech: string; cefrLevel: string; meaningVi: string }[];
}

export function fetchContentSources(): Promise<AdminResult<PageResponse<ContentSource>>> {
  return requestWithAuth<PageResponse<ContentSource>>("/api/v1/admin/content/sources?size=100", {
    validate: (data) => isPageResponse(data, isContentSource),
  });
}

export function createContentSource(payload: CreateSourcePayload): Promise<AdminResult<ContentSource>> {
  return requestWithAuth<ContentSource>("/api/v1/admin/content/sources", {
    method: "POST", body: payload, validate: isContentSource,
  });
}

function isWordWithSenses(value: unknown) {
  return isRecord(value) && typeof value.lemma === "string" && Array.isArray(value.senses) &&
    value.senses.every((sense) => isRecord(sense) && isUuid(sense.id) &&
      [sense.partOfSpeech, sense.cefrLevel, sense.meaningVi].every((field) => typeof field === "string"));
}

/** Tìm trong các từ đã xuất bản: bộ thẻ chỉ nhận được nghĩa của từ đã xuất bản. */
export async function searchPublishedSenses(query: string): Promise<AdminResult<PublishedSense[]>> {
  const res = await requestWithAuth<PageResponse<WordWithSenses>>(
    `/api/v1/vocabulary/words?q=${encodeURIComponent(query.trim())}&size=10`,
    { validate: (data) => isPageResponse(data, isWordWithSenses) }
  );
  if (!res.success) return res;
  return {
    success: true,
    data: res.data.items.flatMap((word) =>
      word.senses.map((sense) => ({
        senseId: sense.id,
        lemma: word.lemma,
        partOfSpeech: sense.partOfSpeech,
        cefrLevel: sense.cefrLevel,
        meaningVi: sense.meaningVi,
      }))
    ),
  };
}
