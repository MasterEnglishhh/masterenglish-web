import { fetchCsrfToken, refreshSession } from "../../auth/lib/auth-client.ts";
import type {
  DeckDetailDto,
  DeckDto,
  DueQueueResponse,
  PageResponse,
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

const requestOptions = {
  credentials: "same-origin",
  cache: "no-store",
  headers: { Accept: "application/json, application/problem+json" },
} satisfies RequestInit;

async function requestWithAuth<T>(
  path: string,
  options?: RequestInit,
  isRetry = false
): Promise<VocabularyResult<T>> {
  try {
    let headers: Record<string, string> = {
      ...(requestOptions.headers as Record<string, string>),
      ...((options?.headers as Record<string, string>) ?? {}),
    };

    // Attach CSRF token for mutating requests (POST, PUT, DELETE)
    const method = options?.method?.toUpperCase() ?? "GET";
    if (["POST", "PUT", "DELETE"].includes(method)) {
      const csrf = await fetchCsrfToken();
      if (!csrf) {
        return {
          success: false,
          error: {
            code: "CSRF_UNAVAILABLE",
            message: "Không thể xác nhận phiên bảo mật. Vui lòng thử lại.",
            status: 403,
            retryable: true,
          },
        };
      }
      headers = {
        ...headers,
        [csrf.headerName]: csrf.token,
        "Content-Type": "application/json",
      };
    }

    const res = await fetch(path, {
      ...requestOptions,
      ...options,
      headers,
    });

    // Handle 401: Refresh session once if not already a retry
    if (res.status === 401 && !isRetry) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return requestWithAuth<T>(path, options, true);
      }
      return {
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          status: 401,
        },
      };
    }

    // Success responses
    if (res.ok) {
      if (res.status === 204) {
        return { success: true, data: undefined as unknown as T };
      }
      const data = (await res.json()) as T;
      return { success: true, data };
    }

    // Parse ProblemDetail or generic error
    let problem: { code?: string; detail?: string; title?: string } | null =
      null;
    try {
      problem = await res.json();
    } catch {
      // Non-JSON response
    }

    if (res.status === 403) {
      return {
        success: false,
        error: {
          code: problem?.code ?? "ACCESS_DENIED",
          message: "Bạn không có quyền truy cập tính năng học tập này.",
          status: 403,
        },
      };
    }

    if (res.status === 409) {
      return {
        success: false,
        error: {
          code: problem?.code ?? "CONFLICT",
          message:
            "Tiến độ đã thay đổi hoặc thẻ chưa đến hạn. Tải lại dữ liệu để tiếp tục.",
          status: 409,
          retryable: true,
        },
      };
    }

    if (res.status === 404) {
      return {
        success: false,
        error: {
          code: problem?.code ?? "RESOURCE_NOT_FOUND",
          message: "Nội dung này không còn khả dụng. Hãy tải lại danh sách.",
          status: 404,
        },
      };
    }

    return {
      success: false,
      error: {
        code: problem?.code ?? "SERVICE_ERROR",
        message:
          res.status === 400
            ? "Yêu cầu chưa hợp lệ. Hãy tải lại dữ liệu và thử lại."
            : "Dịch vụ học tập đang gián đoạn. Vui lòng thử lại sau.",
        status: res.status,
        retryable: res.status >= 500,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message:
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.",
        status: 0,
        retryable: true,
      },
    };
  }
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
    body: JSON.stringify(payload),
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
