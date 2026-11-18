"use client";

import type { ReactNode, Ref } from "react";

export const labelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--ink)",
} as const;
export const errorStyle = {
  display: "block",
  marginTop: 4,
  fontSize: 12,
  fontWeight: 600,
  color: "#991b1b",
} as const;

interface GoalRangeFieldProps {
  id: string;
  errorId: string;
  label: string;
  /** Giá trị đang chọn, hiển thị bên phải nhãn (nơi gọi tự định dạng). */
  display: ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Mô tả giá trị cho trình đọc màn hình, vd. "750 trên 990 điểm". */
  valueText: string;
  error?: string;
  presetsLabel: string;
  presets: readonly number[];
  presetText?: (value: number) => string;
  inputRef?: Ref<HTMLInputElement>;
}

/** Thanh trượt có nhãn, thông báo lỗi và các nút chọn nhanh. */
export function GoalRangeField({
  id,
  errorId,
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
  valueText,
  error,
  presetsLabel,
  presets,
  presetText = String,
  inputRef,
}: GoalRangeFieldProps) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
        {display}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%", accentColor: "var(--indigo)" }}
      />
      {error && (
        <small id={errorId} role="alert" style={errorStyle}>
          {error}
        </small>
      )}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--muted)",
            alignSelf: "center",
            marginRight: 4,
          }}
        >
          {presetsLabel}
        </span>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={value === preset}
            className={
              value === preset ? "btn-3d-lime btn-sm" : "btn-3d-outline btn-sm"
            }
            style={{ padding: "3px 8px", fontSize: 11 }}
            onClick={() => onChange(preset)}
          >
            {presetText(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}
