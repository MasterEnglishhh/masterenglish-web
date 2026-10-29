import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/components/brand";
import { LearningNav } from "@/features/learning/components/learning-nav";

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="learning-shell">
      <aside className="learning-sidebar">
        <div className="sidebar-brand">
          <Brand />
        </div>
        <div className="sidebar-caption">KHÔNG GIAN HỌC</div>
        <Suspense fallback={null}>
          <LearningNav />
        </Suspense>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>✳</span>
            <strong>Cứ bắt đầu từ một bước nhỏ.</strong>
            <p>Mọi hành trình đều có điểm khởi đầu.</p>
          </div>
          <Link href="/" className="back-home">
            ← Về trang chủ
          </Link>
        </div>
      </aside>

      <div className="learning-main">
        <header className="learning-topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="topbar-label">BẢN XEM TRƯỚC / LEARNER SPACE</span>
          <span className="preview-badge">
            <span /> Dữ liệu minh họa
          </span>
        </header>

        <div className="mobile-learning-nav">
          <Suspense fallback={null}>
            <LearningNav />
          </Suspense>
        </div>

        {children}

        <footer className="learning-footer">
          <div className="learning-footer-invitation">
            <span className="learning-footer-symbol" aria-hidden="true">
              ✳
            </span>
            <div>
              <strong>Học theo nhịp của bạn.</strong>
              <p>Mỗi bước nhỏ đều đáng để bắt đầu.</p>
            </div>
            <Link href="/learn" className="learning-footer-cta">
              Về tổng quan <span>↗</span>
            </Link>
          </div>

          <div className="learning-footer-bottom">
            <span>© 2026 MasterEnglish</span>
            <nav aria-label="Liên kết khu học tập">
              <Link href="/learn/vocabulary">Từ vựng</Link>
              <Link href="/learn/grammar">Ngữ pháp</Link>
              <Link href="/learn/toeic">TOEIC</Link>
              <Link href="/login">Đăng nhập</Link>
              <Link href="/">Trang chủ</Link>
            </nav>
            <small>Bản xem trước · Dữ liệu minh họa</small>
          </div>
        </footer>
      </div>
    </div>
  );
}
