"use client";

import { useEffect, useState } from "react";
import { Mascot, type MascotExpression } from "@/components/mascot";

/**
 * Linh vật nhỏ ở góc màn hình (chỉ màn rộng). Theo dõi khối nằm giữa khung nhìn và đổi biểu cảm theo
 * thuộc tính data-mood của khối đó. Khối không khai báo (hero, lộ trình, kêu gọi cuối) đã có linh vật riêng nên ẩn.
 */
export function MascotGuide() {
  const [mood, setMood] = useState<MascotExpression | null>(null);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-mood]");
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const value = (entry.target as HTMLElement).dataset.mood;
          setMood(value === "none" ? null : (value as MascotExpression));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`lp-guide ${mood ? "is-visible" : ""}`} data-motion="pointer" aria-hidden="true">
      {/* key đổi theo biểu cảm để chạy lại hoạt ảnh "bật" mỗi lần đổi */}
      <Mascot key={mood ?? "none"} expression={mood ?? "happy"} idSuffix="-guide" className="lp-guide-mascot" />
    </div>
  );
}
