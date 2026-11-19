import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/components/brand";
import { Mascot } from "@/components/mascot";
import { AccountMenu } from "@/features/auth";
import { LearningContentTransition } from "./learning-content-transition";
import { LearningNav } from "./learning-nav";
import "../styles/learning.css";

/**
 * Khung của khu học tập: thanh bên kính (màn rộng), thanh đầu kèm menu tài khoản, thanh điều hướng
 * cuộn ngang (màn hẹp) và chân trang.
 */
export function LearningShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="learning-shell app-pastel-bg">
      <aside className="learning-sidebar glass-card">
        <Brand />
        <span className="sidebar-caption">KHÔNG GIAN HỌC</span>
        <Suspense fallback={null}>
          <LearningNav />
        </Suspense>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Mascot expression="happy" idSuffix="-side" className="side-mascot" />
            <strong>Cứ bắt đầu từ một bước nhỏ.</strong>
            <p>Mọi hành trình đều có điểm khởi đầu.</p>
          </div>
          <Link href="/" className="back-home">
            ← Về trang chủ
          </Link>
        </div>
      </aside>

      <div className="learning-main">
        <header className="learning-topbar glass-card">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="topbar-label">KHÔNG GIAN HỌC</span>
          <AccountMenu />
        </header>

        <div className="mobile-learning-nav">
          <Suspense fallback={null}>
            <LearningNav />
          </Suspense>
        </div>

        <LearningContentTransition>{children}</LearningContentTransition>

        <footer className="learning-footer">
          <span>© 2026 MasterEnglish · Học theo nhịp của bạn.</span>
          <nav aria-label="Liên kết khu học tập">
            <Link href="/learn/vocabulary">Từ vựng</Link>
            <Link href="/learn/toeic">TOEIC</Link>
            <Link href="/">Trang chủ</Link>
          </nav>
          <small>Bản xem trước: một phần nội dung là dữ liệu minh họa.</small>
        </footer>
      </div>
    </div>
  );
}
