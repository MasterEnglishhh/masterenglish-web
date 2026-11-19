"use client";

import { Calendar, Clock, Edit3, Target } from "lucide-react";
import { Mascot } from "@/components/mascot";
import { Skeleton } from "@/components/skeleton";
import { useFocusReturn } from "../hooks/use-focus-return";
import { useLearningGoal } from "../hooks/use-learning-goal";
import { daysUntil, formatGoalDate, GOAL_LIMITS } from "../lib/goal-validation";
import { GoalEditModal } from "./goal-edit-modal";

function daysRemainingLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days < 0) return "đã quá hạn";
  if (days === 0) return "hạn đích là hôm nay";
  return `còn ${days} ngày`;
}

/** Thẻ mục tiêu học tập: bốn trạng thái tách bạch là đang tải, lỗi tải, chưa đặt và đã có mục tiêu. */
export function GoalCard() {
  const {
    goal,
    isLoading,
    loadError,
    isSubmitting,
    saveError,
    isModalOpen,
    openModal,
    closeModal,
    saveGoal,
    refreshGoal,
  } = useLearningGoal();
  const { fallbackRef, remember } = useFocusReturn(isModalOpen);
  const open = () => {
    remember();
    openModal();
  };

  if (isLoading) {
    return (
      <aside className="glass-card goal-card" role="status" aria-label="Đang tải mục tiêu học tập">
        <span className="section-kicker">MỤC TIÊU CỦA BẠN</span>
        <Skeleton variant="line-lg" />
        <Skeleton />
        <Skeleton variant="line-sm" />
      </aside>
    );
  }

  // Không rõ đã có mục tiêu hay chưa: không được hiện trạng thái "Chưa đặt mục tiêu"
  // (người học có thể vô tình ghi đè mục tiêu đang có).
  if (loadError) {
    return (
      <aside className="glass-card goal-card">
        <span className="section-kicker">MỤC TIÊU HỌC TẬP</span>
        <div role="alert" className="goal-error">
          <h3>Chưa tải được mục tiêu</h3>
          <p>{loadError}</p>
          <button type="button" className="btn-ghost btn-sm goal-wide" onClick={refreshGoal}>
            Thử lại
          </button>
        </div>
      </aside>
    );
  }

  const daysRemaining = goal?.targetDate ? daysUntil(goal.targetDate) : null;
  const remainingLabel = daysRemainingLabel(daysRemaining);
  const scorePercent = goal ? Math.min(100, Math.round((goal.targetScore / GOAL_LIMITS.maxScore) * 100)) : 0;

  return (
    <>
      <aside className="glass-card goal-card">
        <div className="goal-card-head">
          <span className="section-kicker">MỤC TIÊU HỌC TẬP</span>
          <button
            ref={fallbackRef}
            type="button"
            className="goal-edit-icon"
            onClick={open}
            title="Chỉnh sửa mục tiêu"
            aria-label={goal ? "Chỉnh sửa mục tiêu học tập" : "Đặt mục tiêu học tập"}
          >
            <Edit3 size={16} aria-hidden="true" />
          </button>
        </div>

        {goal ? (
          <>
            <div className="goal-score">
              <span>ĐIỂM HƯỚNG TỚI</span>
              <strong>
                {goal.targetScore} <small>TOEIC</small>
              </strong>
            </div>
            {/* Tỷ lệ điểm mục tiêu trên thang 990 (trang trí, không phải tiến độ học). */}
            <div className="goal-meter" aria-hidden="true">
              <span style={{ width: `${scorePercent}%` }} />
            </div>
            <ul className="goal-facts">
              <li>
                <Clock size={16} aria-hidden="true" />
                <span>
                  Cam kết: <strong>{goal.dailyMinutes} phút / ngày</strong>
                </span>
              </li>
              {goal.targetDate && (
                <li>
                  <Calendar size={16} aria-hidden="true" />
                  <span>
                    Hạn đích: <strong>{formatGoalDate(goal.targetDate)}</strong>
                    {remainingLabel && <em className="goal-remaining">({remainingLabel})</em>}
                  </span>
                </li>
              )}
            </ul>
            <button type="button" className="btn-ghost btn-sm goal-wide" onClick={open}>
              Chỉnh sửa mục tiêu
            </button>
          </>
        ) : (
          <div className="goal-empty">
            <Mascot expression="thinking" idSuffix="-goal" className="goal-empty-mascot" />
            <h3>Chưa đặt mục tiêu TOEIC</h3>
            <p>
              Xác định điểm số mong muốn và thời gian ôn luyện mỗi ngày để hệ thống cá nhân hóa lộ trình cho bạn.
            </p>
            <button type="button" className="btn-lime btn-sm goal-wide" onClick={open}>
              <Target size={14} aria-hidden="true" /> Đặt mục tiêu ngay
            </button>
          </div>
        )}
      </aside>
      <GoalEditModal
        goal={goal}
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        serverError={saveError}
        onClose={closeModal}
        onSave={saveGoal}
      />
    </>
  );
}
