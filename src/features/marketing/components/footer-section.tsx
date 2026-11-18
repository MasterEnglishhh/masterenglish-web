import Link from "next/link";
import { FOOTER_LINKS } from "../data/content";
import { BrandLogo } from "@/components/brand";

export function FooterSection() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-grid">
        <div>
          <BrandLogo />
          <p className="lp-footer-tag">Học có hướng. Tiến bộ có lý do.</p>
        </div>
        <nav aria-label="Liên kết cuối trang" className="lp-footer-links">
          <div>
            <span>Khám phá</span>
            {FOOTER_LINKS.explore.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div>
            <span>Tài khoản</span>
            {FOOTER_LINKS.account.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
      <p className="lp-wrap lp-copy">© 2026 MasterEnglish</p>
    </footer>
  );
}
