/**
 * Phần vận chuyển dùng chung cho mọi client API: CSRF, làm mới phiên khi 401 và đọc lỗi
 * problem+json. File này không biết câu báo lỗi nào; mỗi feature tự đổi `HttpOutcome`
 * thành thông báo tiếng Việt của mình.
 */
import { fetchCsrfToken, refreshSession, requestOptions } from "./session.ts";

export interface Problem {
  code?: string;
  detail?: string;
  message?: string;
  title?: string;
  errors?: { field: string; message?: string }[];
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

/**
 * - `http`: máy chủ trả lỗi (hoặc phản hồi thành công không đọc được).
 * - `csrf`: không lấy được token CSRF, chưa gửi gì lên máy chủ.
 * - `session`: 401 vẫn còn sau khi đã làm mới phiên đúng một lần.
 * - `network`: mất mạng, bị huỷ, hoặc dịch vụ làm mới phiên lỗi (status 0).
 */
export type HttpFailureReason = "http" | "csrf" | "session" | "network";

export type HttpOutcome<T> =
  | { ok: true; status: number; data: T }
  | {
      ok: false;
      reason: HttpFailureReason;
      status: number;
      problem: Problem | null;
      retryAfterSeconds: number | null;
    };

interface RequestJsonOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/** `Retry-After` là số giây hoặc ngày giờ HTTP; trả `null` nếu không dùng được. */
export function retryAfterSeconds(header: string | null): number | null {
  if (!header) return null;
  const seconds = /^\d+$/.test(header)
    ? Number(header)
    : Math.ceil((Date.parse(header) - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function failure(
  reason: HttpFailureReason,
  status: number,
  problem: Problem | null = null,
  retryAfter: number | null = null
): HttpOutcome<never> {
  return { ok: false, reason, status, problem, retryAfterSeconds: retryAfter };
}

export async function requestJson<T>(
  path: string,
  { method = "GET", body, signal }: RequestJsonOptions = {}
): Promise<HttpOutcome<T>> {
  try {
    // 401 làm mới phiên rồi thử lại đúng một lần; token CSRF được lấy lại vì cookie đã xoay.
    for (let attempt = 0; ; attempt++) {
      const headers: Record<string, string> = { ...requestOptions.headers };
      if (method !== "GET") {
        const csrf = await fetchCsrfToken();
        if (!csrf) return failure("csrf", 403);
        headers[csrf.headerName] = csrf.token;
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(path, {
        ...requestOptions,
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });

      if (res.status === 401) {
        if (attempt === 0 && (await refreshSession())) continue;
        return failure("session", 401);
      }

      if (res.ok) {
        if (res.status === 204)
          return { ok: true, status: 204, data: undefined as T };
        try {
          return {
            ok: true,
            status: res.status,
            data: (await res.json()) as T,
          };
        } catch {
          // Ví dụ proxy cấu hình sai trả HTML với mã 200.
          return failure("http", res.status);
        }
      }

      const problem = (await res.json().catch(() => null)) as Problem | null;
      return failure(
        "http",
        res.status,
        problem,
        retryAfterSeconds(res.headers.get("Retry-After"))
      );
    }
  } catch {
    return failure("network", 0);
  }
}
