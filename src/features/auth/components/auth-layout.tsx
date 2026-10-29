"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/brand";
import { AuthArt } from "./auth-art";
import type { AuthMode } from "../types/auth";

const copy: Record<
  AuthMode,
  { eyebrow: string; title: string; description: string }
> = {
  login: {
    eyebrow: "CHÀO MỪNG TRỞ LẠI",
    title: "Tiếp tục nhịp học của bạn.",
    description:
      "Đăng nhập để quay lại lộ trình, bài luyện và những điều bạn đang chinh phục.",
  },
  register: {
    eyebrow: "BẮT ĐẦU TỪ HÔM NAY",
    title: "Một hành trình mới bắt đầu ở đây.",
    description:
      "Tạo tài khoản học viên để sau này lưu tiến độ và học theo mục tiêu của riêng bạn.",
  },
  forgot: {
    eyebrow: "KHÔI PHỤC TÀI KHOẢN",
    title: "Mình cùng bắt đầu lại nhé.",
    description:
      "Nhập email để tiếp tục quy trình đặt lại mật khẩu khi dịch vụ xác thực được kết nối.",
  },
};

export interface AuthLayoutProps {
  mode: AuthMode;
  children: React.ReactNode;
}

export function AuthLayout({ mode, children }: AuthLayoutProps) {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const querySuffix = redirectParam
    ? `?redirect=${encodeURIComponent(redirectParam)}`
    : "";

  const current = copy[mode];

  return (
    <div className="auth-shell">
      <AuthArt />

      <main className="auth-content">
        <header className="auth-header">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <Link href="/" className="auth-back">
            ← Về trang chủ
          </Link>
          <span className="auth-header-index">MASTERENGLISH / ACCOUNT</span>
        </header>

        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span className="section-kicker">{current.eyebrow}</span>
            <h1>{current.title}</h1>
            <p>{current.description}</p>
          </div>

          {mode !== "forgot" && (
            <nav className="auth-tabs" aria-label="Điều hướng tài khoản">
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

          {children}

          <div className="auth-switch">
            {mode === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <Link href={`/register${querySuffix}`}>
                  Bắt đầu tại đây ↗
                </Link>
              </>
            ) : mode === "register" ? (
              <>
                Đã có tài khoản?{" "}
                <Link href={`/login${querySuffix}`}>
                  Đăng nhập ↗
                </Link>
              </>
            ) : (
              <Link href={`/login${querySuffix}`}>
                ← Quay lại đăng nhập
              </Link>
            )}
          </div>
        </div>

        <footer className="auth-footer">
          <span>© 2026 MasterEnglish</span>
          <span>Học theo nhịp của bạn.</span>
        </footer>
      </main>
    </div>
  );
}
