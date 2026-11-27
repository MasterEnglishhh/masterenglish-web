"use client";

import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { useStudySession } from "@/features/learning";
import { useGrammarLesson } from "../hooks/use-grammar-lesson";
import type { LessonBlock } from "../lib/grammar-client";

function Block({ block, index }: { block: LessonBlock; index: number }) {
  if (block.type === "heading")
    return <h3 id={`lesson-block-${index}`}>{block.text}</h3>;
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "note")
    return <aside className="lesson-note">{block.text}</aside>;
  if (block.type === "example")
    return (
      <blockquote className="lesson-example">
        <p lang="en">{block.example_en}</p>
        {block.example_vi && <p>{block.example_vi}</p>}
      </blockquote>
    );
  if (block.type === "table")
    return (
      <div
        className="lesson-table"
        role="region"
        aria-label="Bảng nội dung bài học"
        tabIndex={0}
      >
        <table>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return null;
}

export function LessonView({ id }: { id: string }) {
  const { data, error, reload, isLoading, complete, isSaving, saveError } =
    useGrammarLesson(id);
  const tracking = useStudySession("LESSON", id, Boolean(data));
  if (!data)
    return error ? (
      <ErrorState message={error} onRetry={reload} idSuffix="-lesson-error" />
    ) : (
      <p role="status">Đang tải bài học...</p>
    );
  const { lesson, progress, warning } = data;
  return (
    <>
      <div className="study-actions">
        <Link
          className="btn-ghost btn-sm"
          href={`/learn/grammar?topic=${encodeURIComponent(lesson.topicId)}`}
        >
          ← Danh sách bài học
        </Link>
      </div>
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      {warning && (
        <ErrorState message={warning} onRetry={reload} variant="inline" />
      )}
      {tracking.warning && <p role="status">{tracking.warning}</p>}
      <div className="lesson-layout">
        <details className="glass-card study-card lesson-toc" open>
          <summary>Mục lục bài học</summary>
          <ul className="study-list">
            {lesson.body.blocks.map((block, index) =>
              block.type === "heading" ? (
                <li key={index}>
                  <a href={`#lesson-block-${index}`}>{block.text}</a>
                </li>
              ) : null
            )}
          </ul>
        </details>
        <article className="glass-card study-card lesson-body">
          <h2>{lesson.title}</h2>
          <p>
            {lesson.estimatedMinutes === null
              ? "Học theo nhịp của bạn"
              : `Khoảng ${lesson.estimatedMinutes} phút`}{" "}
            ·{" "}
            {progress?.state === "COMPLETED"
              ? "Đã hoàn thành"
              : progress
                ? "Đang học"
                : "Chưa xác định tiến độ"}
          </p>
          {lesson.body.blocks.map((block, index) => (
            <Block key={index} block={block} index={index} />
          ))}
          {saveError && <ErrorState message={saveError} variant="inline" />}
          <div className="study-actions">
            <button
              className="btn-primary"
              disabled={
                isSaving || isLoading || progress?.state === "COMPLETED"
              }
              onClick={() => void complete()}
            >
              {isSaving
                ? "Đang lưu..."
                : progress?.state === "COMPLETED"
                  ? "Đã hoàn thành bài học"
                  : "Hoàn thành bài học"}
            </button>
            <Link
              className="btn-ghost"
              href={`/learn/grammar?topic=${encodeURIComponent(lesson.topicId)}&mode=practice`}
            >
              Luyện chủ điểm này
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
