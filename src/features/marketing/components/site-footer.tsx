import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-main">
        <div className="footer-invitation">
          <span className="section-kicker">BƯỚC TIẾP THEO LÀ CỦA BẠN</span>
          <h2>Học hôm nay.<br /><em>Đi xa ngày mai.</em></h2>
          <Link className="button button-lime" href="/learn">Vào không gian học <ArrowIcon /></Link>
        </div>
        <nav className="footer-links" aria-label="Liên kết cuối trang">
          <div>
            <span>KHÁM PHÁ</span>
            <a href="#method">Cách học</a>
            <a href="#roadmap">Lộ trình</a>
            <a href="#experience">Trải nghiệm</a>
          </div>
          <div>
            <span>KHÔNG GIAN HỌC</span>
            <Link href="/learn/vocabulary">Từ vựng</Link>
            <Link href="/learn/grammar">Ngữ pháp</Link>
            <Link href="/learn/toeic">Luyện TOEIC</Link>
          </div>
          <div>
            <span>TÀI KHOẢN</span>
            <Link href="/login">Đăng nhập</Link>
            <Link href="/register">Tạo tài khoản</Link>
          </div>
        </nav>
      </div>
      <div className="wrap footer-bottom">
        <Brand />
        <p>Học có hướng. Tiến bộ có lý do.</p>
        <span>© 2026 MasterEnglish</span>
      </div>
    </footer>
  );
}
