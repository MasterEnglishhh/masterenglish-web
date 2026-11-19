import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";

/** Trang AI Tutor: chưa có dữ liệu, chỉ giới thiệu và dẫn sang bài TOEIC mẫu. */
export function AiTutorPreview() {
  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">AI TUTOR / HIỂU SÂU CÂU ĐÃ LÀM</span>
        <h1>
          Còn thắc mắc? <em>Cùng tìm lời giải.</em>
        </h1>
        <p>
          Sau khi hoàn thành bài luyện, bạn có thể hỏi thêm về một câu đã nộp và đọc lời giải chuẩn ngay tại đó.
        </p>
        <StatusBadge status="soon" />
      </div>
      <EmptyState
        title="Chưa có câu đã nộp để hỏi AI Tutor."
        kicker="KHÔNG GIAN ĐANG CHỜ DỮ LIỆU"
        mascot="thinking"
        idSuffix="-tutor"
        action={
          <Link href="/learn/toeic" className="btn-primary">
            Xem bài TOEIC mẫu <ArrowIcon />
          </Link>
        }
      >
        Tính năng hỏi đáp sau khi nộp bài sẽ mở khi dữ liệu học tập được kết nối. Hiện bạn có thể khám phá bài TOEIC
        mẫu.
      </EmptyState>
    </main>
  );
}
