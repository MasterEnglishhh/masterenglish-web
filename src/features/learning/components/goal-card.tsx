"use client";

import { useEffect, useRef } from "react";
import { useLearningGoal } from "../hooks/use-learning-goal";
import { GoalEditModal } from "./goal-edit-modal";
import { daysUntil, formatGoalDate, GOAL_LIMITS } from "../lib/goal-validation";
import { Target, Clock, Calendar, Edit3 } from "lucide-react";

function daysRemainingLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days < 0) return "đã quá hạn";
  if (days === 0) return "hạn đích là hôm nay";
  return `còn ${days} ngày`;
}

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

  // Trả focus về nút đã mở hộp thoại (kể cả khi hộp thoại đóng sau khi lưu thành công).
  const opener = useRef<HTMLElement | null>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !isModalOpen) {
      const target = opener.current?.isConnected
        ? opener.current
        : editButton.current;
      target?.focus();
    }
    wasOpen.current = isModalOpen;
  }, [isModalOpen]);

  const open = () => {
    opener.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    openModal();
  };

  if (isLoading) {
    return (
      <aside
        className="dashboard-aside"
        style={{ opacity: 0.7 }}
        role="status"
        aria-label="Đang tải mục tiêu học tập"
      >
        <div className="aside-head">
          <span className="section-kicker">MỤC TIÊU CỦA BẠN</span>
        </div>
        <div
          style={{
            height: 60,
            background: "var(--line)",
            borderRadius: 12,
            margin: "20px 0",
          }}
        />
        <div
          style={{
            height: 16,
            width: "80%",
            background: "var(--line)",
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 14,
            width: "60%",
            background: "var(--line)",
            borderRadius: 4,
          }}
        />
      </aside>
    );
  }

  // Không rõ đã có mục tiêu hay chưa: không được hiện trạng thái "Chưa đặt mục tiêu"
  // (người học có thể vô tình ghi đè mục tiêu đang có).
  if (loadError) {
    return (
      <aside className="dashboard-aside">
        <div className="aside-head">
          <span className="section-kicker">MỤC TIÊU HỌC TẬP</span>
        </div>
        <div role="alert" style={{ margin: "16px 0" }}>
          <h3>Chưa tải được mục tiêu</h3>
          <p>{loadError}</p>
          <button
            type="button"
            className="btn-3d-outline btn-sm"
            style={{ width: "100%", marginTop: 12 }}
            onClick={refreshGoal}
          >
            Thử lại
          </button>
        </div>
      </aside>
    );
  }

  const daysRemaining = goal?.targetDate ? daysUntil(goal.targetDate) : null;
  const remainingLabel = daysRemainingLabel(daysRemaining);
  const scorePercent = goal
    ? Math.min(100, Math.round((goal.targetScore / GOAL_LIMITS.maxScore) * 100))
    : 0;

  return (
    <>
      <aside className="dashboard-aside">
        <div className="aside-head">
          <span className="section-kicker">MỤC TIÊU HỌC TẬP</span>
          <button
            ref={editButton}
            type="button"
            onClick={open}
            title="Chỉnh sửa mục tiêu"
            aria-label={
              goal ? "Chỉnh sửa mục tiêu học tập" : "Đặt mục tiêu học tập"
            }
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--indigo)",
              display: "flex",
              alignItems: "center",
              padding: 4,
            }}
          >
            <Edit3 size={15} aria-hidden="true" />
          </button>
        </div>

        {goal ? (
          <div>
            <div style={{ margin: "16px 0 12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--muted)",
                  }}
                >
                  ĐIỂM HƯỚNG TỚI:
                </span>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 850,
                    color: "var(--indigo)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {goal.targetScore}{" "}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    TOEIC
                  </span>
                </span>
              </div>

              {/* Tỷ lệ điểm mục tiêu trên thang 990 (trang trí, không phải tiến độ học). */}
              <div
                aria-hidden="true"
                style={{
                  height: 8,
                  width: "100%",
                  background: "var(--line)",
                  borderRadius: 99,
                  overflow: "hidden",
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${scorePercent}%`,
                    background:
                      "linear-gradient(90deg, var(--indigo) 0%, #818cf8 100%)",
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "#fafaf7",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--line)",
                margin: "12px 0 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--ink)",
                  fontWeight: 600,
                }}
              >
                <Clock size={15} color="var(--indigo)" aria-hidden="true" />
                <span>
                  Cam kết: <strong>{goal.dailyMinutes} phút / ngày</strong>
                </span>
              </div>

              {goal.targetDate && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "var(--ink)",
                    fontWeight: 600,
                  }}
                >
                  <Calendar
                    size={15}
                    color="var(--indigo)"
                    aria-hidden="true"
                  />
                  <span>
                    Hạn đích: <strong>{formatGoalDate(goal.targetDate)}</strong>
                    {remainingLabel && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          marginLeft: 6,
                        }}
                      >
                        ({remainingLabel})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-3d-outline btn-sm"
              style={{ width: "100%" }}
              onClick={open}
            >
              Chỉnh sửa mục tiêu
            </button>
          </div>
        ) : (
          <div>
            <div className="empty-orbit" aria-hidden="true">
              <span>✳</span>
            </div>
            <h3>Chưa đặt mục tiêu TOEIC</h3>
            <p>
              Xác định điểm số mong muốn và thời gian ôn luyện mỗi ngày để hệ
              thống cá nhân hóa lộ trình cho bạn.
            </p>
            <button
              type="button"
              className="btn-3d-lime btn-sm"
              style={{ width: "100%", marginTop: 12 }}
              onClick={open}
            >
              <Target
                size={14}
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  marginRight: 6,
                  verticalAlign: "middle",
                }}
              />
              Đặt mục tiêu ngay ↗
            </button>
          </div>
        )}

        <div className="aside-divider" />
        <span className="aside-caption">MỤC TIÊU HỌC TẬP</span>
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
