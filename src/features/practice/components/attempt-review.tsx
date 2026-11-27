"use client";
import { Questions } from "./questions";
import type { AttemptResult } from "../types/practice";
import "../styles/practice.css";

export function AttemptReview({ attempt }: { attempt: AttemptResult }) {
  const result = attempt.result;
  return (
    <section aria-label="Kết quả bài luyện">
      <div className="practice-result-summary">
        <article className="glass-card study-card">
          <span>Độ chính xác</span>
          <strong className="study-number">{result.accuracyPercent}%</strong>
          <p>
            {result.correctCount}/{result.totalCount} câu đúng
          </p>
        </article>
        <article className="glass-card study-card">
          <span>Cần xem lại</span>
          <strong className="study-number">{result.wrongCount}</strong>
          <p>{result.unansweredCount} câu chưa trả lời</p>
        </article>
        <article className="glass-card study-card">
          <span>Thời gian làm</span>
          <strong className="study-number">
            {Math.floor(result.durationSeconds / 60)}:
            {String(result.durationSeconds % 60).padStart(2, "0")}
          </strong>
          <p>
            {result.submitReason === "TIME_LIMIT"
              ? "Nộp khi hết thời gian"
              : "Bạn đã nộp bài"}
          </p>
        </article>
      </div>
      {attempt.category === "TOEIC" && (
        <div className="glass-card study-card">
          <h2>Kết quả từng Part</h2>
          <p>
            Listening: {result.listeningCorrect ?? 0} câu đúng · Reading:{" "}
            {result.readingCorrect ?? 0} câu đúng
          </p>
          <p>Kết quả thể hiện số câu đúng và độ chính xác của bài luyện.</p>
          <div
            className="material-table"
            tabIndex={0}
            role="region"
            aria-label="Kết quả từng Part"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Part</th>
                  <th scope="col">Đúng</th>
                  <th scope="col">Sai</th>
                  <th scope="col">Bỏ trống</th>
                  <th scope="col">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {result.partBreakdown.map((p) => (
                  <tr key={p.partNumber}>
                    <th scope="row">{p.partNumber}</th>
                    <td>{p.correctCount}</td>
                    <td>{p.wrongCount}</td>
                    <td>{p.unansweredCount}</td>
                    <td>{p.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <h2>Đáp án và lời giải</h2>
      <nav className="practice-question-nav" aria-label="Xem lại câu hỏi">
        {attempt.questions.map((q) => (
          <a
            key={q.snapshotId}
            href={`#question-${q.snapshotId}`}
            aria-label={`Câu ${q.displayNumber}, ${q.answer.isCorrect ? "đúng" : q.answer.selectedOptionId ? "sai" : "bỏ trống"}`}
          >
            {q.displayNumber} {q.answer.isCorrect ? "✓" : "–"}
          </a>
        ))}
      </nav>
      <Questions groups={attempt.groups} questions={attempt.questions} review />
    </section>
  );
}
