import type { Metadata } from "next";
// globals.css phải đứng trước mọi import feature: thứ tự import CSS là thứ tự cascade,
// và CSS chung (ui.css) phải nạp trước CSS riêng của từng feature.
import "./globals.css";
import { AuthSessionProvider } from "@/features/auth";

export const metadata: Metadata = {
  title: "MasterEnglish — Học có hướng. Tiến bộ có lý do.",
  description:
    "Không gian học tiếng Anh và luyện TOEIC theo từng bước rõ ràng.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
