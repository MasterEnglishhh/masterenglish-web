import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { SampleTag } from "@/components/sample-tag";
import { StatusBadge } from "@/components/status-badge";

/** Bài ngữ pháp minh họa (chưa kết nối API). */
export function GrammarPreview() {
  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">NGỮ PHÁP / TỪ CẤU TRÚC ĐẾN CÁCH DÙNG</span>
        <h1>
          Hiểu một cấu trúc. <em>Dùng được trong câu.</em>
        </h1>
        <p>Một trang bài học mẫu để xem cách nội dung và bài luyện có thể nằm cùng một mạch đọc.</p>
        <StatusBadge status="soon" />
      </div>
      <article className="glass-card grammar-lesson">
        <div className="grammar-side">
          <SampleTag />
          <div className="grammar-decoration">{`{ }`}</div>
          <p>Bài học minh họa 01</p>
        </div>
        <div className="grammar-body">
          <span className="grammar-category">NGỮ PHÁP CƠ BẢN</span>
          <h2>Present perfect</h2>
          <p className="grammar-lead">
            Dùng để nói về trải nghiệm hoặc một việc bắt đầu trong quá khứ và còn liên quan đến hiện tại.
          </p>
          <div className="formula">
            <span>CẤU TRÚC</span>
            <strong>have / has + past participle</strong>
          </div>
          <div className="example">
            <span>VÍ DỤ TRONG NGỮ CẢNH</span>
            <p>
              “I <b>have worked</b> here for three years.”
            </p>
            <small>Tôi đã làm việc ở đây được ba năm.</small>
          </div>
          <Link className="btn-primary" href="/learn/toeic">
            Thử một câu TOEIC <ArrowIcon />
          </Link>
        </div>
      </article>
      <p className="info-line">
        <span aria-hidden="true">✳</span>
        Đây là nội dung minh họa. Danh sách chủ điểm, bài học và trạng thái hoàn thành chưa kết nối API.
      </p>
    </main>
  );
}
