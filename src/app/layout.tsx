import type { Metadata } from "next";
import { AuthSessionProvider } from "@/features/auth/components/auth-session-provider";
import "./globals.css";

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
    <html lang="vi" data-scroll-behavior="smooth">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
