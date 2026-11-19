import type { PageResponse } from "../../../lib/http.ts";
import { requestWithAuth, type AdminResult } from "./admin-client.ts";

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
  return requestWithAuth<PageResponse<ContentSource>>("/api/v1/admin/content/sources?size=100");
}

export function createContentSource(payload: CreateSourcePayload): Promise<AdminResult<ContentSource>> {
  return requestWithAuth<ContentSource>("/api/v1/admin/content/sources", { method: "POST", body: payload });
}

/** Tìm trong các từ đã xuất bản: bộ thẻ chỉ nhận được nghĩa của từ đã xuất bản. */
export async function searchPublishedSenses(query: string): Promise<AdminResult<PublishedSense[]>> {
  const res = await requestWithAuth<PageResponse<WordWithSenses>>(
    `/api/v1/vocabulary/words?q=${encodeURIComponent(query.trim())}&size=10`
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
