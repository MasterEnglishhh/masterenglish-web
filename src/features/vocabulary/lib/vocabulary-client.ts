import { requestJson, type HttpOutcome } from "../../../lib/http.ts";
import type {
  DeckDetailDto,
  DeckDto,
  DueQueueResponse,
  LearningProgressResponse,
  PageResponse,
  ReviewHistoryItemDto,
  ReviewRequest,
  ReviewResponse,
  SavedWordDto,
  WordDetailDto,
  WordListDto,
  WordSenseCardDto,
} from "../types/vocabulary";

export interface VocabularyClientError {
  code: string;
  message: string;
  status: number;
  retryable?: boolean;
}

export type VocabularyResult<T> =
  { success: true; data: T } | { success: false; error: VocabularyClientError };


function fail<T>(
  code: string,
  message: string,
  status: number,
  retryable?: boolean
): VocabularyResult<T> {
  return {
    success: false,
    error: {
      code,
      message,
      status,
      ...(retryable === undefined ? {} : { retryable }),
    },
  };
}

/** Đổi kết quả vận chuyển thành thông báo tiếng Việt của phân hệ từ vựng. */
function toResult<T>(outcome: HttpOutcome<T>): VocabularyResult<T> {
  if (outcome.ok) return { success: true, data: outcome.data };
  const { reason, status, problem } = outcome;

  if (reason === "csrf")
    return fail(
      "CSRF_UNAVAILABLE",
      "Không thể xác nhận phiên bảo mật. Vui lòng thử lại.",
      403,
      true
    );
  if (reason === "session")
    return fail(
      "UNAUTHENTICATED",
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      401
    );
  if (reason === "network")
    return fail(
      "NETWORK_ERROR",
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.",
      0,
      true
    );

  if (status === 403)
    return fail(
      problem?.code ?? "ACCESS_DENIED",
      "Bạn không có quyền truy cập tính năng học tập này.",
      403
    );

  // RATE_LIMITED: máy chủ từ chối trước khi xử lý, nên chờ rồi thử lại là an toàn.
  if (status === 429) {
    const seconds = outcome.retryAfterSeconds;
    return fail(
      problem?.code ?? "RATE_LIMITED",
      seconds
        ? `Bạn thao tác quá nhanh. Vui lòng chờ ${seconds} giây rồi thử lại.`
        : "Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.",
      429,
      true
    );
  }

  if (status === 409)
    return fail(
      problem?.code ?? "CONFLICT",
      "Tiến độ đã thay đổi hoặc thẻ chưa đến hạn. Tải lại dữ liệu để tiếp tục.",
      409,
      true
    );

  if (status === 404)
    return fail(
      problem?.code ?? "RESOURCE_NOT_FOUND",
      "Nội dung này không còn khả dụng. Hãy tải lại danh sách.",
      404
    );

  return fail(
    problem?.code ?? "SERVICE_ERROR",
    status === 400
      ? "Yêu cầu chưa hợp lệ. Hãy tải lại dữ liệu và thử lại."
      : "Dịch vụ học tập đang gián đoạn. Vui lòng thử lại sau.",
    status,
    status >= 500
  );
}

async function requestWithAuth<T>(
  path: string,
  options?: Parameters<typeof requestJson>[1]
): Promise<VocabularyResult<T>> {
  return toResult(await requestJson<T>(path, options));
}

export function fetchWords(params?: {
  q?: string;
  cefrLevel?: string;
  partOfSpeech?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}): Promise<VocabularyResult<PageResponse<WordListDto>>> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.cefrLevel) query.set("cefrLevel", params.cefrLevel);
  if (params?.partOfSpeech) query.set("partOfSpeech", params.partOfSpeech);
  if (params?.page != null) query.set("page", String(params.page));
  if (params?.size != null) query.set("size", String(params.size));
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortDirection) query.set("sortDirection", params.sortDirection);

  const qs = query.toString();
  return requestWithAuth<PageResponse<WordListDto>>(
    `/api/v1/vocabulary/words${qs ? `?${qs}` : ""}`
  );
}

export function fetchWordDetail(
  wordId: string
): Promise<VocabularyResult<WordDetailDto>> {
  return requestWithAuth<WordDetailDto>(`/api/v1/vocabulary/words/${wordId}`);
}

export function fetchSavedSenseIds(
  wordId: string
): Promise<VocabularyResult<string[]>> {
  return requestWithAuth<string[]>(
    `/api/v1/vocabulary/words/${wordId}/saved-senses`
  );
}

