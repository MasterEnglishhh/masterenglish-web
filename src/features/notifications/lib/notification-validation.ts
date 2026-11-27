import { isRecord, isUuid } from "../../../lib/api-validation.ts";
import type { NotificationPreferencesInput } from "../types/notification.ts";

export const notificationTypes = [
  "REVIEW_DUE",
  "DAILY_GOAL",
  "CONTENT_NEW",
  "SYSTEM",
  "SECURITY",
] as const;
export const deliveryStatuses = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "FAILED",
] as const;
export const deliveryChannels = ["IN_APP", "EMAIL"] as const;
const member = (value: unknown, options: readonly string[]) =>
  typeof value === "string" && options.includes(value);
const textOrNull = (value: unknown) =>
  value === null || typeof value === "string";
const instant = (value: unknown) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  Number.isFinite(Date.parse(value));
const nullableInstant = (value: unknown) => value === null || instant(value);
const integer = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const time = (value: unknown) =>
  value === null ||
  (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));

export function validatePreferences(
  value: NotificationPreferencesInput
): string | null {
  if (
    ![
      value.inAppEnabled,
      value.emailEnabled,
      value.contentNotificationsEnabled,
    ].every((v) => typeof v === "boolean")
  )
    return "Vui lòng chọn đầy đủ các tùy chọn thông báo.";
  if (
    ![
      value.dailyReminderTime,
      value.quietHoursStart,
      value.quietHoursEnd,
    ].every(time)
  )
    return "Giờ nhắc cần theo định dạng HH:mm.";
  if (
    (value.quietHoursStart === null) !== (value.quietHoursEnd === null) ||
    (value.quietHoursStart !== null &&
      value.quietHoursStart === value.quietHoursEnd)
  )
    return "Giờ yên lặng cần đủ giờ bắt đầu và kết thúc khác nhau.";
  if (
    typeof value.timezone !== "string" ||
    value.timezone.length > 60 ||
    value.timezone !== value.timezone.trim() ||
    !value.timezone ||
    /^(?:[+-]|SystemV\/|(?:UTC|GMT)[+-])/.test(value.timezone) ||
    ["EST5EDT", "CST6CDT", "MST7MDT", "PST8PDT"].includes(value.timezone)
  )
    return "Chọn múi giờ IANA hợp lệ, ví dụ Asia/Ho_Chi_Minh.";
  try {
    new Intl.DateTimeFormat("vi-VN", { timeZone: value.timezone });
  } catch {
    return "Chọn múi giờ IANA hợp lệ, ví dụ Asia/Ho_Chi_Minh.";
  }
  return null;
}

export function isPreferences(value: unknown): boolean {
  return (
    isRecord(value) &&
    validatePreferences(value as unknown as NotificationPreferencesInput) ===
      null &&
    nullableInstant(value.updatedAt)
  );
}

function notificationFields(value: Record<string, unknown>) {
  return (
    member(value.type, notificationTypes) &&
    value.type !== "SECURITY" &&
    typeof value.title === "string" &&
    typeof value.body === "string" &&
    textOrNull(value.targetUrl) &&
    nullableInstant(value.readAt) &&
    instant(value.createdAt)
  );
}
export function isNotification(value: unknown): boolean {
  return isRecord(value) && isUuid(value.id) && notificationFields(value);
}
export function isUnreadCount(value: unknown): boolean {
  return isRecord(value) && integer(value.count);
}
export function isDeliveryOutcome(value: unknown): boolean {
  return (
    isRecord(value) &&
    member(value.channel, deliveryChannels) &&
    member(value.status, deliveryStatuses) &&
    integer(value.attemptCount) &&
    textOrNull(value.lastFailureCode) &&
    nullableInstant(value.sentAt) &&
    nullableInstant(value.finishedAt)
  );
}
export function isReminderHistory(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.notificationId) &&
    notificationFields(value) &&
    textOrNull(value.ruleCode) &&
    Array.isArray(value.deliveries) &&
    value.deliveries.every(isDeliveryOutcome)
  );
}
export function isAdminDelivery(value: unknown): boolean {
  return (
    isRecord(value) &&
    isDeliveryOutcome(value) &&
    [value.id, value.notificationId, value.userId].every(isUuid) &&
    member(value.type, notificationTypes) &&
    nullableInstant(value.nextRetryAt) &&
    textOrNull(value.providerMessageId) &&
    instant(value.createdAt) &&
    instant(value.updatedAt)
  );
}
export function isAdminHistory(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.notificationId) &&
    isUuid(value.userId) &&
    (value.reminderRuleId === null || isUuid(value.reminderRuleId)) &&
    textOrNull(value.reminderRuleCode) &&
    member(value.type, notificationTypes) &&
    value.type !== "SECURITY" &&
    textOrNull(value.targetUrl) &&
    nullableInstant(value.readAt) &&
    instant(value.createdAt) &&
    Array.isArray(value.deliveries) &&
    value.deliveries.every(isDeliveryOutcome)
  );
}
export function isReminderRule(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.code === "string" &&
    typeof value.enabled === "boolean" &&
    integer(value.minimumGapMinutes) &&
    value.minimumGapMinutes <= 43200 &&
    instant(value.createdAt)
  );
}
