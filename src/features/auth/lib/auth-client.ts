import type {
  AuthResult,
  AuthUser,
  LoginCredentials,
  ProblemDetail,
  RegisterCredentials,
  RegistrationChallenge,
  RegistrationIdentity,
  RegistrationResult,
  VerificationResult,
  PasswordResetChallenge,
  PasswordResetGrant,
  AuthActionResult,
} from "../types/auth";

interface CsrfPayload {
  headerName: string;
  token: string;
}

const requestOptions = {
  credentials: "same-origin",
  cache: "no-store",
  headers: { Accept: "application/json, application/problem+json" },
} satisfies RequestInit;

let csrfRequest: Promise<CsrfPayload | null> | null = null;
let refreshRequest: Promise<boolean> | null = null;
let profileRequest: Promise<AuthUser | null> | null = null;

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

async function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return await navigator.locks.request("masterenglish-auth", operation);
  }
  return operation();
}

export function fetchCsrfToken(): Promise<CsrfPayload | null> {
  if (!csrfRequest) {
    csrfRequest = (async () => {
      try {
        const res = await fetch("/api/v1/auth/csrf", requestOptions);
        if (!res.ok) return null;
        const data = (await res.json()) as Partial<CsrfPayload>;
        if (
          typeof data.headerName === "string" &&
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

async function postAuth(path: string, body?: object): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const csrf = await fetchCsrfToken();
    if (!csrf)
      throw new Error(
        "Không thể kết nối đến máy chủ bảo mật. Vui lòng thử lại."
      );
    const res = await fetch(`/api/v1/auth/${path}`, {
      ...requestOptions,
      method: "POST",
      headers: {
        ...requestOptions.headers,
        "Content-Type": "application/json",
        [csrf.headerName]: csrf.token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    // CSRF rejection occurs before the controller; bootstrap once and retry.
    if (res.status !== 403 || attempt === 1) return res;
  }
  throw new Error("Không thể xác nhận phiên bảo mật.");
}

function isAuthUser(data: unknown): data is AuthUser {
  if (!data || typeof data !== "object") return false;
  const user = data as Partial<AuthUser>;
  return (
    typeof user.id === "string" &&
    !!user.id &&
    typeof user.email === "string" &&
    !!user.email
  );
}

async function parseProblemDetail(
  res: Response
): Promise<ProblemDetail | null> {
  try {
    return (await res.json()) as ProblemDetail;
  } catch {
    return null;
  }
}

export async function login(
  credentials: LoginCredentials
): Promise<AuthResult> {
  try {
    // Let an earlier session check finish before replacing its cookies.
    await profileRequest?.catch(() => null);
    const res = await withAuthLock(() =>
      postAuth("login", {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      })
    );

    if (res.ok) {
      const data: unknown = await res.json().catch(() => null);
      const user = isAuthUser(data) ? data : await getCurrentUser();
      if (user) return { success: true, user };
      return {
        success: false,
        error: {
          code: "SESSION_UNAVAILABLE",
          message: "Không thể xác nhận phiên đăng nhập. Vui lòng thử lại.",
          retryable: true,
        },
      };
    }

    const problem = await parseProblemDetail(res);
    if (res.status === 401) {
      return {
        success: false,
        error: {
          code: "BAD_CREDENTIALS",
          message: "Email hoặc mật khẩu không chính xác.",
          status: 401,
        },
      };
    }
    if (res.status === 429) {
      const retryHeader = res.headers.get("Retry-After");
      const seconds =
        retryHeader && /^\d+$/.test(retryHeader)
          ? Number(retryHeader)
          : retryHeader
            ? Math.ceil((Date.parse(retryHeader) - Date.now()) / 1000)
            : NaN;
      const retryAfterSeconds =
        Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
      return {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: `Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ ${retryAfterSeconds} giây trước khi thử lại.`,
          retryAfterSeconds,
          status: 429,
        },
      };
    }
    if (res.status === 400 && problem?.code === "VALIDATION_ERROR") {
      const fieldViolations: Record<string, string> = {};
      for (const violation of problem.errors ?? []) {
        if (violation.field === "email" || violation.field === "password") {
          fieldViolations[violation.field] =
            violation.field === "email"
              ? "Vui lòng nhập email hợp lệ."
              : "Vui lòng nhập mật khẩu.";
        }
      }
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Vui lòng kiểm tra lại thông tin đăng nhập.",
          status: 400,
          fieldViolations,
        },
      };
    }
    return {
      success: false,
      error: {
        code: res.status === 403 ? "FORBIDDEN" : "SERVICE_UNAVAILABLE",
        message:
          res.status === 403
            ? "Phiên bảo mật không hợp lệ hoặc đã hết hạn. Vui lòng thử lại."
            : "Dịch vụ đăng nhập đang gián đoạn. Vui lòng thử lại sau.",
        retryable: true,
        status: res.status,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message:
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.",
        retryable: true,
      },
    };
  }
}

/** Single flight prevents rotating the same refresh token twice in one tab. */
export function refreshSession(): Promise<boolean> {
  if (!refreshRequest) {
    refreshRequest = withAuthLock(async () => {
      // Another tab may have rotated the shared cookies while we waited.
      if (typeof navigator !== "undefined" && navigator.locks) {
        const profile = await fetch("/api/v1/users/me", requestOptions);
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

/** Null means unauthenticated; service/network failures remain distinguishable. */
export function getCurrentUser(): Promise<AuthUser | null> {
  if (!profileRequest) {
    profileRequest = (async () => {
      let res = await fetch("/api/v1/users/me", requestOptions);
      if (res.status === 401) {
        if (!(await refreshSession())) return null;
        res = await fetch("/api/v1/users/me", requestOptions);
      }
      if (res.status === 401) return null;
      if (!res.ok)
        throw new Error("Không thể tải tài khoản. Vui lòng thử lại.");
      const data: unknown = await res.json();
      if (!isAuthUser(data))
        throw new Error("Thông tin tài khoản không hợp lệ.");
      return data;
    })().finally(() => {
      profileRequest = null;
    });
  }
  return profileRequest;
}

export async function logout(): Promise<boolean> {
  try {
    // Revoke the latest rotated token, and prevent refresh from restoring cookies.
    await profileRequest?.catch(() => null);
    await refreshRequest?.catch(() => false);
    const res = await withAuthLock(() => postAuth("logout"));
    return res.ok;
  } catch {
    return false;
  }
}

async function registrationError(res: Response) {
  const problem = await parseProblemDetail(res);
  const seconds = Number(res.headers.get("Retry-After"));
  const fieldViolations: Record<string, string> = {};
  const labels: Record<string, string> = {
    firstName: "Vui lòng nhập tên hợp lệ (tối đa 30 ký tự).",
    lastName: "Vui lòng nhập họ và tên đệm hợp lệ (tối đa 30 ký tự).",
    email: "Vui lòng nhập email hợp lệ.",
    otp: "Vui lòng nhập đủ 6 chữ số.",
    password: "Vui lòng kiểm tra lại mật khẩu.",
    newPassword: "Vui lòng kiểm tra lại mật khẩu mới.",
  };
  for (const violation of problem?.errors ?? []) {
    if (labels[violation.field])
      fieldViolations[violation.field] = labels[violation.field];
  }
  return {
    code: problem?.code ?? "SERVICE_UNAVAILABLE",
    message:
      res.status >= 500
        ? "Chưa thể hoàn tất yêu cầu. Vui lòng thử lại sau."
        : (problem?.detail ?? "Không thể hoàn tất yêu cầu. Vui lòng thử lại."),
    status: res.status,
    retryable: res.status >= 500 || res.status === 403,
    ...(res.status === 429
      ? {
          retryAfterSeconds:
            Number.isFinite(seconds) && seconds > 0 ? seconds : 60,
        }
      : {}),
    ...(Object.keys(fieldViolations).length ? { fieldViolations } : {}),
  };
}

function networkRegistrationError() {
  return {
    success: false as const,
    error: {
      code: "NETWORK_ERROR",
      message:
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.",
      retryable: true,
    },
  };
}

async function requestRegistrationChallenge(
  path: string,
  payload: object
): Promise<RegistrationResult> {
  try {
    const res = await postAuth(path, payload);
    if (!res.ok) return { success: false, error: await registrationError(res) };
    const data = (await res.json()) as Partial<RegistrationChallenge>;
    if (
      typeof data.registrationId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(data.registrationId) ||
      typeof data.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(data.expiresAt)) ||
      typeof data.resendAfterSeconds !== "number" ||
      !Number.isFinite(data.resendAfterSeconds) ||
      data.resendAfterSeconds < 0 ||
      typeof data.message !== "string"
    ) {
      return {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "Không thể xác nhận lượt đăng ký. Vui lòng thử lại.",
          retryable: true,
        },
      };
    }
    return { success: true, challenge: data as RegistrationChallenge };
  } catch {
    return networkRegistrationError();
  }
}

export function registerAccount(
  credentials: RegisterCredentials
): Promise<RegistrationResult> {
  return requestRegistrationChallenge("register", {
    email: credentials.email.trim(),
    firstName: credentials.firstName.trim(),
    lastName: credentials.lastName.trim(),
    password: credentials.password,
  });
}

export function resendRegistrationOtp(
  identity: RegistrationIdentity
): Promise<RegistrationResult> {
  return requestRegistrationChallenge("register/resend", {
    ...identity,
    email: identity.email.trim(),
  });
}

export async function verifyRegistrationOtp(
  identity: RegistrationIdentity & { otp: string }
): Promise<VerificationResult> {
  try {
    const res = await postAuth("register/verify", {
      ...identity,
      email: identity.email.trim(),
    });
    if (!res.ok) return { success: false, error: await registrationError(res) };
    return { success: true };
  } catch {
    return networkRegistrationError();
  }
}

export async function requestPasswordReset(
  email: string
): Promise<AuthActionResult<PasswordResetChallenge>> {
  try {
    const res = await postAuth("password/forgot", { email: email.trim() });
    if (!res.ok) return { success: false, error: await registrationError(res) };
    const data = (await res.json()) as Partial<PasswordResetChallenge>;
    if (
      typeof data.challengeId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(data.challengeId) ||
      typeof data.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(data.expiresAt)) ||
      typeof data.resendAfterSeconds !== "number" ||
      !Number.isFinite(data.resendAfterSeconds) ||
      data.resendAfterSeconds < 0 ||
      typeof data.message !== "string"
    )
      return invalidResetResponse();
    return { success: true, data: data as PasswordResetChallenge };
  } catch {
    return networkRegistrationError();
  }
}
export async function verifyPasswordResetOtp(input: {
  challengeId: string;
  email: string;
  otp: string;
}): Promise<AuthActionResult<PasswordResetGrant>> {
  try {
    const res = await postAuth("password/verify", {
      ...input,
      email: input.email.trim(),
    });
    if (!res.ok) return { success: false, error: await registrationError(res) };
    const data = (await res.json()) as Partial<PasswordResetGrant>;
    if (
      typeof data.resetToken !== "string" ||
      !/^[0-9a-f]{64}$/.test(data.resetToken) ||
      typeof data.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(data.expiresAt))
    )
      return invalidResetResponse();
    return { success: true, data: data as PasswordResetGrant };
  } catch {
    return networkRegistrationError();
  }
}
export async function resetPassword(input: {
  email: string;
  resetToken: string;
  newPassword: string;
}): Promise<VerificationResult> {
  try {
    const res = await postAuth("password/reset", {
      ...input,
      email: input.email.trim(),
    });
    if (!res.ok) return { success: false, error: await registrationError(res) };
    return { success: true };
  } catch {
    return networkRegistrationError();
  }
}
function invalidResetResponse() {
  return {
    success: false as const,
    error: {
      code: "INVALID_RESPONSE",
      message:
        "Không thể xác nhận yêu cầu khôi phục mật khẩu. Vui lòng thử lại.",
      retryable: true,
    },
  };
}
