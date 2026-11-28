export type NotificationType =
  "REVIEW_DUE" | "DAILY_GOAL" | "CONTENT_NEW" | "SYSTEM" | "SECURITY";
export type DeliveryChannel = "IN_APP" | "EMAIL";
export type DeliveryStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targetUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferencesInput {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  contentNotificationsEnabled: boolean;
  dailyReminderTime: string | null;
  timezone: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}
export interface NotificationPreferences extends NotificationPreferencesInput {
  updatedAt: string | null;
}

export interface DeliveryOutcome {
  channel: DeliveryChannel;
  status: DeliveryStatus;
  attemptCount: number;
  lastFailureCode: string | null;
  sentAt: string | null;
  finishedAt: string | null;
}
export interface ReminderHistory extends Omit<NotificationItem, "id"> {
  notificationId: string;
  ruleCode: string | null;
  deliveries: DeliveryOutcome[];
}
export interface AdminDelivery extends DeliveryOutcome {
  id: string;
  notificationId: string;
  userId: string;
  type: NotificationType;
  nextRetryAt: string | null;
  providerMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface AdminReminderHistory {
  notificationId: string;
  userId: string;
  type: NotificationType;
  reminderRuleId: string | null;
  reminderRuleCode: string | null;
  targetUrl: string | null;
  readAt: string | null;
  createdAt: string;
  deliveries: DeliveryOutcome[];
}
export interface ReminderRule {
  id: string;
  code: string;
  enabled: boolean;
  minimumGapMinutes: number;
  createdAt: string;
}
export interface NotificationFilters {
  page?: number;
  size?: number;
  type?: string;
  unreadOnly?: boolean;
  status?: string;
  channel?: string;
  ruleCode?: string;
  ruleId?: string;
  userId?: string;
  from?: string;
  to?: string;
}
