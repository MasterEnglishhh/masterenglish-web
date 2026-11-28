"use client";

import { useState, type FormEvent } from "react";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { useApiResource } from "@/lib/use-api-resource";
import { useNotificationSave } from "../hooks/use-notification-save";
import {
  fetchReminderRules,
  updateReminderRule,
} from "../lib/notification-client";
import type { ReminderRule } from "../types/notification";

const loadRules = (signal: AbortSignal) => fetchReminderRules(signal);

export function ReminderRules() {
  const { data, error, isLoading, reload } = useApiResource(loadRules);
  return (
    <section aria-label="Quy tắc nhắc học" aria-busy={isLoading}>
      <div className="notification-toolbar">
        <h2>Quy tắc nhắc học</h2>
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={isLoading}
          onClick={reload}
        >
          Tải lại quy tắc
        </button>
      </div>
      <p>
        Mỗi quy tắc có thể bật/tắt và đặt khoảng cách tối thiểu giữa hai lần
        nhắc.
      </p>
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      {isLoading ? (
        <p role="status">Đang tải quy tắc...</p>
      ) : data?.length === 0 ? (
        <EmptyState title="Chưa có quy tắc nhắc học" />
      ) : (
        <div className="notification-rule-grid">
          {data?.map((rule) => (
            <RuleForm
              key={`${rule.id}:${rule.enabled}:${rule.minimumGapMinutes}`}
              rule={rule}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RuleForm({ rule }: { rule: ReminderRule }) {
  const [enabled, setEnabled] = useState(rule.enabled);
  const [gap, setGap] = useState(String(rule.minimumGapMinutes));
  const [validation, setValidation] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const { save, error, isSaving } = useNotificationSave(
    (body: Pick<ReminderRule, "enabled" | "minimumGapMinutes">, signal) =>
      updateReminderRule(rule.id, body, signal)
  );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    if (!/^\d+$/.test(gap) || Number(gap) > 43200) {
      setValidation("Khoảng cách nhắc phải là số phút nguyên từ 0 đến 43200.");
      return;
    }
    setValidation(null);
    const saved = await save({ enabled, minimumGapMinutes: Number(gap) });
    if (saved) {
      setEnabled(saved.enabled);
      setGap(String(saved.minimumGapMinutes));
      setNotice("Đã lưu quy tắc.");
    }
  };
  return (
    <form
      className="glass-card notification-card"
      onSubmit={submit}
      aria-busy={isSaving}
      noValidate
    >
      <fieldset className="notification-fields" disabled={isSaving}>
        <legend>
          <strong>{rule.code}</strong>
        </legend>
        <label className="notification-check">
          <input
            type="checkbox"
            name="enabled"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              setNotice("");
            }}
          />
          Bật quy tắc
        </label>
        <label>
          Khoảng cách tối thiểu (phút)
          <input
            type="number"
            name="minimumGapMinutes"
            min="0"
            max="43200"
            step="1"
            required
            value={gap}
            onChange={(event) => {
              setGap(event.target.value);
              setNotice("");
            }}
          />
        </label>
        <small>Từ 0 đến 43200 phút (30 ngày).</small>
        <button type="submit" className="btn-primary">
          {isSaving ? "Đang lưu..." : "Lưu quy tắc"}
        </button>
      </fieldset>
      {(validation || error) && (
        <ErrorState message={validation || error!} variant="inline" />
      )}
      <p role="status">{notice}</p>
    </form>
  );
}
