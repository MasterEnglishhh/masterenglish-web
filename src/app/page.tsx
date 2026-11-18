import type { Metadata } from "next";
import { HomePage } from "@/features/marketing";

const title = "MasterEnglish — Học có hướng. Tiến bộ có lý do.";
const description =
  "Học từ vựng nhớ đúng lúc và chuẩn bị cho TOEIC Nghe – Đọc. Miễn phí hoàn toàn, dành cho người ôn thi và người học tiếng Anh mỗi ngày.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", locale: "vi_VN", siteName: "MasterEnglish" },
  twitter: { card: "summary", title, description },
};

export default function Home() {
  return <HomePage />;
}
