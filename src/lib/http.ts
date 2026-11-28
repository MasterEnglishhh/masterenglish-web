/**
 * Phần vận chuyển dùng chung cho mọi client API: CSRF, làm mới phiên khi 401 và đọc lỗi
 * problem+json. File này không biết câu báo lỗi nào; mỗi feature tự đổi `HttpOutcome`
 * thành thông báo tiếng Việt của mình.
 */
import {
  fetchCsrfToken,
  refreshSession,
  requestOptions,
  sessionIdentity,
} from "./session.ts";
import { isRecord } from "./api-validation.ts";

export interface Problem {
  code?: string;
  detail?: string;
  message?: string;
  title?: string;
  errors?: { field: string }[];
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export async function readProblem(res: Response): Promise<Problem | null> {
  const raw: unknown = await res.json().catch(() => null);
  return isRecord(raw)
    ? {
        ...Object.fromEntries(
          ["code", "detail", "message", "title"].flatMap((key) =>
            typeof raw[key] === "string" ? [[key, raw[key]]] : []
          )
        ),
        ...(Array.isArray(raw.errors)
          ? {
              errors: raw.errors.filter(
                (v): v is { field: string } =>
                  isRecord(v) && typeof v.field === "string"
              ),
            }
          : {}),
      }
    : null;
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

export function apiErrorMessage(outcome: HttpOutcome<unknown>): string {
  if (outcome.ok) return "";
  if (outcome.status === 401)
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (outcome.status === 403)
    return "Bạn chưa có quyền thực hiện thao tác này.";
  if (outcome.status === 404) return "Nội dung hoặc dịch vụ này chưa khả dụng.";
  if (outcome.status === 409)
    return "Dữ liệu đã thay đổi. Hãy tải lại trước khi tiếp tục.";
  if (outcome.status === 429)
    return outcome.retryAfterSeconds
      ? `Vui lòng chờ ${outcome.retryAfterSeconds} giây rồi thử lại.`
      : "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.";
  if (outcome.problem?.code === "INVALID_RESPONSE")
    return "Dữ liệu máy chủ chưa hợp lệ. Vui lòng thử lại sau.";
  return outcome.status >= 400 &&
    outcome.status < 500 &&
    outcome.problem?.detail
    ? outcome.problem.detail
    : "Chưa kết nối được dịch vụ. Vui lòng thử lại.";
}

interface RequestJsonOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  headers?: HeadersInit;
  validate?: (data: unknown) => boolean;
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
  {
    method = "GET",
    body,
    signal,
    headers: customHeaders,
    validate,
  }: RequestJsonOptions = {}
): Promise<HttpOutcome<T>> {
  const actor = sessionIdentity.userId;
  try {
    if (
      !path.startsWith("/api/") ||
      /[\\\u0000-\u0020\u007f]/.test(path) ||
      !new URL(path, "https://masterenglish.local").pathname.startsWith("/api/")
    )
      return failure("http", 400, { code: "INVALID_API_PATH" });
    // 401 làm mới phiên rồi thử lại đúng một lần; token CSRF được lấy lại vì cookie đã xoay.
    for (let attempt = 0; ; attempt++) {
      const defaults = requestOptions(signal);
      const headers = new Headers(customHeaders);
      for (const [name, value] of Object.entries(defaults.headers))
        headers.set(name, value);
      if (method !== "GET") {
        if (actor) headers.set("X-Session-User", actor);
        else headers.delete("X-Session-User");
        const csrf = await fetchCsrfToken();
        if (!csrf) return failure("csrf", 403);
        headers.set(csrf.headerName, csrf.token);
      }
      if (body !== undefined) headers.set("Content-Type", "application/json");

      const res = await fetch(path, {
        ...defaults,
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (res.status === 401) {
        if (attempt === 0 && (await refreshSession())) continue;
        return failure("session", 401);
      }

      if (res.ok) {
        if (res.status === 204) {
          if (validate && !validate(undefined))
            return failure("http", res.status, { code: "INVALID_RESPONSE" });
          return { ok: true, status: 204, data: undefined as T };
        }
        try {
          const data: unknown = await res.json();
          if (validate && !validate(data))
            return failure("http", res.status, { code: "INVALID_RESPONSE" });
          return {
            ok: true,
            status: res.status,
            data: data as T,
          };
        } catch {
          // Ví dụ proxy cấu hình sai trả HTML với mã 200.
          return failure("http", res.status);
        }
      }

      return failure(
        "http",
        res.status,
        await readProblem(res),
        retryAfterSeconds(res.headers.get("Retry-After"))
      );
    }
  } catch {
    return failure("network", 0);
  }
}
