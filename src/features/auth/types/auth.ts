export type AuthMode = "login" | "register" | "forgot";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  phone: string | null;
  avatarMediaId: string | null;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp?: string;
}

export interface AuthError {
  code: string;
  message: string;
  status?: number;
  retryable?: boolean;
  retryAfterSeconds?: number;
  fieldViolations?: Record<string, string>;
}

export type AuthResult =
  { success: true; user: AuthUser } | { success: false; error: AuthError };

export type FormStatus = "idle" | "submitting" | "success" | "error";

export interface LoginFormState {
  values: LoginCredentials;
  errors: Partial<Record<keyof LoginCredentials, string>>;
  status: FormStatus;
  serverError: AuthError | null;
  cooldownSeconds: number;
}
