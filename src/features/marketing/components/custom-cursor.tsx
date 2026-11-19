"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, summary, input, label, [data-cursor]";

/**
 * Vòng tròn mượt đi theo chuột, nở ra khi trỏ vào thứ bấm được. Chỉ chạy với chuột thật (hover + pointer fine)
 * và khi không giảm chuyển động. Không ẩn con trỏ hệ thống nên nếu vòng này lỗi, người dùng vẫn thấy con trỏ.
 */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      raf = 0;
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!el.classList.contains("is-on")) {
        x = tx;
        y = ty;
        el.classList.add("is-on");
      }
      el.classList.toggle("is-active", !!(e.target as Element | null)?.closest?.(INTERACTIVE));
      if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => el.classList.remove("is-on");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="lp-cursor" aria-hidden="true" />;
}
