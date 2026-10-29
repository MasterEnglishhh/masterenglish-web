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

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface RegistrationChallenge {
  registrationId: string;
  expiresAt: string;
  resendAfterSeconds: number;
  message: string;
}

export interface RegistrationIdentity {
  registrationId: string;
  email: string;
}

export type RegistrationResult =
  | { success: true; challenge: RegistrationChallenge }
  | { success: false; error: AuthError };

export type VerificationResult =
  { success: true } | { success: false; error: AuthError };

export interface PasswordResetChallenge {
  challengeId: string;
  expiresAt: string;
  resendAfterSeconds: number;
  message: string;
}
export interface PasswordResetGrant {
  resetToken: string;
  expiresAt: string;
}
export type AuthActionResult<T> =
  { success: true; data: T } | { success: false; error: AuthError };

export type FormStatus = "idle" | "submitting" | "success" | "error";

export interface LoginFormState {
  values: LoginCredentials;
  errors: Partial<Record<keyof LoginCredentials, string>>;
  status: FormStatus;
  serverError: AuthError | null;
  cooldownSeconds: number;
}
