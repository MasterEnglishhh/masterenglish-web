import {
  requestJson,
  type HttpOutcome,
  type PageResponse,
} from "../../../lib/http.ts";
import { isPageResponse, isUuid } from "../../../lib/api-validation.ts";
import {
  isAdminDelivery,
  isAdminHistory,
  isNotification,
  isPreferences,
  isReminderHistory,
  isReminderRule,
  isUnreadCount,
  validatePreferences,
} from "./notification-validation.ts";
import type {
  AdminDelivery,
  AdminReminderHistory,
  NotificationFilters,
  NotificationItem,
  NotificationPreferences,
  NotificationPreferencesInput,
  ReminderHistory,
  ReminderRule,
} from "../types/notification.ts";

export { validatePreferences } from "./notification-validation.ts";
const learner = "/api/v1/notifications";
const admin = "/api/v1/admin/notifications";
const invalid = (message: string): HttpOutcome<never> => ({
  ok: false,
  reason: "http",
  status: 400,
  problem: { code: "VALIDATION_ERROR", detail: message },
  retryAfterSeconds: null,
});
const query = (
  filters: NotificationFilters,
  keys: (keyof NotificationFilters)[]
) => {
  const params = new URLSearchParams();
  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.size ? `?${params}` : "";
};
const paging: (keyof NotificationFilters)[] = ["page", "size"];
const range: (keyof NotificationFilters)[] = [
  "type",
  "status",
  "from",
  "to",
  ...paging,
];

export function fetchNotifications(
  filters: NotificationFilters = {},
  signal?: AbortSignal
) {
  return requestJson<PageResponse<NotificationItem>>(
    `${learner}${query(filters, ["type", "unreadOnly", ...paging])}`,
    { signal, validate: (data) => isPageResponse(data, isNotification) }
  );
}
export function fetchUnreadCount(signal?: AbortSignal) {
  return requestJson<{ count: number }>(`${learner}/unread-count`, {
    signal,
    validate: isUnreadCount,
  });
}
export function markNotificationRead(id: string, signal?: AbortSignal) {
  if (!isUuid(id))
    return Promise.resolve(invalid("Mã thông báo không hợp lệ."));
  return requestJson<void>(`${learner}/${encodeURIComponent(id)}/read`, {
    method: "POST",
    signal,
    validate: (data) => data === undefined,
  });
}
export function markAllNotificationsRead(signal?: AbortSignal) {
  return requestJson<void>(`${learner}/read-all`, {
    method: "POST",
    signal,
    validate: (data) => data === undefined,
  });
}
export function fetchNotificationPreferences(signal?: AbortSignal) {
  return requestJson<NotificationPreferences>(`${learner}/preferences`, {
    signal,
    validate: isPreferences,
  });
}
export function updateNotificationPreferences(
  body: NotificationPreferencesInput,
  signal?: AbortSignal
) {
  const error = validatePreferences(body);
  if (error) return Promise.resolve(invalid(error));
  const {
    inAppEnabled,
    emailEnabled,
    contentNotificationsEnabled,
    dailyReminderTime,
    timezone,
    quietHoursStart,
    quietHoursEnd,
  } = body;
  return requestJson<NotificationPreferences>(`${learner}/preferences`, {
    method: "PUT",
    body: {
      inAppEnabled,
      emailEnabled,
      contentNotificationsEnabled,
      dailyReminderTime,
      timezone,
      quietHoursStart,
      quietHoursEnd,
    },
    signal,
    validate: isPreferences,
  });
}
export function fetchReminderHistory(
  filters: NotificationFilters = {},
  signal?: AbortSignal
) {
  return requestJson<PageResponse<ReminderHistory>>(
    `${learner}/reminders/history${query(filters, [...range, "ruleCode"])}`,
    { signal, validate: (data) => isPageResponse(data, isReminderHistory) }
  );
}
export function fetchAdminDeliveries(
  filters: NotificationFilters = {},
  signal?: AbortSignal
) {
  return requestJson<PageResponse<AdminDelivery>>(
    `${admin}/deliveries${query(filters, [...range, "channel"])}`,
    { signal, validate: (data) => isPageResponse(data, isAdminDelivery) }
  );
}
export function fetchAdminReminderHistory(
  filters: NotificationFilters = {},
  signal?: AbortSignal
) {
  return requestJson<PageResponse<AdminReminderHistory>>(
    `${admin}/history${query(filters, [...range, "userId", "ruleId"])}`,
    { signal, validate: (data) => isPageResponse(data, isAdminHistory) }
  );
}
export function fetchReminderRules(signal?: AbortSignal) {
  return requestJson<ReminderRule[]>(`${admin}/rules`, {
    signal,
    validate: (data) => Array.isArray(data) && data.every(isReminderRule),
  });
}
export function updateReminderRule(
  id: string,
  body: Pick<ReminderRule, "enabled" | "minimumGapMinutes">,
  signal?: AbortSignal
) {
  if (
    !isUuid(id) ||
    typeof body.enabled !== "boolean" ||
    !Number.isInteger(body.minimumGapMinutes) ||
    body.minimumGapMinutes < 0 ||
    body.minimumGapMinutes > 43200
  )
    return Promise.resolve(
      invalid("Khoảng cách nhắc phải là số phút nguyên từ 0 đến 43200.")
    );
  return requestJson<ReminderRule>(`${admin}/rules/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { enabled: body.enabled, minimumGapMinutes: body.minimumGapMinutes },
    signal,
    validate: isReminderRule,
  });
}
