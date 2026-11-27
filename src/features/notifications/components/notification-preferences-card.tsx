"use client";

import { useState, type FormEvent } from "react";
import { ErrorState } from "@/components/error-state";
import { useAuthSession } from "@/features/auth";
import { useApiResource } from "@/lib/use-api-resource";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  validatePreferences,
} from "../lib/notification-client";
import { useNotificationSave } from "../hooks/use-notification-save";
import type {
  NotificationPreferences,
  NotificationPreferencesInput,
} from "../types/notification";
import "../styles/notifications.css";

const loadPreferences = (signal: AbortSignal) =>
  fetchNotificationPreferences(signal);

export function NotificationPreferencesCard() {
  const { user, isLoading } = useAuthSession();
  if (isLoading) return <p role="status">Đang tải tùy chọn thông báo...</p>;
  if (!user?.roles.includes("LEARNER")) return null;
  return <PreferencesContent key={user.id} />;
}

function PreferencesContent() {
  const { data, error, isLoading, reload } = useApiResource(loadPreferences);
  if (!data)
    return error ? (
      <ErrorState
        message={error}
        onRetry={reload}
        idSuffix="-notification-preferences"
      />
    ) : (
      <p role="status">Đang tải tùy chọn thông báo...</p>
    );
  return (
    <PreferencesForm
      initial={data}
      key={data.updatedAt ?? "initial"}
      isLoading={isLoading}
    />
  );
}

function PreferencesForm({
  initial,
  isLoading,
}: {
  initial: NotificationPreferences;
  isLoading: boolean;
}) {
  const [draft, setDraft] = useState<NotificationPreferencesInput>(initial);
  const [validation, setValidation] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const { save, isSaving, error } = useNotificationSave(
    updateNotificationPreferences
  );
  const change = <K extends keyof NotificationPreferencesInput>(
    key: K,
    value: NotificationPreferencesInput[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setValidation(null);
    setNotice("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validatePreferences(draft);
    setValidation(invalid);
    setNotice("");
    if (invalid) return;
    const result = await save(draft);
    if (result) {
      setDraft(result);
      setNotice("Đã lưu tùy chọn thông báo.");
    }
  };
  return (
    <section
      id="notification-preferences"
      className="glass-card notification-card"
      aria-labelledby="notification-preferences-title"
    >
      <h2 id="notification-preferences-title">Nhắc học theo nhịp của bạn</h2>
      <p>
        Chọn kênh nhận tin và thời điểm phù hợp. Giờ yên lặng có thể qua nửa
        đêm.
      </p>
      <form onSubmit={submit} noValidate aria-busy={isSaving}>
        <fieldset
          className="notification-fields"
          disabled={isSaving || isLoading}
        >
          <legend className="sr-only">Tùy chọn thông báo</legend>
          <div className="notification-checks">
            <label>
              <input
                type="checkbox"
                name="inAppEnabled"
                checked={draft.inAppEnabled}
                onChange={(event) =>
                  change("inAppEnabled", event.target.checked)
                }
              />
              Nhận thông báo trong ứng dụng
            </label>
            <label>
              <input
                type="checkbox"
                name="emailEnabled"
                checked={draft.emailEnabled}
                onChange={(event) =>
                  change("emailEnabled", event.target.checked)
                }
              />
              Nhận nhắc học qua email
            </label>
            <label>
              <input
                type="checkbox"
                name="contentNotificationsEnabled"
                checked={draft.contentNotificationsEnabled}
                onChange={(event) =>
                  change("contentNotificationsEnabled", event.target.checked)
                }
              />
              Nhận tin khi có nội dung học mới
            </label>
          </div>
          <div className="notification-form-grid">
            <label>
              Giờ nhắc mỗi ngày (không bắt buộc)
              <input
                name="dailyReminderTime"
                type="time"
                step="60"
                value={draft.dailyReminderTime ?? ""}
                onChange={(event) =>
                  change("dailyReminderTime", event.target.value || null)
                }
              />
            </label>
            <label>
              Múi giờ
              <input
                name="timezone"
                value={draft.timezone}
                maxLength={60}
                required
                aria-describedby="notification-timezone-help"
                onChange={(event) => change("timezone", event.target.value)}
              />
            </label>
            <label>
              Bắt đầu giờ yên lặng
              <input
                name="quietHoursStart"
                type="time"
                step="60"
                value={draft.quietHoursStart ?? ""}
                onChange={(event) =>
                  change("quietHoursStart", event.target.value || null)
                }
              />
            </label>
            <label>
              Kết thúc giờ yên lặng
              <input
                name="quietHoursEnd"
                type="time"
                step="60"
                value={draft.quietHoursEnd ?? ""}
                onChange={(event) =>
                  change("quietHoursEnd", event.target.value || null)
                }
              />
            </label>
          </div>
          <small id="notification-timezone-help">
            Ví dụ: Asia/Ho_Chi_Minh hoặc Europe/Paris. Để trống cả hai giờ yên
            lặng nếu không dùng.
          </small>
          <button className="btn-primary" type="submit">
            {isSaving ? "Đang lưu..." : "Lưu tùy chọn thông báo"}
          </button>
        </fieldset>
        {(validation || error) && (
          <ErrorState message={validation || error!} variant="inline" />
        )}
        <p role="status">{notice}</p>
      </form>
    </section>
  );
}
