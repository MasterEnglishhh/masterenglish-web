"use client";

import { useEffect, useRef } from "react";
import { Mascot } from "./mascot";

const SEEN_KEY = "me_intro_seen";
const DURATION_MS = 1200;

/**
 * Màn mở đầu ngắn, chỉ ở lần truy cập đầu. HTML tĩnh luôn mang thuộc tính `hidden`, nên công cụ tìm kiếm
 * và người dùng không bật JS vẫn thấy đủ nội dung; chỉ sau khi trang chạy ở trình duyệt mới bỏ `hidden`.
 * Bỏ qua khi giảm chuyển động hoặc khi không ghi được localStorage (không nhớ được thì không hiện, tránh lặp lại).
 */
export function IntroSplash() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
      if (!seen) localStorage.setItem(SEEN_KEY, "1");
    } catch {
      seen = true;
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.hidden = false;
    const timer = setTimeout(() => {
      el.hidden = true;
    }, DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={ref} className="lp-splash" hidden>
      <Mascot expression="celebrating" idSuffix="-splash" className="lp-splash-mascot" />
      <p className="lp-splash-word">
        master<span>english</span>
      </p>
      <button
        type="button"
        className="lp-splash-skip"
        onClick={() => {
          if (ref.current) ref.current.hidden = true;
        }}
      >
        SKIP ✳
      </button>
    </div>
  );
}
