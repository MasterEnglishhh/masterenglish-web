import { StatusBadge, type Status } from "@/components/status-badge";
import { ToeicPractice } from "./toeic-practice";
import "../styles/toeic.css";

const GROUPS: {
  index: string;
  kind: string;
  title: string;
  parts: { name: string; status: Status }[];
}[] = [
  {
    index: "01",
    kind: "LISTENING",
    title: "Nghe để nắm ý",
    parts: [
      { name: "Part 1 · Hình ảnh", status: "soon" },
      { name: "Part 2 · Hỏi đáp", status: "soon" },
      { name: "Part 3 · Hội thoại", status: "soon" },
      { name: "Part 4 · Bài nói", status: "soon" },
    ],
  },
  {
    index: "02",
    kind: "READING",
    title: "Đọc để hiểu sâu",
    parts: [
      { name: "Part 5 · Hoàn thành câu", status: "rolling" },
      { name: "Part 6 · Hoàn thành đoạn", status: "soon" },
      { name: "Part 7 · Đọc hiểu", status: "soon" },
    ],
  },
];

/** Trang luyện TOEIC: cấu trúc bài thi Listening & Reading, trạng thái từng Part và một câu Part 5 mẫu. */
export function ToeicHome() {
  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">LUYỆN TOEIC / LISTENING & READING</span>
        <h1>
          Từng Part một. <em>Từng bước chắc hơn.</em>
        </h1>
        <p>
          Bài thi chỉ đo Nghe và Đọc. Hiện mới có một câu Part 5 mẫu để bạn xem cách chọn và xem lại đáp án; kết quả
          chưa được lưu.
        </p>
      </div>
      <div className="part-groups">
        {GROUPS.map((group) => (
          <section key={group.kind} className="glass-card part-group">
            <div className="part-heading">
              <span>
                {group.index} / {group.kind}
              </span>
              <strong>{group.title}</strong>
            </div>
            <ul className="part-list">
              {group.parts.map((part) => (
                <li key={part.name}>
                  <span>{part.name}</span>
                  <StatusBadge status={part.status} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <ToeicPractice />
    </main>
  );
}
