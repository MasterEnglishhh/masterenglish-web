"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { isUuid } from "@/lib/api-validation";
import { useApiResource } from "@/lib/use-api-resource";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Pagination } from "@/components/pagination";
import { pageFromQuery } from "@/lib/pagination";
import {
  fetchTopics,
  fetchLessons,
  fetchLessonProgress,
} from "../lib/grammar-client";
import { LessonView } from "./lesson-view";
import { GrammarPracticeLauncher } from "./grammar-practice-launcher";

function Topics({ page }: { page: number }) {
  const router = useRouter();
  const load = useCallback(
    (signal: AbortSignal) => fetchTopics(page, signal),
    [page]
  );
  const { data, error, reload, isLoading } = useApiResource(load);
  if (!data)
    return error ? (
      <ErrorState message={error} onRetry={reload} />
    ) : (
      <p role="status">Đang tải chủ điểm...</p>
    );
  return (
    <>
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      {data.items.length === 0 ? (
        <EmptyState title="Chưa có chủ điểm ngữ pháp">
          Bài học đã xuất bản sẽ xuất hiện tại đây.
        </EmptyState>
      ) : (
        <div className="study-grid study-grid-two">
          {data.items.map((topic) => (
            <article key={topic.id} className="glass-card study-card">
              <h2>{topic.name}</h2>
              <p>{topic.description}</p>
              <p>{topic.difficulty}</p>
              <Link
                className="btn-primary"
                href={`/learn/grammar?topic=${encodeURIComponent(topic.id)}`}
              >
                Xem bài học
              </Link>
            </article>
          ))}
        </div>
      )}
      <Pagination
        page={page + 1}
        totalPages={data.totalPages}
        hasNext={data.hasNext}
        busy={isLoading}
        onChange={(next) => router.push(`/learn/grammar?page=${next - 1}`)}
        label="Phân trang chủ điểm ngữ pháp"
      />
    </>
  );
}

function Topic({ id, practice }: { id: string; practice: boolean }) {
  const load = useCallback(
    (signal: AbortSignal) => fetchLessons(id, signal),
    [id]
  );
  const progressLoad = useCallback(
    (signal: AbortSignal) => fetchLessonProgress(signal),
    []
  );
  const lessons = useApiResource(load);
  const progress = useApiResource(progressLoad);
  if (!lessons.data)
    return lessons.error ? (
      <ErrorState message={lessons.error} onRetry={lessons.reload} />
    ) : (
      <p role="status">Đang tải danh sách bài học...</p>
    );
  return (
    <>
      <div className="study-actions">
        <Link className="btn-ghost" href="/learn/grammar">
          ← Tất cả chủ điểm
        </Link>
        <Link
          className="btn-primary"
          href={`/learn/grammar?topic=${encodeURIComponent(id)}&mode=practice`}
        >
          Luyện chủ điểm
        </Link>
      </div>
      {lessons.error && (
        <ErrorState
          message={lessons.error}
          onRetry={lessons.reload}
          variant="inline"
        />
      )}
      {progress.error && (
        <ErrorState
          message={progress.error}
          onRetry={progress.reload}
          variant="inline"
        />
      )}
      {practice && <GrammarPracticeLauncher topicId={id} />}
      {lessons.data.length === 0 ? (
        <EmptyState title="Chưa có bài học đã xuất bản">
          Bạn có thể quay lại sau hoặc chọn một chủ điểm khác.
        </EmptyState>
      ) : (
        <ul className="study-list">
          {lessons.data.map((lesson) => {
            const state = progress.data?.find(
              (p) => p.lessonId === lesson.id
            )?.state;
            return (
              <li key={lesson.id} className="glass-card study-card">
                <Link
                  href={`/learn/grammar?lesson=${encodeURIComponent(lesson.id)}`}
                >
                  <strong>{lesson.title}</strong>
                  <span>
                    {lesson.estimatedMinutes === null
                      ? "Tự học"
                      : `${lesson.estimatedMinutes} phút`}{" "}
                    ·{" "}
                    {state === "COMPLETED"
                      ? "Đã hoàn thành"
                      : state === "IN_PROGRESS"
                        ? "Đang học"
                        : progress.data
                          ? "Chưa bắt đầu"
                          : "Chưa tải tiến độ"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function GrammarPageView() {
  const params = useSearchParams();
  const lesson = params.get("lesson");
  const topic = params.get("topic");
  const invalid =
    (lesson !== null && !isUuid(lesson)) || (topic !== null && !isUuid(topic));
  return (
    <main className="learning-content inner-page">
      <header className="page-heading">
        <span className="section-kicker">NGỮ PHÁP / BÀI HỌC & LUYỆN TẬP</span>
        <h1>
          Hiểu cấu trúc. <em>Dùng được trong câu.</em>
        </h1>
        <p>Chọn chủ điểm, đọc bài học và luyện tập theo tiến độ của bạn.</p>
      </header>
      {invalid ? (
        <ErrorState message="Mã bài học hoặc chủ điểm không hợp lệ." />
      ) : lesson ? (
        <LessonView key={lesson} id={lesson} />
      ) : topic ? (
        <Topic
          key={topic}
          id={topic}
          practice={params.get("mode") === "practice"}
        />
      ) : (
        <Topics page={pageFromQuery(params.get("page"))} />
      )}
    </main>
  );
}