export function fetchDecks(params?: {
  q?: string;
  level?: string;
  page?: number;
  size?: number;
}): Promise<VocabularyResult<PageResponse<DeckDto>>> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.level) query.set("level", params.level);
  if (params?.page != null) query.set("page", String(params.page));
  if (params?.size != null) query.set("size", String(params.size));

  const qs = query.toString();
  return requestWithAuth<PageResponse<DeckDto>>(
    `/api/v1/vocabulary/decks${qs ? `?${qs}` : ""}`
  );
}

export function fetchDeckDetail(
  deckId: string
): Promise<VocabularyResult<DeckDetailDto>> {
  return requestWithAuth<DeckDetailDto>(`/api/v1/vocabulary/decks/${deckId}`);
}

export function fetchDeckCards(
  deckId: string,
  params?: {
    cefrLevel?: string;
    partOfSpeech?: string;
    page?: number;
    size?: number;
  }
): Promise<VocabularyResult<PageResponse<WordSenseCardDto>>> {
  const query = new URLSearchParams();
  if (params?.cefrLevel) query.set("cefrLevel", params.cefrLevel);
  if (params?.partOfSpeech) query.set("partOfSpeech", params.partOfSpeech);
  if (params?.page != null) query.set("page", String(params.page));
  if (params?.size != null) query.set("size", String(params.size));

  const qs = query.toString();
  return requestWithAuth<PageResponse<WordSenseCardDto>>(
    `/api/v1/vocabulary/decks/${deckId}/words${qs ? `?${qs}` : ""}`
  );
}

export function fetchSavedWords(params?: {
  cefrLevel?: string;
  page?: number;
  size?: number;
}): Promise<VocabularyResult<PageResponse<SavedWordDto>>> {
  const query = new URLSearchParams();
  if (params?.cefrLevel) query.set("cefrLevel", params.cefrLevel);
  if (params?.page != null) query.set("page", String(params.page));
  if (params?.size != null) query.set("size", String(params.size));

  const qs = query.toString();
  return requestWithAuth<PageResponse<SavedWordDto>>(
    `/api/v1/vocabulary/saved-words${qs ? `?${qs}` : ""}`
  );
}

export function saveWordSense(
  senseId: string,
  signal?: AbortSignal
): Promise<VocabularyResult<void>> {
  return requestWithAuth<void>(`/api/v1/vocabulary/saved-words/${senseId}`, {
    method: "PUT",
    signal,
  });
}

export function unsaveWordSense(
  senseId: string,
  signal?: AbortSignal
): Promise<VocabularyResult<void>> {
  return requestWithAuth<void>(`/api/v1/vocabulary/saved-words/${senseId}`, {
    method: "DELETE",
    signal,
  });
}

export function fetchDueQueue(params?: {
  deckId?: string;
  limit?: number;
}): Promise<VocabularyResult<DueQueueResponse>> {
  const query = new URLSearchParams();
  if (params?.deckId) query.set("deckId", params.deckId);
  if (params?.limit != null) query.set("limit", String(params.limit));

  const qs = query.toString();
  return requestWithAuth<DueQueueResponse>(
    `/api/v1/vocabulary/reviews/due${qs ? `?${qs}` : ""}`
  );
}

export function submitReview(
  payload: ReviewRequest,
  signal?: AbortSignal
): Promise<VocabularyResult<ReviewResponse>> {
  return requestWithAuth<ReviewResponse>("/api/v1/vocabulary/reviews", {
    method: "POST",
    signal,
    body: payload,
  });
}

export function fetchPronunciationTicket(
  audioUrl: string,
  signal?: AbortSignal
): Promise<VocabularyResult<{ url: string }>> {
  if (
    !/^\/api\/v1\/vocabulary\/pronunciations\/[0-9a-f-]{36}$/i.test(audioUrl)
  ) {
    return Promise.resolve({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Không tìm thấy âm thanh của từ này.",
        status: 400,
      },
    });
  }
  return requestWithAuth<{ url: string }>(`${audioUrl}/ticket`, { signal });
}

export function fetchReviewHistory(params?: {
  page?: number;
  size?: number;
}): Promise<VocabularyResult<PageResponse<ReviewHistoryItemDto>>> {
  const query = new URLSearchParams();
  if (params?.page != null) query.set("page", String(params.page));
  if (params?.size != null) query.set("size", String(params.size));
  const qs = query.toString();
  return requestWithAuth<PageResponse<ReviewHistoryItemDto>>(
    `/api/v1/vocabulary/reviews/history${qs ? `?${qs}` : ""}`
  );
}

export function fetchLearningProgress(): Promise<
  VocabularyResult<LearningProgressResponse>
> {
  return requestWithAuth<LearningProgressResponse>(
    "/api/v1/vocabulary/progress"
  );
}
