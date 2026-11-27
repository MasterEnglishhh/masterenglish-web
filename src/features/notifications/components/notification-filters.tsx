"use client";

import { useState, type FormEvent } from "react";
import { ErrorState } from "@/components/error-state";
import { isUuid } from "@/lib/api-validation";
import type { NotificationFilters } from "../types/notification";
import {
  deliveryChannels,
  deliveryStatuses,
  notificationTypes,
} from "../lib/notification-validation";

export const typeLabels: Record<string, string> = {
  REVIEW_DUE: "Đến hạn ôn tập",
  DAILY_GOAL: "Mục tiêu mỗi ngày",
  CONTENT_NEW: "Nội dung mới",
  SYSTEM: "Hệ thống",
  SECURITY: "Bảo mật",
};
export const statusLabels: Record<string, string> = {
  PENDING: "Đang chờ",
  PROCESSING: "Đang xử lý",
  SENT: "Đã gửi",
  FAILED: "Gửi thất bại",
};
export const channelLabels: Record<string, string> = {
  IN_APP: "Trong ứng dụng",
  EMAIL: "Email",
};

type Mode = "feed" | "learnerHistory" | "deliveries" | "adminHistory";
export function NotificationFiltersForm({
  mode,
  busy,
  onApply,
}: {
  mode: Mode;
  busy: boolean;
  onApply: (filters: NotificationFilters) => void;
}) {
  const [draft, setDraft] = useState({
    type: "",
    status: "",
    channel: "",
    ruleCode: "",
    ruleId: "",
    userId: "",
    from: "",
    to: "",
    unreadOnly: false,
  });
  const [error, setError] = useState<string | null>(null);
  const update = (key: string, value: string | boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      mode === "adminHistory" &&
      [draft.userId, draft.ruleId].some((value) => value && !isUuid(value))
    ) {
      setError("Mã người dùng và quy tắc cần là UUID hợp lệ.");
      return;
    }
    const from = draft.from ? new Date(draft.from) : null;
    const to = draft.to ? new Date(draft.to) : null;
    if (
      (from && !Number.isFinite(from.getTime())) ||
      (to && !Number.isFinite(to.getTime())) ||
      (from && to && from > to)
    ) {
      setError(
        "Khoảng thời gian không hợp lệ: thời điểm bắt đầu cần trước hoặc bằng kết thúc."
      );
      return;
    }
    setError(null);
    onApply({
      ...draft,
      page: 0,
      from: from?.toISOString(),
      to: to?.toISOString(),
    });
  };
  const types =
    mode === "deliveries"
      ? notificationTypes
      : notificationTypes.filter((type) => type !== "SECURITY");
  return (
    <form
      className="glass-card notification-card notification-filter"
      onSubmit={submit}
      noValidate
      aria-label="Bộ lọc thông báo"
    >
      <fieldset className="notification-fields" disabled={busy}>
        <legend>Bộ lọc</legend>
        <div className="notification-form-grid">
          <label>
            Loại thông báo
            <select
              name="type"
              value={draft.type}
              onChange={(event) => update("type", event.target.value)}
            >
              <option value="">Tất cả loại</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          {mode !== "feed" && (
            <label>
              Trạng thái gửi
              <select
                name="status"
                value={draft.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {deliveryStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {mode === "deliveries" && (
            <label>
              Kênh gửi
              <select
                name="channel"
                value={draft.channel}
                onChange={(event) => update("channel", event.target.value)}
              >
                <option value="">Tất cả kênh</option>
                {deliveryChannels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channelLabels[channel]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {mode === "learnerHistory" && (
            <label>
              Mã quy tắc
              <input
                name="ruleCode"
                value={draft.ruleCode}
                onChange={(event) => update("ruleCode", event.target.value)}
              />
            </label>
          )}
          {mode === "adminHistory" && (
            <>
              <label>
                UUID người dùng
                <input
                  name="userId"
                  value={draft.userId}
                  onChange={(event) => update("userId", event.target.value)}
                />
              </label>
              <label>
                UUID quy tắc
                <input
                  name="ruleId"
                  value={draft.ruleId}
                  onChange={(event) => update("ruleId", event.target.value)}
                />
              </label>
            </>
          )}
          {mode !== "feed" && (
            <>
              <label>
                Từ thời điểm
                <input
                  name="from"
                  type="datetime-local"
                  value={draft.from}
                  onChange={(event) => update("from", event.target.value)}
                />
              </label>
              <label>
                Đến thời điểm
                <input
                  name="to"
                  type="datetime-local"
                  value={draft.to}
                  onChange={(event) => update("to", event.target.value)}
                />
              </label>
            </>
          )}
        </div>
        {mode === "feed" ? (
          <label className="notification-check">
            <input
              name="unreadOnly"
              type="checkbox"
              checked={draft.unreadOnly}
              onChange={(event) => update("unreadOnly", event.target.checked)}
            />
            Chỉ thông báo chưa đọc
          </label>
        ) : (
          <small>Thời điểm theo múi giờ trên thiết bị của bạn.</small>
        )}
        <button type="submit" className="btn-ghost">
          Áp dụng bộ lọc
        </button>
      </fieldset>
      {error && <ErrorState message={error} variant="inline" />}
    </form>
  );
}
