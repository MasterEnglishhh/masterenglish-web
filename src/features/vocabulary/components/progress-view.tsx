"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/features/auth";
import {
  fetchLearningProgress,
  fetchReviewHistory,
} from "../lib/vocabulary-client";
import type {
  LearningProgressResponse,
  PageResponse,
  RatingType,
  ReviewHistoryItemDto,
} from "../types/vocabulary";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Pagination } from "@/components/pagination";
import "../styles/vocabulary.css";

const ratingLabels: Record<RatingType, string> = {
  AGAIN: "Quên",
  HARD: "Khó",
  GOOD: "Đã nhớ",
};

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ProgressView() {
  const { user } = useAuthSession();
  const [attempt, setAttempt] = useState(0);
  return (
    <ProgressContent
      key={`${user?.id}:${attempt}`}
      reload={() => setAttempt((value) => value + 1)}
    />
  );
}

function ProgressContent({ reload }: { reload: () => void }) {
  const [progress, setProgress] = useState<LearningProgressResponse | null>(null);
  const [page, setPage] = useState(0);
  const [history, setHistory] = useState<PageResponse<ReviewHistoryItemDto> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchLearningProgress().then((result) => {
      if (!active) return;
      if (result.success) setProgress(result.data);
      else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetchReviewHistory({ page, size: 20 }).then((result) => {
      if (!active) return;
      if (result.success) setHistory(result.data);
      else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, [page]);

  if (error) return <ErrorState message={error} onRetry={reload} idSuffix="-progress-error" />;
  if (!progress || !history)
    return <p role="status">Đang tải tiến độ học tập...</p>;

  const stats = [
    ["Nghĩa đã học", progress.studiedSenses],
    ["Đã thuộc (≥ 21 ngày)", progress.masteredSenses],
    ["Đến hạn ôn", progress.dueNow],
    ["Đã lưu", progress.savedSenses],
    ["Lượt ôn 7 ngày qua", progress.reviewsLast7Days],
    ["Tổng lượt ôn", progress.totalReviews],
  ] as const;

  return (
    <>
      <dl className="progress-stats">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {progress.dueNow > 0 && (
        <div className="progress-due">
          <span>Bạn có {progress.dueNow} thẻ đến hạn ôn.</span>
          <Link className="btn-lime" href="/learn/review">
            Ôn ngay
          </Link>
        </div>
      )}

      <h2 className="progress-heading">Lịch sử ôn tập</h2>
      {history.items.length === 0 ? (
        <EmptyState
          title="Chưa có lượt ôn nào"
          mascot="sleepy"
          action={
            <Link className="btn-primary" href="/learn/vocabulary">
              Học từ mới
            </Link>
          }
        >
          Học một bộ thẻ để bắt đầu ghi lại tiến độ.
        </EmptyState>
      ) : (
        <>
          <ul className="progress-history">
            {history.items.map((item) => (
              <li key={item.reviewId}>
                <div>
                  <strong>{item.lemma ?? "Từ không còn khả dụng"}</strong>
                  {item.meaningVi && <span>{item.meaningVi}</span>}
                </div>
                <span className={`rating-badge rating-${item.rating.toLowerCase()}`}>
                  {ratingLabels[item.rating]}
                </span>
                <small>
                  <time dateTime={item.reviewedAt}>
                    {dateTime.format(new Date(item.reviewedAt))}
                  </time>
                  {" · ôn lại "}
                  <time dateTime={item.nextDueAt}>
                    {dateTime.format(new Date(item.nextDueAt))}
                  </time>
                </small>
              </li>
            ))}
          </ul>
          <Pagination
            page={history.page + 1}
            totalPages={history.totalPages}
            hasNext={history.hasNext}
            onChange={(next) => setPage(next - 1)}
            label="Phân trang lịch sử ôn tập"
          />
        </>
      )}
    </>
  );
}
