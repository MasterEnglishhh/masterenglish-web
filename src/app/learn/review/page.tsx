import { Suspense } from "react";
import { ReviewView } from "@/features/vocabulary/components/review-view";

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
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", color: "var(--indigo)" }}>✳</div>
            <p style={{ fontSize: "14px", color: "#777", marginTop: "12px" }}>
              Đang tải hàng đợi thẻ đến hạn...
            </p>
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
