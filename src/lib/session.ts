/**
 * Phiên đăng nhập dùng chung cho mọi client: CSRF, làm mới phiên và khoá giữa các tab.
 * File này được `node --test` chạy trực tiếp nên chỉ import tương đối kèm đuôi `.ts`.
 */

export interface CsrfPayload {
  headerName: string;
  token: string;
}

export const sessionIdentity: { userId: string | null } = { userId: null };

export function requestOptions(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(30_000);
  return {
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    headers: { Accept: "application/json, application/problem+json" },
    signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
  } satisfies RequestInit;
}

let csrfRequest: Promise<CsrfPayload | null> | null = null;
let refreshRequest: Promise<boolean> | null = null;

function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("XSRF-TOKEN="));
  return cookie
    ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)) || null
    : null;
}

export async function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return await navigator.locks.request("masterenglish-auth", operation);
  }
  return operation();
}

export function fetchCsrfToken(): Promise<CsrfPayload | null> {
  if (!csrfRequest) {
    csrfRequest = (async () => {
      try {
        const res = await fetch("/api/v1/auth/csrf", requestOptions());
        if (!res.ok) return null;
        const data = (await res.json()) as Partial<CsrfPayload>;
        if (
          data.headerName === "X-XSRF-TOKEN" &&
          typeof data.token === "string" &&
          data.token
        ) {
          // A response may set the cookie more than once while renewing CSRF.
          // Use the final browser cookie, which the next request will send.
          return {
            headerName: data.headerName,
            token: readCsrfCookie() ?? data.token,
          };
        }
      } catch {
        // Never submit credentials with a missing or stale CSRF token.
      }
      return null;
    })().finally(() => {
      csrfRequest = null;
    });
  }
  return csrfRequest;
}

export async function postAuth(path: string, body?: object): Promise<Response> {
  const actor = sessionIdentity.userId;
  const csrf = await fetchCsrfToken();
  if (!csrf)
    throw new Error("Không thể kết nối đến máy chủ bảo mật. Vui lòng thử lại.");
  // Backend dùng ACCESS_DENIED cho cả CSRF và quyền truy cập; không tự phát lại 403.
  const options = requestOptions();
  return fetch(`/api/v1/auth/${path}`, {
    ...options,
    method: "POST",
    headers: {
      ...options.headers,
      ...(path === "logout" && actor ? { "X-Session-User": actor } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      [csrf.headerName]: csrf.token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Single flight prevents rotating the same refresh token twice in one tab. */
export function refreshSession(): Promise<boolean> {
  if (!refreshRequest) {
    refreshRequest = withAuthLock(async () => {
      // Another tab may have rotated the shared cookies while we waited.
      if (typeof navigator !== "undefined" && navigator.locks) {
        const profile = await fetch("/api/v1/users/me", requestOptions());
        if (profile.ok) return true;
        if (profile.status !== 401)
          throw new Error("Không thể kiểm tra phiên đăng nhập.");
      }
      const res = await postAuth("refresh");
      if (res.status === 401) return false;
      if (!res.ok)
        throw new Error("Không thể làm mới phiên đăng nhập. Vui lòng thử lại.");
      return true;
    }).finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

/** Chờ lần làm mới đang bay (nếu có) xong, để thu hồi đúng token đã xoay. */
export async function waitForRefresh(): Promise<void> {
  await refreshRequest?.catch(() => false);
}
