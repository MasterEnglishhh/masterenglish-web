"use client";

import Link from "next/link";
import { useState } from "react";
import { AccountMenu, useAuthSession } from "@/features/auth";
import { NAV_LINKS } from "../data/content";
import { BrandLogo } from "./brand-logo";
import { PrimaryCta } from "./primary-cta";

export function NavbarSection() {
  const { user } = useAuthSession();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="lp-nav">
      <div className="lp-wrap lp-nav-bar">
        <Link href="/" className="lp-nav-brand" aria-label="masterenglish, về đầu trang">
          <BrandLogo />
        </Link>
        <nav id="lp-menu" className={`lp-nav-links ${open ? "is-open" : ""}`} aria-label="Điều hướng chính">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
            </a>
          ))}
          {user ? (
            <div className="lp-nav-extra lp-nav-extra-account">
              <AccountMenu />
              <PrimaryCta />
            </div>
          ) : (
            <div className="lp-nav-extra">
              <Link className="lp-nav-login" href="/login" onClick={close}>
                Đăng nhập
              </Link>
              <PrimaryCta />
            </div>
          )}
        </nav>
        <div className="lp-nav-actions">
          {user ? (
            <div className="lp-nav-account">
              <AccountMenu />
            </div>
          ) : (
            <Link className="lp-nav-login" href="/login">
              Đăng nhập
            </Link>
          )}
          <PrimaryCta className="lp-btn-sm" />
          <button
            type="button"
            className="lp-nav-toggle"
            aria-expanded={open}
            aria-controls="lp-menu"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
