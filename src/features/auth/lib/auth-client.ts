import type {
  AuthResult,
  AuthUser,
  LoginCredentials,
  ProblemDetail,
} from "../types/auth";

interface CsrfPayload {
  headerName: string;
  token: string;
}

/**
 * Reads a cookie value by name in the browser document.
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[-.$*+?()[\]{}|\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Fetches the CSRF token and header name from the backend.
 * Falls back to extracting the XSRF-TOKEN cookie if already set.
 */
export async function fetchCsrfToken(): Promise<CsrfPayload | null> {
  try {
    const res = await fetch("/api/v1/auth/csrf", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = (await res.json()) as { headerName?: string; token?: string };
      if (data && data.headerName && data.token) {
        return { headerName: data.headerName, token: data.token };
      }
    }
  } catch {
    // If endpoint fails, check if an existing XSRF cookie exists
  }

  const cookieToken = getCookie("XSRF-TOKEN");
  if (cookieToken) {
    return { headerName: "X-XSRF-TOKEN", token: cookieToken };
  }

  return null;
}

/**
 * Attempts to parse a response body as an RFC 7807 ProblemDetail object.
 */
async function parseProblemDetail(res: Response): Promise<ProblemDetail | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as ProblemDetail;
  } catch {
    return null;
  }
}

/**
 * Calls the login API endpoint, handling CSRF, HttpOnly session cookies,
 * RFC 7807 problem details, rate limiting, and network failures.
 */
export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  let csrf: CsrfPayload | null = null;

  try {
    csrf = await fetchCsrfToken();
  } catch {
    // Network or server issue fetching CSRF
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Không thể kết nối đến máy chủ bảo mật. Vui lòng kiểm tra lại mạng.",
        retryable: true,
      },
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, application/problem+json",
  };

  if (csrf) {
    headers[csrf.headerName] = csrf.token;
  }

  let res: Response;
  try {
    res = await fetch("/api/v1/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      }),
    });
  } catch {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.",
        retryable: true,
      },
    };
  }

  // 1. Success (200 / 201)
  if (res.ok) {
    let user: AuthUser | null = null;
    try {
      const data = await res.json();
      if (data && (data.id || data.email)) {
        user = data as AuthUser;
      }
    } catch {
      // Body may be empty if session cookie was set
    }

    if (!user) {
      // Attempt to load current user profile via /api/v1/users/me
      user = await getCurrentUser();
    }

    if (user) {
      return { success: true, user };
    }

    // A successful response without a verifiable user is not a usable session.
    return {
      success: false,
      error: {
        code: "SESSION_UNAVAILABLE",
        message: "Không thể xác nhận phiên đăng nhập. Vui lòng thử lại.",
        retryable: true,
      },
    };
  }

  // 2. Error handling based on status code and problem detail
  const problem = await parseProblemDetail(res);

  // Status 401 or 400 with invalid credentials
  if (res.status === 401 || (res.status === 400 && problem?.code === "BAD_CREDENTIALS")) {
    return {
      success: false,
      error: {
        code: "BAD_CREDENTIALS",
        message: "Email hoặc mật khẩu không chính xác.",
        status: 401,
      },
    };
  }

  // Status 429 Too Many Requests (Rate limited)
  if (res.status === 429) {
    let retryAfterSeconds = 60;
    const retryHeader = res.headers.get("Retry-After");
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        retryAfterSeconds = parsed;
      }
    }

    const detailMessage =
      problem?.detail ||
      `Bạn đã nhập sai quá số lần quy định. Vui lòng chờ ${retryAfterSeconds} giây trước khi thử lại.`;

    return {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: detailMessage,
        retryAfterSeconds,
        status: 429,
      },
    };
  }

  // Status 403 Forbidden (CSRF token mismatch or expired)
  if (res.status === 403) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Phiên bảo mật không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
        retryable: true,
        status: 403,
      },
    };
  }

  // Status 404 or 501: Backend endpoint not implemented yet
  if (res.status === 404 || res.status === 501) {
    return {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Dịch vụ đăng nhập chưa sẵn sàng. Vui lòng thử lại sau.",
        retryable: true,
        status: res.status,
      },
    };
  }

  // Status 500, 502, 503, 504
  return {
    success: false,
    error: {
      code: problem?.code || "SERVER_ERROR",
      message:
        problem?.detail ||
        "Máy chủ đang bận hoặc xảy ra lỗi xử lý. Vui lòng bấm thử lại.",
      retryable: true,
      status: res.status,
    },
  };
}

/**
 * Fetches the authenticated user profile from GET /api/v1/users/me.
 * Returns null if not authenticated or if the endpoint fails.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/v1/users/me", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = (await res.json()) as AuthUser;
      if (data && (data.id || data.email)) {
        return data;
      }
    }
  } catch {
    // Session not authenticated or network error
  }

  return null;
}

/**
 * Calls POST /api/v1/auth/logout to invalidate the session and clear cookies.
 */
export async function logout(): Promise<boolean> {
  try {
    const csrf = await fetchCsrfToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (csrf) {
      headers[csrf.headerName] = csrf.token;
    }

    const res = await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers,
    });

    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}
