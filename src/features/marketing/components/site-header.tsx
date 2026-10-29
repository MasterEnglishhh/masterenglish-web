import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { Brand } from "@/components/brand";
import { AccountMenu } from "@/features/auth/components/account-menu";

export function SiteHeader() {
  return (
    <header className="public-header wrap">
      <Brand />
      <nav className="public-nav" aria-label="Điều hướng chính">
        <a href="#method">Cách học</a>
        <a href="#roadmap">Lộ trình</a>
        <a href="#experience">Trải nghiệm</a>
      </nav>
      <div className="header-actions">
        <AccountMenu />
        <Link className="header-cta" href="/learn">
          Vào không gian học <ArrowIcon />
        </Link>
      </div>
    </header>
  );
}
