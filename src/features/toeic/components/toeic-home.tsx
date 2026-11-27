"use client";

import Link from "next/link";
import { useCallback, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { useApiResource } from "@/lib/use-api-resource";
import {
  fetchPracticeSets,
  fetchPracticeSet,
  useStartAttempt,
} from "@/features/practice";
import "../styles/toeic.css";

const difficultyLabel: Record<string, string> = {
  EASY: "Dễ",
  MEDIUM: "Vừa",
  HARD: "Khó",
};
const partLabels = [
  "Nhiều Part",
  "Part 1 · Hình ảnh",
  "Part 2 · Hỏi đáp",
  "Part 3 · Hội thoại",
  "Part 4 · Bài nói",
  "Part 5 · Hoàn thành câu",
  "Part 6 · Hoàn thành đoạn",
  "Part 7 · Đọc hiểu",
];

function SetDetail({ id, back }: { id: string; back: string }) {
  const load = useCallback(
    (signal: AbortSignal) => fetchPracticeSet(id, signal),
    [id]
  );
  const { data, error, reload } = useApiResource(load);
  const launch = useStartAttempt();
  return (
    <section className="glass-card study-card">
      <Link href={back} className="practice-back">
        ← Danh sách bộ đề
      </Link>
      {error && <ErrorState message={error} onRetry={reload} />}
      {!data ? (
        !error && <p role="status">Đang tải thông tin bộ đề...</p>
      ) : (
        <>
          <h2>{data.title}</h2>
          {data.description && <p>{data.description}</p>}
          <dl className="study-facts">
            <div>
              <dt>Phạm vi</dt>
              <dd>
                {data.partNumber === null
                  ? "Nhiều Part"
                  : `Part ${data.partNumber}`}
              </dd>
            </div>
            <div>
              <dt>Số câu</dt>
              <dd>{data.questionCount ?? "Chọn khi mở đề"}</dd>
            </div>
            <div>
              <dt>Độ khó</dt>
              <dd>
                {data.difficulty
                  ? difficultyLabel[data.difficulty]
                  : "Tổng hợp"}
              </dd>
            </div>
            <div>
              <dt>Thời gian</dt>
              <dd>
                {data.timeLimitSeconds === null
                  ? "Không giới hạn"
                  : `${Math.ceil(data.timeLimitSeconds / 60)} phút`}
              </dd>
            </div>
          </dl>
          {!!data.partBreakdown.length && (
            <>
              <h3>Cấu trúc bài luyện</h3>
              <ul className="study-list">
                {data.partBreakdown.map((p) => (
                  <li key={p.partNumber}>
                    <strong>
                      Part {p.partNumber} · {p.title}
                    </strong>
                    <p>{p.description}</p>
                    <span>
                      {p.questionCount === null
                        ? "Số câu được chọn khi bắt đầu"
                        : `${p.questionCount} câu`}
                      {p.groupCount ? ` · ${p.groupCount} nhóm` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p>
            Đáp án và bản chép lời được mở sau khi nộp bài. Hệ thống lưu đáp án
            để bạn có thể tiếp tục lượt đang làm.
          </p>
          <div className="study-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={launch.pending}
              onClick={() =>
                void launch.start({
                  source: { type: "PRACTICE_SET", practiceSetId: id },
                  mode: "PRACTICE",
                })
              }
            >
              {launch.pending
                ? "Đang mở lượt..."
                : launch.hasRetry
                  ? "Thử lại lượt vừa mở"
                  : "Bắt đầu luyện"}
            </button>
            <Link
              className="btn-ghost"
              href="/learn/results?category=TOEIC&status=IN_PROGRESS"
            >
              Bài TOEIC đang làm
            </Link>
          </div>
          {launch.failure && (
            <ErrorState variant="inline" message={launch.failure} />
          )}
        </>
      )}
    </section>
  );
}

export function ToeicHome() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const part = params.get("part") ?? "";
  const difficulty = params.get("difficulty") ?? "";
  const page = /^\d+$/.test(params.get("page") ?? "")
    ? Math.min(Number(params.get("page")), 100000)
    : 0;
  const set = params.get("set");
  const load = useCallback(
    (signal: AbortSignal) =>
      fetchPracticeSets({ q, partNumber: part, difficulty, page }, signal),
    [q, part, difficulty, page]
  );
  const { data, error, isLoading, reload } = useApiResource(load);
  const catalogParams = new URLSearchParams(params);
  catalogParams.delete("set");
  const back = `/learn/toeic${catalogParams.size ? `?${catalogParams}` : ""}`;
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    const form = new FormData(event.currentTarget);
    for (const field of ["q", "part", "difficulty"]) {
      const value = String(form.get(field) ?? "").trim();
      if (value) next.set(field, value);
    }
    router.push(`/learn/toeic${next.size ? `?${next}` : ""}`);
  }
  function paginate(next: number) {
    const query = new URLSearchParams(catalogParams);
    query.set("page", String(next - 1));
    router.push(`/learn/toeic?${query}`);
  }
  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">
          LUYỆN TOEIC / LISTENING & READING
        </span>
        <h1>
          Từng Part một. <em>Từng bước chắc hơn.</em>
        </h1>
        <p>
          Chọn bộ đề, luyện nghe và đọc, rồi xem lại đáp án sau khi nộp bài.
        </p>
      </div>
      {set ? (
        <SetDetail key={set} id={set} back={back} />
      ) : (
        <>
          <form
            key={`${q}/${part}/${difficulty}`}
            className="study-form"
            onSubmit={apply}
          >
            <label>
              Tìm bộ đề
              <input
                name="q"
                type="search"
                maxLength={100}
                defaultValue={q}
                placeholder="Tên bộ đề"
              />
            </label>
            <label>
              Part
              <select name="part" defaultValue={part}>
                <option value="">Tất cả Part</option>
                {partLabels.map((label, index) => (
                  <option key={index} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Độ khó
              <select name="difficulty" defaultValue={difficulty}>
                <option value="">Tất cả mức độ</option>
                {Object.entries(difficultyLabel).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn-primary" type="submit">
              Tìm bộ đề
            </button>
          </form>
          <div className="study-actions">
            <Link
              href="/learn/results?category=TOEIC&status=IN_PROGRESS"
              className="btn-ghost"
            >
              Tiếp tục bài đang làm
            </Link>
            <Link href="/learn/results?category=TOEIC" className="btn-ghost">
              Kết quả TOEIC
            </Link>
          </div>
          {error && <ErrorState message={error} onRetry={reload} />}
          {isLoading && <p role="status">Đang tải bộ đề...</p>}
          {data && !isLoading && !error && (
            <>
              {data.items.length === 0 ? (
                <EmptyState title="Chưa có bộ đề phù hợp">
                  Thử thay bộ lọc hoặc quay lại khi có nội dung mới.
                </EmptyState>
              ) : (
                <div className="toeic-catalog">
                  {data.items.map((item) => {
                    const query = new URLSearchParams(catalogParams);
                    query.set("set", item.id);
                    return (
                      <article key={item.id} className="glass-card study-card">
                        <span className="section-kicker">
                          {item.partNumber === null
                            ? "NHIỀU PART"
                            : `PART ${item.partNumber}`}
                        </span>
                        <h2>{item.title}</h2>
                        <p>
                          {item.questionCount === null
                            ? "Chọn câu khi bắt đầu"
                            : `${item.questionCount} câu`}
                          {item.groupCount > 0
                            ? ` · ${item.groupCount} nhóm`
                            : ""}
                          {item.difficulty
                            ? ` · ${difficultyLabel[item.difficulty]}`
                            : ""}
                        </p>
                        <p>
                          {item.timeLimitSeconds === null
                            ? "Không giới hạn thời gian"
                            : `${Math.ceil(item.timeLimitSeconds / 60)} phút`}
                        </p>
                        <Link
                          className="btn-primary"
                          href={`/learn/toeic?${query}`}
                        >
                          Xem bộ đề
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
              <Pagination
                page={page + 1}
                totalPages={data.totalPages}
                hasNext={data.hasNext}
                onChange={paginate}
                label="Phân trang bộ đề TOEIC"
                summary={`${data.totalItems} bộ đề`}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
