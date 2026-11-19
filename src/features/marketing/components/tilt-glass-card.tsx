"use client";

import { useRef } from "react";

/** Thẻ kính nghiêng theo góc chuột (chỉ chuột, bỏ qua cảm ứng). Ghi thẳng biến CSS, không dùng state. */
export function TiltGlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width - 0.5;
      const py = (clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(px * 9).toFixed(2)}deg`);
    });
  }
  function onLeave() {
    cancelAnimationFrame(raf.current);
    ref.current?.style.removeProperty("--rx");
    ref.current?.style.removeProperty("--ry");
  }

  return (
    <div ref={ref} className={`lp-glass lp-tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  );
}
