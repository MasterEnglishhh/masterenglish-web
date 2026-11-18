"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { BrandLogo } from "@/components/brand";
import { Mascot } from "@/components/mascot";
import { RouteTransition } from "@/components/route-transition";
import { useSlidingIndicator } from "@/lib/use-sliding-indicator";
import { AuthStage } from "./auth-stage";
import type { AuthMode } from "../types/auth";
import "../styles/auth.css";

const copy: Record<AuthMode, { eyebrow: string; title: string; description: string }> = {
  login: {
    eyebrow: "CHÀO MỪNG TRỞ LẠI",
    title: "Tiếp tục nhịp học của bạn.",
    description: "Đăng nhập để quay lại lộ trình, bài luyện và những điều bạn đang chinh phục.",
  },
  register: {
    eyebrow: "BẮT ĐẦU TỪ HÔM NAY",
    title: "Bắt đầu hành trình của riêng bạn.",
    description: "Một không gian cho tiếng Anh, một nhịp học dành riêng cho bạn.",
  },
  forgot: {
    eyebrow: "KHÔI PHỤC TÀI KHOẢN",
    title: "Mình cùng bắt đầu lại nhé.",
    description: "Xác minh email bằng mã OTP, rồi chọn một mật khẩu mới để quay lại nhịp học của bạn.",
  },
};

export interface AuthLayoutProps {
  children: React.ReactNode;
}

/** Thứ tự các trang để biết chiều trượt: đăng nhập, đăng ký, quên mật khẩu. */
const MODE_ORDER: Record<AuthMode, number> = { login: 0, register: 1, forgot: 2 };

function modeFromPath(pathname: string): AuthMode {
  if (pathname.startsWith("/register")) return "register";
  if (pathname.startsWith("/forgot-password")) return "forgot";
  return "login";
}

/**
 * Khung của ba trang tài khoản, đặt ở layout nên không bị dựng lại khi đổi trang.
 * Chế độ lấy từ đường dẫn; thanh tab có khối nền trượt, tiêu đề và form trượt vào theo chiều chuyển trang.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const mode = modeFromPath(usePathname());
  const tabsRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useSlidingIndicator(tabsRef, indicatorRef, mode);
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const querySuffix = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const current = copy[mode];

  return (
    <div className="auth-shell app-pastel-bg">
      <AuthStage mode={mode} />

      <main className="auth-main">
        <Link href="/" className="auth-back">
          ← Về trang chủ
        </Link>

        <section className={`glass-card auth-card ${mode === "register" ? "auth-card-wide" : ""}`}>
          <Mascot expression={mode === "register" ? "celebrating" : mode === "forgot" ? "thinking" : "happy"} idSuffix="-card" className="auth-card-mascot" />
          <Link href="/" className="brand auth-card-brand" aria-label="masterenglish, về trang chủ">
            <BrandLogo />
          </Link>

          <RouteTransition transitionKey={mode} order={MODE_ORDER[mode]}>
            <div className="auth-card-head">
              <span className="section-kicker">{current.eyebrow}</span>
              <h1>{current.title}</h1>
              <p>{current.description}</p>
            </div>
          </RouteTransition>

          {mode !== "forgot" && (
            <nav ref={tabsRef} className="auth-tabs" aria-label="Điều hướng tài khoản">
              <span ref={indicatorRef} className="slide-indicator" aria-hidden="true" />
              <Link
                href={`/login${querySuffix}`}
                className={mode === "login" ? "active" : ""}
                aria-current={mode === "login" ? "page" : undefined}
              >
                Đăng nhập
              </Link>
              <Link
                href={`/register${querySuffix}`}
                className={mode === "register" ? "active" : ""}
                aria-current={mode === "register" ? "page" : undefined}
              >
                Tạo tài khoản
              </Link>
            </nav>
          )}

          <RouteTransition transitionKey={mode} order={MODE_ORDER[mode]}>
          {children}

          <p className="auth-switch">
            {mode === "login" ? (
              <>
                Chưa có tài khoản? <Link href={`/register${querySuffix}`}>Bắt đầu tại đây</Link>
              </>
            ) : mode === "register" ? (
              <>
                Đã có tài khoản? <Link href={`/login${querySuffix}`}>Đăng nhập</Link>
              </>
            ) : (
              <Link href={`/login${querySuffix}`}>← Quay lại đăng nhập</Link>
            )}
          </p>
          </RouteTransition>
        </section>

        <p className="auth-footer">© 2026 MasterEnglish · Học theo nhịp của bạn.</p>
      </main>
    </div>
  );
}
