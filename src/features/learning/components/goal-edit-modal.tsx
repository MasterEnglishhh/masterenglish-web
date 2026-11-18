"use client";

import { useEffect, useRef } from "react";
import { Dialog } from "@/components/dialog";
import type { LearningGoal } from "../lib/goal-client";
import { useGoalForm } from "../hooks/use-goal-form";
import type { LearningGoalInput } from "../hooks/use-learning-goal";
import { GOAL_LIMITS } from "../lib/goal-validation";
import { GoalRangeField } from "./goal-range-field";

interface GoalEditModalProps {
  goal: LearningGoal | null;
  isOpen: boolean;
  isSubmitting: boolean;
  /** Lý do server từ chối (vd. 400/429/5xx), hiển thị trong hộp thoại. */
  serverError?: string | null;
  onClose: () => void;
  onSave: (input: LearningGoalInput) => Promise<boolean>;
}

const scorePresets = [450, 600, 750, 850, 900];
const minutePresets = [15, 30, 45, 60];

/**
 * Chỉ dựng biểu mẫu khi hộp thoại mở. Mỗi lần mở là một lần mount mới nên giá trị
 * khởi tạo luôn lấy từ mục tiêu đã lưu, không còn sót chỉnh sửa chưa lưu của lần trước.
 */
export function GoalEditModal(props: GoalEditModalProps) {
  if (!props.isOpen) return null;
  return <GoalEditDialog {...props} />;
}

function GoalEditDialog({
  goal,
  isSubmitting,
  serverError,
  onClose,
  onSave,
}: GoalEditModalProps) {
  const form = useGoalForm(goal, onSave);
  const firstControl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstControl.current?.focus();
  }, []);

  return (
    <Dialog
      kicker="KẾ HOẠCH HỌC TẬP"
      title={goal ? "Cập nhật Mục tiêu TOEIC" : "Thiết lập Mục tiêu TOEIC"}
      description={
        <p className="goal-modal-note">
          Đặt mục tiêu điểm số và cam kết thời gian mỗi ngày giúp hệ thống tối
          ưu hóa thuật toán lặp lại ngắt quãng (SRS).
        </p>
      }
      busy={isSubmitting}
      onClose={onClose}
    >
      {serverError && (
        <div role="alert" className="form-alert-error">
          {serverError}
        </div>
      )}

      <form onSubmit={form.submit} noValidate className="goal-form">
        <GoalRangeField
          id="targetScoreInput"
          errorId="targetScoreError"
          label="Điểm TOEIC mục tiêu:"
          display={
            <span className="goal-field-value goal-field-value-accent" aria-hidden="true">
              {form.targetScore} <small>/ {GOAL_LIMITS.maxScore}</small>
            </span>
          }
          min={GOAL_LIMITS.minScore}
          max={GOAL_LIMITS.maxScore}
          step={GOAL_LIMITS.scoreStep}
          value={form.targetScore}
          onChange={form.setTargetScore}
          valueText={`${form.targetScore} trên ${GOAL_LIMITS.maxScore} điểm`}
          error={form.errors.targetScore}
          presetsLabel="Chọn nhanh:"
          presets={scorePresets}
          inputRef={firstControl}
        />

        <GoalRangeField
          id="dailyMinutesInput"
          errorId="dailyMinutesError"
          label="Thời gian học mỗi ngày:"
          display={
            <span className="goal-field-value" aria-hidden="true">
              {form.dailyMinutes} <small>phút / ngày</small>
            </span>
          }
          min={GOAL_LIMITS.minMinutes}
          max={GOAL_LIMITS.maxMinutes}
          step={5}
          value={form.dailyMinutes}
          onChange={form.setDailyMinutes}
          valueText={`${form.dailyMinutes} phút mỗi ngày`}
          error={form.errors.dailyMinutes}
          presetsLabel="Gợi ý:"
          presets={minutePresets}
          presetText={(minutes) => `${minutes} phút`}
        />

        {/* Ngày mục tiêu */}
        <div className="goal-field">
          <label htmlFor="targetDateInput" className="field-label">
            Ngày dự kiến thi / Hoàn thành mục tiêu (Tùy chọn):
          </label>
          <input
            id="targetDateInput"
            type="date"
            min={form.todayStr}
            className="field-input"
            value={form.targetDate}
            aria-invalid={Boolean(form.errors.targetDate)}
            aria-describedby={
              form.errors.targetDate ? "targetDateError" : undefined
            }
            onChange={(event) => form.setTargetDate(event.target.value)}
          />
          {form.errors.targetDate && (
            <small id="targetDateError" role="alert" className="field-error">
              {form.errors.targetDate}
            </small>
          )}
        </div>

        <div className="goal-form-actions">
          <button
            type="button"
            className="btn-ghost btn-sm"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="btn-lime btn-sm"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu mục tiêu"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
