export type UserRole = "LEARNER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN";
export type UserStatus = "ACTIVE" | "LOCKED" | "DISABLED" | "PENDING_VERIFICATION";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: UserStatus;
  roles: UserRole[];
  authVersion: number;
  activeSessionsCount: number;
  createdAt: string;
  lastLoginAt: string | null;
  lockReason?: string;
  lockedUntil?: string | null;
}

export interface UserFilterState {
  search: string;
  role: UserRole | "ALL";
  status: UserStatus | "ALL";
  page: number;
  pageSize: number;
}
