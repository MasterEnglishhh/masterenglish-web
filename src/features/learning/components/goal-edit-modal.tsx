"use client";

import { useEffect, useState } from "react";
import type { LearningGoalDto, UpdateLearningGoalPayload } from "../lib/goal-client";

interface GoalEditModalProps {
  goal: LearningGoalDto | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (payload: UpdateLearningGoalPayload) => Promise<boolean>;
}

export function GoalEditModal({
  goal,
  isOpen,
  isSubmitting,
  onClose,
  onSave,
}: GoalEditModalProps) {
  const [targetScore, setTargetScore] = useState<number>(goal?.targetScore ?? 650);
  const [dailyMinutes, setDailyMinutes] = useState<number>(goal?.dailyMinutes ?? 30);
  const [targetDate, setTargetDate] = useState<string>(goal?.targetDate ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setTargetScore(goal.targetScore);
      setDailyMinutes(goal.dailyMinutes);
      setTargetDate(goal.targetDate ?? "");
    }
  }, [goal]);

  // Accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (targetScore < 10 || targetScore > 990) {
      setLocalError("Điểm TOEIC phải từ 10 đến 990.");
      return;
    }

    if (targetScore % 5 !== 0) {
      setLocalError("Điểm mục tiêu phải chia hết cho 5 (ví dụ: 500, 650, 750).");
      return;
    }

    if (dailyMinutes < 5 || dailyMinutes > 240) {
      setLocalError("Thời gian học mỗi ngày phải từ 5 đến 240 phút.");
      return;
    }

    if (targetDate && targetDate < todayStr) {
      setLocalError("Ngày mục tiêu phải từ hôm nay trở đi.");
      return;
    }

    const ok = await onSave({
      targetScore,
      dailyMinutes,
      targetDate: targetDate || null,
    });

    if (ok) {
      onClose();
    }
  };

  const scorePresets = [450, 600, 750, 850, 900];
  const minutePresets = [15, 30, 45, 60];

  return (
    <div
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="admin-modal" style={{ maxWidth: 540 }}>
        <div>
          <span className="admin-kicker">M01.06 · KẾ HOẠCH HỌC TẬP</span>
          <h2 id="goal-modal-title" className="admin-modal-title">
            {goal ? "Cập nhật Mục tiêu TOEIC" : "Thiết lập Mục tiêu TOEIC"}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            Đặt mục tiêu điểm số và cam kết thời gian mỗi ngày giúp hệ thống tối ưu hóa thuật toán lặp lại ngắt quãng (SRS).
          </p>
        </div>

        {localError && (
          <div
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
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Target Score */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <label
                htmlFor="targetScoreInput"
                style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
              >
                Điểm TOEIC mục tiêu:
              </label>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--indigo)" }}>
                {targetScore} <span style={{ fontSize: 12, fontWeight: 600 }}>/ 990</span>
              </span>
            </div>

            <input
              id="targetScoreInput"
              type="range"
              min={10}
              max={990}
              step={5}
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--indigo)" }}
            />

            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center", marginRight: 4 }}>
                Chọn nhanh:
              </span>
              {scorePresets.map((score) => (
                <button
                  key={score}
                  type="button"
                  className={targetScore === score ? "btn-3d-lime btn-sm" : "btn-3d-outline btn-sm"}
                  style={{ padding: "3px 8px", fontSize: 11 }}
                  onClick={() => setTargetScore(score)}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Minutes */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <label
                htmlFor="dailyMinutesInput"
                style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
              >
                Thời gian học mỗi ngày:
              </label>
              <span style={{ fontSize: 16, fontWeight: 750, color: "var(--ink)" }}>
                {dailyMinutes} <span style={{ fontSize: 12, fontWeight: 600 }}>phút / ngày</span>
              </span>
            </div>

            <input
              id="dailyMinutesInput"
              type="range"
              min={5}
              max={240}
              step={5}
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--indigo)" }}
            />

            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center", marginRight: 4 }}>
                Gợi ý:
              </span>
              {minutePresets.map((min) => (
                <button
                  key={min}
                  type="button"
                  className={dailyMinutes === min ? "btn-3d-lime btn-sm" : "btn-3d-outline btn-sm"}
                  style={{ padding: "3px 8px", fontSize: 11 }}
                  onClick={() => setDailyMinutes(min)}
                >
                  {min} phút
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label
              htmlFor="targetDateInput"
              style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 6 }}
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
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
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
