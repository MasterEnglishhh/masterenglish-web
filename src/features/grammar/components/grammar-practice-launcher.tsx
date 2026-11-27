"use client";

import { ErrorState } from "@/components/error-state";
import { useGrammarPractice } from "../hooks/use-grammar-practice";

export function GrammarPracticeLauncher({ topicId }: { topicId: string }) {
  const {
    data,
    error,
    reload,
    count,
    setCount,
    pending,
    failure,
    retrying,
    start,
  } = useGrammarPractice(topicId);
  return (
    <section className="glass-card study-card">
      <h2>Luyện chủ điểm</h2>
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      {!data ? (
        !error && <p role="status">Đang kiểm tra câu hỏi khả dụng...</p>
      ) : data.availableQuestions === 0 ? (
        <p>Chưa có câu hỏi đã xuất bản cho chủ điểm này.</p>
      ) : (
        <>
          <p>
            {data.availableQuestions} câu hỏi khả dụng. Đáp án và lời giải xuất
            hiện sau khi nộp bài.
          </p>
          <form className="study-form" onSubmit={start}>
            <label>
              Số câu
              <input
                type="number"
                min={1}
                max={Math.min(100, data.availableQuestions)}
                value={Math.min(count, data.availableQuestions)}
                disabled={pending || retrying}
                onChange={(e) => setCount(Number(e.target.value))}
                required
              />
            </label>
            <button className="btn-primary" disabled={pending} type="submit">
              {pending
                ? "Đang mở lượt..."
                : retrying
                  ? "Thử lại lượt vừa mở"
                  : "Bắt đầu luyện"}
            </button>
          </form>
        </>
      )}
      {failure && <ErrorState message={failure} variant="inline" />}
    </section>
  );
}
