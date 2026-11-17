"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { LearningGoal } from "@/features/auth/lib/account-client";
import type { LearningGoalInput } from "../hooks/use-learning-goal";
import {
  GOAL_LIMITS,
  toLocalIsoDate,
  validateGoalInput,
  type GoalFieldErrors,
} from "../lib/goal-validation";

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
const labelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--ink)",
} as const;
const errorStyle = {
  display: "block",
  marginTop: 4,
  fontSize: 12,
  fontWeight: 600,
  color: "#991b1b",
} as const;

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
  const titleId = useId();
  const [targetScore, setTargetScore] = useState<number>(
    goal?.targetScore ?? 650
  );
  const [dailyMinutes, setDailyMinutes] = useState<number>(
    goal?.dailyMinutes ?? 30
  );
  const [targetDate, setTargetDate] = useState<string>(goal?.targetDate ?? "");
  const [errors, setErrors] = useState<GoalFieldErrors>({});
  const firstControl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstControl.current?.focus();
  }, []);

  // Đóng bằng phím Escape (không đóng khi đang gửi để tránh mất kết quả).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const todayStr = toLocalIsoDate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateGoalInput(
      { targetScore, dailyMinutes, targetDate },
      todayStr
    );
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    // Thành công: hook đóng hộp thoại; thất bại: giữ lại để hiện `serverError`.
    await onSave(result.value);
  };

  return (
    <div
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="admin-modal" style={{ maxWidth: 540 }}>
        <div>
          <span className="admin-kicker">KẾ HOẠCH HỌC TẬP</span>
          <h2 id={titleId} className="admin-modal-title">
            {goal ? "Cập nhật Mục tiêu TOEIC" : "Thiết lập Mục tiêu TOEIC"}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            Đặt mục tiêu điểm số và cam kết thời gian mỗi ngày giúp hệ thống tối
            ưu hóa thuật toán lặp lại ngắt quãng (SRS).
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            style={{
              background: "#fee2e2",
              border: "1px solid #f87171",
              color: "#991b1b",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Điểm mục tiêu */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <label htmlFor="targetScoreInput" style={labelStyle}>
                Điểm TOEIC mục tiêu:
              </label>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--indigo)",
                }}
                aria-hidden="true"
              >
                {targetScore}{" "}
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  / {GOAL_LIMITS.maxScore}
                </span>
              </span>
            </div>
            <input
              ref={firstControl}
              id="targetScoreInput"
              type="range"
              min={GOAL_LIMITS.minScore}
              max={GOAL_LIMITS.maxScore}
              step={GOAL_LIMITS.scoreStep}
              value={targetScore}
              aria-valuetext={`${targetScore} trên ${GOAL_LIMITS.maxScore} điểm`}
              aria-invalid={Boolean(errors.targetScore)}
              aria-describedby={
                errors.targetScore ? "targetScoreError" : undefined
              }
              onChange={(event) => setTargetScore(Number(event.target.value))}
              style={{ width: "100%", accentColor: "var(--indigo)" }}
            />
            {errors.targetScore && (
              <small id="targetScoreError" role="alert" style={errorStyle}>
                {errors.targetScore}
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
                Chọn nhanh:
              </span>
              {scorePresets.map((score) => (
                <button
                  key={score}
                  type="button"
                  aria-pressed={targetScore === score}
                  className={
                    targetScore === score
                      ? "btn-3d-lime btn-sm"
                      : "btn-3d-outline btn-sm"
                  }
                  style={{ padding: "3px 8px", fontSize: 11 }}
                  onClick={() => setTargetScore(score)}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Thời gian học mỗi ngày */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <label htmlFor="dailyMinutesInput" style={labelStyle}>
                Thời gian học mỗi ngày:
              </label>
              <span
                style={{ fontSize: 16, fontWeight: 750, color: "var(--ink)" }}
                aria-hidden="true"
              >
                {dailyMinutes}{" "}
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  phút / ngày
                </span>
              </span>
            </div>
            <input
              id="dailyMinutesInput"
              type="range"
              min={GOAL_LIMITS.minMinutes}
              max={GOAL_LIMITS.maxMinutes}
              step={5}
              value={dailyMinutes}
              aria-valuetext={`${dailyMinutes} phút mỗi ngày`}
              aria-invalid={Boolean(errors.dailyMinutes)}
              aria-describedby={
                errors.dailyMinutes ? "dailyMinutesError" : undefined
              }
              onChange={(event) => setDailyMinutes(Number(event.target.value))}
              style={{ width: "100%", accentColor: "var(--indigo)" }}
            />
            {errors.dailyMinutes && (
              <small id="dailyMinutesError" role="alert" style={errorStyle}>
                {errors.dailyMinutes}
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
                Gợi ý:
              </span>
              {minutePresets.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={dailyMinutes === minutes}
                  className={
                    dailyMinutes === minutes
                      ? "btn-3d-lime btn-sm"
                      : "btn-3d-outline btn-sm"
                  }
                  style={{ padding: "3px 8px", fontSize: 11 }}
                  onClick={() => setDailyMinutes(minutes)}
                >
                  {minutes} phút
                </button>
              ))}
            </div>
          </div>

          {/* Ngày mục tiêu */}
          <div>
            <label
              htmlFor="targetDateInput"
              style={{ ...labelStyle, display: "block", marginBottom: 6 }}
            >
              Ngày dự kiến thi / Hoàn thành mục tiêu (Tùy chọn):
            </label>
            <input
              id="targetDateInput"
              type="date"
              min={todayStr}
              className="admin-search-input"
              style={{ width: "100%" }}
              value={targetDate}
              aria-invalid={Boolean(errors.targetDate)}
              aria-describedby={
                errors.targetDate ? "targetDateError" : undefined
              }
              onChange={(event) => setTargetDate(event.target.value)}
            />
            {errors.targetDate && (
              <small id="targetDateError" role="alert" style={errorStyle}>
                {errors.targetDate}
              </small>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="btn-3d-outline btn-sm"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="btn-3d-lime btn-sm"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu mục tiêu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
