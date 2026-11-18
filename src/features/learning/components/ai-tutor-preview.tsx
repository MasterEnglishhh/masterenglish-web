import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";

/** Trang AI Tutor: chưa có dữ liệu, chỉ giới thiệu và dẫn sang bài TOEIC mẫu. */
export function AiTutorPreview() {
  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">AI TUTOR / HIỂU SÂU CÂU ĐÃ LÀM</span>
        <h1>
          Còn thắc mắc?
          <br />
          <em>Cùng tìm lời giải.</em>
        </h1>
        <p>
          Sau khi hoàn thành bài luyện, bạn có thể hỏi thêm về một câu đã nộp và
          đọc lời giải chuẩn ngay tại đó.
        </p>
      </div>
      <div className="empty-page">
        <div className="empty-page-symbol">✳</div>
        <span>KHÔNG GIAN ĐANG CHỜ DỮ LIỆU</span>
        <h2>Chưa có câu đã nộp để hỏi AI Tutor.</h2>
        <p>
          Trang này sẽ lấy dữ liệu từ tài khoản và API học tập khi được kết nối.
          Hiện bạn có thể khám phá các màn hình mẫu.
        </p>
        <Link href="/learn/toeic" className="button button-dark">
          Xem bài TOEIC mẫu <ArrowIcon />
        </Link>
      </div>
    </main>
  );
}
