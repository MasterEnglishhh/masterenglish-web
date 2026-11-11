"use client";

import { useLearningGoal } from "../hooks/use-learning-goal";
import { GoalEditModal } from "./goal-edit-modal";
import { Target, Clock, Calendar, Edit3 } from "lucide-react";

export function GoalCard() {
  const {
    goal,
    isLoading,
    isSubmitting,
    isModalOpen,
    setIsModalOpen,
    saveGoal,
  } = useLearningGoal();

  if (isLoading) {
    return (
      <aside className="dashboard-aside" style={{ opacity: 0.7 }}>
        <div className="aside-head">
          <span className="section-kicker">MỤC TIÊU CỦA BẠN</span>
          <span>↗</span>
        </div>
        <div style={{ height: 60, background: "var(--line)", borderRadius: 12, margin: "20px 0" }} />
        <div style={{ height: 16, width: "80%", background: "var(--line)", borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 14, width: "60%", background: "var(--line)", borderRadius: 4 }} />
      </aside>
    );
  }

  // Calculate days remaining if targetDate is set
  let daysRemaining: number | null = null;
  if (goal?.targetDate) {
    const target = new Date(goal.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Progress percentage toward 990
  const scorePercent = goal ? Math.min(100, Math.round((goal.targetScore / 990) * 100)) : 0;

  return (
    <>
      <aside className="dashboard-aside">
        <div className="aside-head">
          <span className="section-kicker">MỤC TIÊU HỌC TẬP</span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Chỉnh sửa mục tiêu"
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
            <Edit3 size={15} />
          </button>
        </div>

        {goal ? (
          <div>
            <div style={{ margin: "16px 0 12px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                  ĐIỂM HƯỚNG TỚI:
                </span>
                <span style={{ fontSize: 26, fontWeight: 850, color: "var(--indigo)", letterSpacing: "-0.02em" }}>
                  {goal.targetScore} <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>TOEIC</span>
                </span>
              </div>

              {/* Progress bar */}
              <div
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
                    background: "linear-gradient(90deg, var(--indigo) 0%, #818cf8 100%)",
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
                <Clock size={15} color="var(--indigo)" />
                <span>Cam kết: <strong>{goal.dailyMinutes} phút / ngày</strong></span>
              </div>

              {goal.targetDate && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
                  <Calendar size={15} color="var(--indigo)" />
                  <span>
                    Hạn đích: <strong>{new Date(goal.targetDate).toLocaleDateString("vi-VN")}</strong>
                    {daysRemaining !== null && (
                      <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
                        (còn {daysRemaining} ngày)
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
              onClick={() => setIsModalOpen(true)}
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
              Xác định điểm số mong muốn và thời gian ôn luyện mỗi ngày để hệ thống cá nhân hóa lộ trình cho bạn.
            </p>
            <button
              type="button"
              className="btn-3d-lime btn-sm"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => setIsModalOpen(true)}
            >
              <Target size={14} style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
              Đặt mục tiêu ngay ↗
            </button>
          </div>
        )}

        <div className="aside-divider" />
        <span className="aside-caption">M01.06 · MỤC TIÊU HỌC TẬP</span>
      </aside>

      <GoalEditModal
        goal={goal}
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSave={saveGoal}
      />
    </>
  );
}
