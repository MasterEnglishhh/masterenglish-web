import type { PageResponse } from "../../../lib/http.ts";
import { requestWithAuth, type AdminResult } from "./admin-client.ts";

export interface ContentSource {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl?: string | null;
  author?: string | null;
  licenseCode: string | null;
  status: string;
  createdAt?: string;
}

export interface CreateSourcePayload {
  title: string;
  sourceType?: string;
  sourceUrl?: string;
  author?: string;
  licenseCode: string;
  licenseUrl?: string;
  attribution: string;
  permissionNote?: string;
}

export interface FetchContentSourcesParams {
  search?: string;
  page?: number;
  size?: number;
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

export function fetchContentSources(
  params?: FetchContentSourcesParams
): Promise<AdminResult<PageResponse<ContentSource>>> {
  const query = new URLSearchParams();
  if (params?.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params?.page !== undefined) {
    // Spring Pageable is 0-indexed; Frontend state is 1-indexed
    const page0 = Math.max(0, (params.page || 1) - 1);
    query.set("page", page0.toString());
  }
  if (params?.size !== undefined) {
    query.set("size", params.size.toString());
  } else if (params?.page === undefined && !params?.search) {
    query.set("size", "100");
  }
  const qs = query.toString();
  return requestWithAuth<PageResponse<ContentSource>>(
    `/api/v1/admin/content/sources${qs ? `?${qs}` : ""}`
  );
}

export function createContentSource(
  payload: CreateSourcePayload
): Promise<AdminResult<ContentSource>> {
  const body = {
    sourceType: "EXTERNAL",
    ...payload,
  };
  return requestWithAuth<ContentSource>("/api/v1/admin/content/sources", {
    method: "POST",
    body,
  });
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
