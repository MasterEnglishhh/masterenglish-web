import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";

export default function LearningHome() {
  return (
    <main className="learning-content">
      <div className="learning-heading">
        <div>
          <span className="section-kicker">TỔNG QUAN / BẮT ĐẦU TỪ ĐÂY</span>
          <h1>
            Chào bạn, <em>sẵn sàng học chứ?</em>
          </h1>
          <p>
            Chọn một phần phù hợp với bạn hôm nay. Tiến độ cá nhân sẽ xuất hiện khi tài khoản và dữ liệu học tập được kết nối.
          </p>
        </div>
        <div className="heading-mark" aria-hidden="true">✳</div>
      </div>

      <section className="learning-spotlight">
        <div className="spotlight-copy">
          <div className="spotlight-eyebrow">
            <span className="pulse-dot" /> GỢI Ý KHỞI ĐẦU
          </div>
          <h2>
            Mỗi ngày một chút,<br />
            <i>vững vàng hơn.</i>
          </h2>
          <p>
            Bắt đầu bằng một phần ngắn. Bạn có thể học từ mới, xem một cấu trúc hoặc luyện một Part TOEIC.
          </p>
          <Link className="button button-lime" href="/learn/vocabulary">
            Khám phá từ vựng <ArrowIcon />
          </Link>
        </div>
        <div className="spotlight-art" aria-hidden="true">
          <div className="spotlight-circle outer" />
          <div className="spotlight-circle inner" />
          <span className="spotlight-letter">A<span>✳</span></span>
          <div className="spotlight-tag">
            START SMALL<br />
            <b>GO FURTHER ↗</b>
          </div>
        </div>
      </section>

      <section className="dashboard-body">
        <div className="dashboard-primary">
          <div className="dashboard-section-head">
            <div>
              <span className="section-kicker">KHÁM PHÁ</span>
              <h2>Học theo cách của bạn</h2>
            </div>
            <span>01 — 03</span>
          </div>
          <div className="learning-feature-list">
            <Link href="/learn/vocabulary" className="learning-feature">
              <div className="feature-symbol symbol-mint">Aa</div>
              <div>
                <strong>Xây nền từ vựng</strong>
                <p>Khám phá từ và nghĩa trong ngữ cảnh. Thử lật một thẻ học mẫu.</p>
              </div>
              <ArrowIcon />
            </Link>
            <Link href="/learn/grammar" className="learning-feature">
              <div className="feature-symbol symbol-peach">{`{}`}</div>
              <div>
                <strong>Hiểu rõ ngữ pháp</strong>
                <p>Cấu trúc, ví dụ và cách dùng được đặt cạnh nhau để dễ nhớ.</p>
              </div>
              <ArrowIcon />
            </Link>
            <Link href="/learn/toeic" className="learning-feature">
              <div className="feature-symbol symbol-lavender">▷</div>
              <div>
                <strong>Luyện TOEIC từng Part</strong>
                <p>Đi từ Listening đến Reading, tập trung vào từng dạng câu hỏi.</p>
              </div>
              <ArrowIcon />
            </Link>
          </div>
        </div>
        <aside className="dashboard-aside">
          <div className="aside-head">
            <span className="section-kicker">LỘ TRÌNH CỦA BẠN</span>
            <span>↗</span>
          </div>
          <div className="empty-orbit" aria-hidden="true">
            <span>✳</span>
          </div>
          <h3>Trang học của riêng bạn đang chờ.</h3>
          <p>
            Tiến độ, bài đang làm và lịch ôn sẽ hiện ở đây khi kết nối tài khoản và API học tập.
          </p>
          <div className="aside-divider" />
          <span className="aside-caption">HIỆN TẠI · BẢN XEM TRƯỚC GIAO DIỆN</span>
        </aside>
      </section>
    </main>
  );
}
