import { Suspense } from "react";
import { Mascot } from "@/components/mascot";
import { ReviewView } from "@/features/vocabulary";

export default function ReviewPage() {
  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">ÔN TẬP / TRỞ LẠI ĐÚNG LÚC</span>
        <h1>
          Nhớ lâu hơn,
          <br />
          <em>không cần vội.</em>
        </h1>
        <p>
          Những từ vựng đến hạn ôn tập sẽ xuất hiện tại đây theo tiến độ học
          thực tế của bạn. Đánh giá lại mức độ ghi nhớ để gia hạn khoảng cách ôn
          tiếp theo.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="page-loading" role="status">
            <Mascot expression="thinking" idSuffix="-review-loading" className="page-loading-mascot" />
            <p>Đang tải hàng đợi thẻ đến hạn...</p>
          </div>
        }
      >
        <ReviewView />
      </Suspense>

      <div className="info-line">
        <span>✳</span>
        <p>
          Hệ thống sử dụng thuật toán SM-2 với 3 mức đánh giá (Quên, Khó, Đã
          nhớ) để tự động điều chỉnh khoảng cách ôn tập, giúp củng cố trí nhớ
          dài hạn hiệu quả.
        </p>
      </div>
    </main>
  );
}
