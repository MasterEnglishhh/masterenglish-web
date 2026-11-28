"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgressView } from "@/features/vocabulary";
import {
  AttemptReview,
  fetchHistory,
  fetchResults,
  fetchTopicStatistics,
} from "@/features/practice";
import { useApiResource } from "@/lib/use-api-resource";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Pagination } from "@/components/pagination";

function ResultDetail({ id }: { id: string }) {
  const load = useCallback(
    (signal: AbortSignal) => fetchResults(id, signal),
    [id]
  );
  const { data, error, reload } = useApiResource(load);
  return (
    <>
      <div className="study-actions">
        <Link href="/learn/results" className="btn-ghost">
          ← Lịch sử bài luyện
        </Link>
        <Link
          href={`/learn/practice?attempt=${encodeURIComponent(id)}`}
          className="btn-ghost"
        >
          Mở bài luyện
        </Link>
      </div>
      {error && <ErrorState message={error} onRetry={reload} />}
      {data ? (
        <AttemptReview attempt={data} />
      ) : (
        !error && <p role="status">Đang tải kết quả...</p>
      )}
    </>
  );
}

function GrammarStatistics() {
  const load = useCallback(
    (signal: AbortSignal) => fetchTopicStatistics(signal),
    []
  );
  const { data, error, reload } = useApiResource(load);
  return (
    <section className="glass-card study-card">
      <h2>Thống kê ngữ pháp theo chủ điểm</h2>
      <p>Tổng hợp các câu đã nộp, bao gồm bài luyện kết hợp nhiều chủ điểm.</p>
      {error && (
        <ErrorState variant="inline" message={error} onRetry={reload} />
      )}
      {data ? (
        data.length ? (
          <ul className="study-list">
            {data.map((item) => (
              <li key={item.topicId}>
                <Link href={`/learn/grammar?topic=${item.topicId}`}>
                  <strong>Xem chủ điểm</strong>
                  <span>
                    {item.attemptCount} lượt · {item.correctCount}/
                    {item.questionCount} câu đúng ·{" "}
                    {item.accuracyPercent === null
                      ? "Chưa có dữ liệu"
                      : `${item.accuracyPercent}%`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Chưa có thống kê từ bài luyện đã nộp.</p>
        )
      ) : (
        !error && <p role="status">Đang tải thống kê...</p>
      )}
    </section>
  );
}

function History() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") ?? "";
  const status = params.get("status") ?? "";
  const page = /^\d+$/.test(params.get("page") ?? "")
    ? Math.min(Number(params.get("page")), 100000)
    : 0;
  const load = useCallback(
    (signal: AbortSignal) => fetchHistory({ category, status, page }, signal),
    [category, status, page]
  );
  const { data, error, isLoading, reload } = useApiResource(load);
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/learn/results?${next}`);
  }
  function paginate(next: number) {
    const query = new URLSearchParams(params);
    query.set("page", String(next - 1));
    router.push(`/learn/results?${query}`);
  }
  return (
    <>
      <div className="study-form">
        <label>
          Loại bài
          <select
            value={category}
            onChange={(e) => update("category", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="GRAMMAR">Ngữ pháp</option>
            <option value="TOEIC">TOEIC</option>
          </select>
        </label>
        <label>
          Trạng thái
          <select
            value={status}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="SUBMITTED">Đã nộp</option>
            <option value="ABANDONED">Đã đóng</option>
          </select>
        </label>
      </div>
      {error && <ErrorState message={error} onRetry={reload} />}
      {isLoading && <p role="status">Đang tải lịch sử...</p>}
      {data && !isLoading && !error && (
        <>
          {data.items.length ? (
            <ul className="study-list practice-history">
              {data.items.map((item) => (
                <li key={item.id} className="glass-card study-card">
                  <div>
                    <h2>
                      {item.category === "TOEIC"
                        ? "TOEIC"
                        : item.category === "GRAMMAR"
                          ? "Ngữ pháp"
                          : "Từ vựng"}{" "}
                      · {item.totalCount} câu
                    </h2>
                    <p>
                      {new Date(item.startedAt).toLocaleString("vi-VN")} ·{" "}
                      {item.status === "IN_PROGRESS"
                        ? "Đang làm"
                        : item.status === "SUBMITTED"
                          ? "Đã nộp"
                          : "Đã đóng"}
                    </p>
                    {item.status === "SUBMITTED" && (
                      <p>
                        {item.correctCount ?? 0}/{item.totalCount} câu đúng
                        {item.category !== "TOEIC" && item.score !== null
                          ? ` · ${item.score}%`
                          : ""}
                      </p>
                    )}
                  </div>
                  {item.status !== "ABANDONED" && (
                    <Link
                      className="btn-primary"
                      href={`/learn/${item.status === "SUBMITTED" ? "results" : "practice"}?attempt=${item.id}`}
                    >
                      {item.status === "SUBMITTED"
                        ? "Xem kết quả"
                        : "Tiếp tục làm bài"}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Chưa có bài luyện phù hợp"
              action={
                <div className="study-actions">
                  <Link href="/learn/grammar" className="btn-primary">
                    Luyện ngữ pháp
                  </Link>
                  <Link href="/learn/toeic" className="btn-ghost">
                    Luyện TOEIC
                  </Link>
                </div>
              }
            >
              Bài đang làm và kết quả đã nộp sẽ xuất hiện ở đây.
            </EmptyState>
          )}
          <Pagination
            page={page + 1}
            totalPages={data.totalPages}
            hasNext={data.hasNext}
            onChange={paginate}
            summary={`${data.totalItems} lượt luyện`}
            label="Phân trang lịch sử bài luyện"
          />
        </>
      )}
      {category === "GRAMMAR" && <GrammarStatistics />}
    </>
  );
}

export function ResultsPage() {
  const params = useSearchParams();
  const attempt = params.get("attempt");
  const vocabulary = params.get("view") === "vocabulary";
  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">KẾT QUẢ / NHÌN LẠI ĐỂ ĐI TIẾP</span>
        <h1>
          Mỗi lần luyện, <em>một điều hiểu thêm.</em>
        </h1>
        <p>Lịch sử bài luyện và tiến độ học tập của bạn.</p>
      </div>
      <nav className="study-actions" aria-label="Nhóm kết quả">
        <Link
          href="/learn/results"
          className={vocabulary ? "btn-ghost" : "btn-primary"}
          aria-current={!vocabulary ? "page" : undefined}
        >
          Ngữ pháp & TOEIC
        </Link>
        <Link
          href="/learn/results?view=vocabulary"
          className={vocabulary ? "btn-primary" : "btn-ghost"}
          aria-current={vocabulary ? "page" : undefined}
        >
          Tiến độ từ vựng
        </Link>
      </nav>
      {attempt ? (
        <ResultDetail key={attempt} id={attempt} />
      ) : vocabulary ? (
        <ProgressView />
      ) : (
        <History />
      )}
    </main>
  );
}
