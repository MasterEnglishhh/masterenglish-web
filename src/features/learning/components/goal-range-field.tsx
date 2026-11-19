"use client";

import type { ReactNode, Ref } from "react";

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
    <div className="goal-field">
      <div className="goal-field-head">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {display}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="range"
        className="goal-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {error && (
        <small id={errorId} role="alert" className="field-error">
          {error}
        </small>
      )}
      <div className="goal-presets">
        <span>{presetsLabel}</span>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={value === preset}
            className={value === preset ? "btn-lime btn-sm" : "btn-ghost btn-sm"}
            onClick={() => onChange(preset)}
          >
            {presetText(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}
