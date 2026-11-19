"use client";

import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { Mascot } from "@/components/mascot";
import { StatusBadge, type Status } from "@/components/status-badge";
import { useAuthSession } from "@/features/auth";
import { GoalCard } from "./goal-card";

const SHORTCUTS: { href: string; symbol: string; tone: string; title: string; body: string; status: Status }[] = [
  {
    href: "/learn/vocabulary",
    symbol: "Aa",
    tone: "mint",
    title: "Xây nền từ vựng",
    body: "Tra từ, lưu vào sổ tay và ôn đúng lúc sắp quên.",
    status: "available",
  },
  {
    href: "/learn/grammar",
    symbol: "{}",
    tone: "peach",
    title: "Hiểu rõ ngữ pháp",
    body: "Cấu trúc, ví dụ và cách dùng đặt cạnh nhau để dễ nhớ.",
    status: "soon",
  },
  {
    href: "/learn/toeic",
    symbol: "▷",
    tone: "lavender",
    title: "Luyện TOEIC từng Part",
    body: "Hiện có một câu Part 5 mẫu; các Part khác đang mở dần.",
    status: "rolling",
  },
];

/** Tên gọi thân mật: tên (từ cuối của họ tên tiếng Việt) nếu có, không thì bỏ trống lời chào. */
function greetingName(user: ReturnType<typeof useAuthSession>["user"]) {
  if (!user) return "";
  const full = user.displayName?.trim();
  return user.firstName || (full ? full.split(/\s+/).pop() : "") || "";
}

/** Trang tổng quan khu học: lời chào, gợi ý bắt đầu, lối tắt vào từng phần và thẻ mục tiêu. */
export function LearningHome() {
  const { user } = useAuthSession();
  const name = greetingName(user);

  return (
    <main className="learning-content">
      <header className="learning-heading">
        <span className="section-kicker">TỔNG QUAN / BẮT ĐẦU TỪ ĐÂY</span>
        <h1>
          {name ? `Chào ${name}, ` : "Chào bạn, "}
          <em>sẵn sàng học chứ?</em>
        </h1>
        <p>Chọn một phần phù hợp với bạn hôm nay. Mục tiêu và tiến độ cá nhân nằm ngay bên dưới.</p>
      </header>

      <section className="glass-card learning-spotlight">
        <div className="spotlight-copy">
          <span className="spotlight-eyebrow">GỢI Ý KHỞI ĐẦU</span>
          <h2>
            Mỗi ngày một chút, <em>vững vàng hơn.</em>
          </h2>
          <p>Bắt đầu bằng một phần ngắn: học vài từ mới, rồi ôn lại những từ sắp quên.</p>
          <Link className="btn-lime" href="/learn/vocabulary">
            Khám phá từ vựng <ArrowIcon />
          </Link>
        </div>
        <Mascot expression="happy" idSuffix="-home" className="spotlight-mascot" />
      </section>

      <section className="dashboard-body">
        <div>
          <h2 className="dashboard-title">Học theo cách của bạn</h2>
          <div className="learning-feature-list">
            {SHORTCUTS.map((item) => (
              <Link key={item.href} href={item.href} className="glass-card learning-feature">
                <span className={`feature-symbol symbol-${item.tone}`} aria-hidden="true">
                  {item.symbol}
                </span>
                <span className="feature-text">
                  <strong>{item.title}</strong>
                  <small>{item.body}</small>
                  <StatusBadge status={item.status} />
                </span>
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </div>
        <GoalCard />
      </section>
    </main>
  );
}
