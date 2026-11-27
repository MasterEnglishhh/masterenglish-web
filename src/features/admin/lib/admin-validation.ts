import { isRecord, isUuid } from "../../../lib/api-validation.ts";
import type { AdminUser } from "../types/user-management";
import type { FeatureFlag } from "../types/system-policy";

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);
const isCount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;
const isDate = (value: unknown) =>
  isString(value) && Number.isFinite(Date.parse(value));
const isNullable = (value: unknown, check: (value: unknown) => boolean) =>
  value == null || check(value);
const isOneOf = (value: unknown, ...choices: string[]) =>
  isString(value) && choices.includes(value);

export function isAdminUser(value: unknown): value is AdminUser {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    [value.email, value.displayName].every(isString) &&
    [value.firstName, value.lastName, value.phone, value.lockReason].every(
      (field) => isNullable(field, isString)
    ) &&
    [value.lastLoginAt, value.lockedUntil].every((field) =>
      isNullable(field, isDate)
    ) &&
    isOneOf(
      value.status,
      "ACTIVE",
      "LOCKED",
      "DISABLED",
      "PENDING_VERIFICATION"
    ) &&
    Array.isArray(value.roles) &&
    value.roles.every((role) =>
      isOneOf(role, "LEARNER", "CONTENT_ADMIN", "SYSTEM_ADMIN")
    ) &&
    isCount(value.authVersion) &&
    isCount(value.activeSessionsCount) &&
    isDate(value.createdAt)
  );
}

export function isAdminKpi(value: unknown) {
  return (
    isRecord(value) &&
    [value.id, value.title, value.value].every(isString) &&
    isNullable(value.subValue, isString) &&
    isNullable(value.trendText, isString) &&
    isNullable(value.changePercent, isNumber) &&
    isNullable(value.trendDirection, (direction) =>
      isOneOf(direction, "up", "down", "neutral")
    ) &&
    isOneOf(
      value.iconName,
      "users",
      "book-open",
      "database",
      "shield-check",
      "cpu",
      "sparkles"
    )
  );
}

export function isRecentActivity(value: unknown) {
  return (
    isRecord(value) &&
    [
      value.id,
      value.actorEmail,
      value.actorName,
      value.action,
      value.target,
    ].every(isString) &&
    isOneOf(value.module, "IDENTITY", "CONTENT", "SYSTEM", "SECURITY") &&
    isDate(value.timestamp) &&
    isOneOf(value.status, "SUCCESS", "WARNING", "INFO")
  );
}

const isRevisionStatus = (value: unknown) =>
  isOneOf(
    value,
    "DRAFT",
    "IN_REVIEW",
    "APPROVED",
    "REJECTED",
    "PUBLISHED",
    "ARCHIVED"
  );

export function isContentItem(value: unknown) {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    [value.title, value.code, value.summary, value.author].every(isString) &&
    value.module === "VOCABULARY" &&
    isOneOf(value.type, "WORD", "DECK") &&
    isRevisionStatus(value.status) &&
    isCount(value.versionNo) &&
    isDate(value.updatedAt) &&
    isNullable(value.reviewer, isString) &&
    isNullable(value.level, isString) &&
    isNullable(value.latestRevisionId, isUuid)
  );
}

export function isAdminRevision(value: unknown) {
  return (
    isRecord(value) &&
    isUuid(value.revisionId) &&
    isUuid(value.contentItemId) &&
    isRevisionStatus(value.status) &&
    isCount(value.versionNo) &&
    isNullable(value.reviewNote, isString) &&
    isNullable(value.publishedAt, isDate) &&
    isDate(value.updatedAt)
  );
}

export function isAdminMessage(value: unknown) {
  return isRecord(value) && isString(value.message);
}

export function isFeatureFlag(value: unknown): value is FeatureFlag {
  return (
    isRecord(value) &&
    [value.key, value.name, value.description].every(isString) &&
    typeof value.enabled === "boolean" &&
    isString(value.category) &&
    isDate(value.updatedAt)
  );
}

export function isStorageQuota(value: unknown) {
  return (
    isRecord(value) &&
    [value.bucket, value.usedFormatted, value.limitFormatted].every(isString) &&
    [value.usedBytes, value.maxBytes, value.filesCount].every(isCount) &&
    isNumber(value.percentUsed)
  );
}

export function isAiQuotaMetric(value: unknown) {
  return (
    isRecord(value) &&
    [value.provider, value.model].every(isString) &&
    [value.dailyTokenUsage, value.dailyTokenLimit, value.resetHours].every(
      isCount
    ) &&
    isNumber(value.percentUsed)
  );
}

export function isAuditLogEntry(value: unknown) {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    [value.actorEmail, value.action, value.details, value.entityType].every(
      isString
    ) &&
    isNullable(value.entityId, isUuid) &&
    isNullable(value.ipAddress, isString) &&
    isDate(value.timestamp) &&
    isOneOf(value.severity, "INFO", "WARNING", "CRITICAL")
  );
}

export function isContentSource(value: unknown) {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    [value.title, value.sourceType, value.status].every(isString) &&
    [value.licenseCode, value.sourceUrl, value.author].every((field) =>
      isNullable(field, isString)
    ) &&
    isDate(value.createdAt)
  );
}
