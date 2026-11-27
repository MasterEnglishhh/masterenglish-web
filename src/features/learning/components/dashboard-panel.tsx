"use client";

import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { useApiResource } from "@/lib/use-api-resource";
import { getSafeRedirectUrl } from "@/features/auth";
import { fetchDashboard } from "../lib/dashboard-client";

const load = (signal: AbortSignal) => fetchDashboard(signal);
const weaknessLabels: Record<string, string> = {
  NO_DATA: "Chưa có lượt luyện được chấm điểm.",
  INSUFFICIENT_DATA: "Cần thêm lượt luyện để phân tích chính xác.",
  NO_WEAKNESS_DETECTED:
    "Chưa phát hiện chủ điểm cần củng cố trong dữ liệu hiện có.",
  READY: "Những chủ điểm nên luyện tiếp.",
};

export function DashboardPanel() {
  const { data, error, isLoading, reload } = useApiResource(load);
  if (!data)
    return error ? (
      <ErrorState
        message={error}
        onRetry={reload}
        idSuffix="-dashboard-error"
      />
    ) : (
      <p role="status">Đang tải tổng quan học tập...</p>
    );
  const {
    studyPlan: plan,
    vocabularyProgress: vocabulary,
    practiceStatistics: practice,
  } = data;
  return (
    <section className="study-section" aria-label="Tiến độ học tập của bạn">
      <div className="study-heading-row">
        <h2>Nhịp học hôm nay</h2>
        <button
          className="btn-ghost btn-sm"
          onClick={reload}
          disabled={isLoading}
        >
          Cập nhật
        </button>
      </div>
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      <div className="study-grid">
        <article className="glass-card study-card">
          <h3>Ôn tập đến hạn</h3>
          <strong className="study-number">{data.todayReview.dueNow}</strong>
          <p>thẻ đang chờ bạn</p>
          <Link href="/learn/review" className="btn-lime">
            Ôn ngay
          </Link>
        </article>
        <article className="glass-card study-card">
          <h3>Thời gian học thực tế</h3>
          <strong className="study-number">
            {plan.studySession.trackingAvailable &&
            plan.studySession.todayActualMinutes !== null
              ? `${plan.studySession.todayActualMinutes} phút`
              : "Chưa khả dụng"}
          </strong>
          <p>
            {data.overview.streakDays} ngày liên tiếp · {data.overview.timezone}
          </p>
        </article>
        <article className="glass-card study-card">
          <h3>Mục tiêu mỗi ngày</h3>
          <strong className="study-number">
            {plan.studyGoal.configured
              ? `${plan.studyGoal.plannedDailyMinutes} phút`
              : "Chưa đặt"}
          </strong>
          <p>
            {plan.studySession.dailyGoalCompleted
              ? "Đã hoàn thành mục tiêu hôm nay."
              : "Thời lượng dự kiến cho mỗi ngày."}
          </p>
          <Link href="/learn/account">Điều chỉnh mục tiêu →</Link>
        </article>
        <article className="glass-card study-card">
          <h3>Điểm TOEIC hướng tới</h3>
          <strong className="study-number">
            {plan.toeicTarget.targetScore ?? "Chưa đặt"}
          </strong>
          <p>
            {plan.toeicTarget.currentScore === null
              ? "Chưa có điểm nền để tính tiến độ đạt điểm."
              : `Điểm nền: ${plan.toeicTarget.currentScore}`}
          </p>
          {plan.toeicTarget.targetDate && (
            <p>Ngày dự kiến: {plan.toeicTarget.targetDate}</p>
          )}
        </article>
      </div>
      <div className="study-grid study-grid-two">
        <article className="glass-card study-card">
          <h3>Lịch học</h3>
          <p>
            {plan.studySchedule.available
              ? "Lịch học đang được cập nhật từ dịch vụ."
              : "Tính năng lập lịch học chưa khả dụng."}
          </p>
        </article>
        <article className="glass-card study-card">
          <h3>Thông báo</h3>
          <p>
            {data.notificationSummary.available
              ? `${data.notificationSummary.unreadCount} thông báo chưa đọc`
              : "Chưa cập nhật được số thông báo."}
          </p>
          <Link href="/learn/notifications">Mở thông báo →</Link>
        </article>
      </div>
      <div className="study-grid study-grid-two">
        <article className="glass-card study-card">
          <h3>Tiến độ tích lũy</h3>
          <dl className="study-facts">
            <div>
              <dt>Nghĩa đã học</dt>
              <dd>{vocabulary.studiedSenses}</dd>
            </div>
            <div>
              <dt>Nghĩa đã thuộc</dt>
              <dd>{vocabulary.masteredSenses}</dd>
            </div>
            <div>
              <dt>Lượt ôn 7 ngày</dt>
              <dd>{vocabulary.reviewsLast7Days}</dd>
            </div>
            <div>
              <dt>Bài ngữ pháp hoàn thành</dt>
              <dd>{practice.completedGrammarLessons}</dd>
            </div>
            <div>
              <dt>Lượt luyện đã nộp</dt>
              <dd>{practice.submittedPracticeAttempts}</dd>
            </div>
          </dl>
        </article>
        <article className="glass-card study-card">
          <h3>Nên học tiếp</h3>
          {data.recommendations.length === 0 ? (
            <p>Khám phá một bài học hoặc ôn từ để bắt đầu.</p>
          ) : (
            <ul className="study-list">
              {data.recommendations.map((item, index) => {
                const safe = getSafeRedirectUrl(item.targetUrl, "/learn");
                const href =
                  safe === "/learn" || safe.startsWith("/learn/")
                    ? safe
                    : "/learn";
                return (
                  <li key={`${item.type}:${index}`}>
                    <Link href={href}>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
        <article className="glass-card study-card">
          <h3>Chủ điểm cần củng cố</h3>
          <p>
            {weaknessLabels[data.weaknessAnalysis.status] ??
              "Phân tích điểm yếu chưa khả dụng."}
          </p>
          {data.weaknessAnalysis.status === "INSUFFICIENT_DATA" && (
            <p>
              Tối thiểu {data.weaknessAnalysis.minimumSampleSize} câu mỗi chủ
              điểm trong {data.weaknessAnalysis.periodDays} ngày.
            </p>
          )}
          <ul className="study-list">
            {data.weaknessAnalysis.weakTopics.map((topic) => (
              <li key={topic.topicId}>
                <Link
                  href={`/learn/grammar?topic=${encodeURIComponent(topic.topicId)}&mode=practice`}
                >
                  {topic.topicName} · {topic.accuracyPercent}% chính xác
                </Link>
              </li>
            ))}
          </ul>
        </article>
        <article className="glass-card study-card">
          <h3>Lượt luyện gần đây</h3>
          {practice.recentAttempts.length === 0 ? (
            <p>Chưa có kết quả luyện tập.</p>
          ) : (
            <ul className="study-list">
              {practice.recentAttempts.map((attempt) => (
                <li key={attempt.attemptId}>
                  <Link
                    href={`/learn/results?attempt=${encodeURIComponent(attempt.attemptId)}`}
                  >
                    <strong>
                      {attempt.correctCount ?? 0}/{attempt.totalCount} câu đúng
                    </strong>
                    <span>
                      {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
