"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#dedbfd", "#c7f2dc", "#ffe1cb", "#d9f586", "#b9b4f7"];

interface Spark {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  star: boolean;
  color: string;
}

/** Hạt sáng pastel rất nhẹ. Tự dừng khi ngoài màn hình hoặc tab ẩn, và chỉ vẽ một khung tĩnh nếu giảm chuyển động. */
export function SparkleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let sparks: Spark[] = [];

    const seed = () => {
      const n = w < 768 ? 14 : 28;
      sparks = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 3.5,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.08 - Math.random() * 0.2,
        phase: Math.random() * 6.28,
        star: i % 4 === 0,
        color: COLORS[i % COLORS.length],
      }));
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of sparks) {
        ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t / 900 + s.phase);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        if (s.star) {
          const k = s.r * 2.2;
          const j = k * 0.28;
          ctx.moveTo(s.x, s.y - k);
          ctx.lineTo(s.x + j, s.y - j);
          ctx.lineTo(s.x + k, s.y);
          ctx.lineTo(s.x + j, s.y + j);
          ctx.lineTo(s.x, s.y + k);
          ctx.lineTo(s.x - j, s.y + j);
          ctx.lineTo(s.x - k, s.y);
          ctx.lineTo(s.x - j, s.y - j);
          ctx.closePath();
        } else {
          ctx.arc(s.x, s.y, s.r, 0, 6.28);
        }
        ctx.fill();
      }
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(0);
    };
    const start = () => {
      if (!raf && visible && !document.hidden && !reduce.matches) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    function loop(t: number) {
      raf = 0;
      for (const s of sparks) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.y < -10) {
          s.y = h + 10;
          s.x = Math.random() * w;
        }
        if (s.x < -10) s.x = w + 10;
        else if (s.x > w + 10) s.x = -10;
      }
      draw(t);
      start();
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    const ro = new ResizeObserver(resize);
    const onVisibility = () => (document.hidden ? stop() : start());
    const onReduce = () => {
      if (reduce.matches) {
        stop();
        draw(0);
      } else start();
    };
    io.observe(canvas);
    ro.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onReduce);
    resize();
    start();
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  return <canvas ref={ref} className="lp-sparkle" aria-hidden="true" />;
}
