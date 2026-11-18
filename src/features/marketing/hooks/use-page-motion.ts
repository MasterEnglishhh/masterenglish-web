"use client";

import { useEffect, type RefObject } from "react";

/**
 * Một vòng lặp duy nhất cho cả trang: ghi vị trí con trỏ (--mx, --my trong -1..1) và tiến độ cuộn
 * (--sp trong 0..1) thẳng vào biến CSS. Không dùng state nên không render lại React.
 * Biến CSS được thừa kế, nên chỉ ghi vào các phần tử đánh dấu data-motion="pointer|scroll|both" thay vì
 * phần tử gốc; ghi vào gốc sẽ làm trình duyệt tính lại style của cả trang ở mỗi khung hình.
 * Vòng lặp tự dừng khi giá trị ổn định, và không chạy khi tab bị ẩn hoặc khi người dùng giảm chuyển động.
 */
export function usePageMotion(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-motion]"));
    const each = (kind: "pointer" | "scroll", fn: (el: HTMLElement) => void) =>
      targets.forEach((el) => {
        const mode = el.dataset.motion;
        if (mode === kind || mode === "both") fn(el);
      });
    let tx = 0, ty = 0, x = 0, y = 0, sp = -1, raf = 0;

    const apply = () => {
      raf = 0;
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (next !== sp) {
        sp = next;
        each("scroll", (el) => el.style.setProperty("--sp", next.toFixed(4)));
      }
      each("pointer", (el) => {
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
      if (Math.abs(tx - x) > 0.002 || Math.abs(ty - y) > 0.002) raf = requestAnimationFrame(apply);
    };
    const kick = () => {
      if (!raf && !document.hidden && !reduce.matches) raf = requestAnimationFrame(apply);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    const onVisibility = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else kick();
    };
    const onReduce = () => {
      if (reduce.matches) {
        tx = ty = x = y = 0;
        targets.forEach((el) => {
          el.style.removeProperty("--mx");
          el.style.removeProperty("--my");
          el.style.removeProperty("--sp");
        });
      } else kick();
    };

    // Hoạt ảnh vô hạn của khối nằm ngoài màn hình chỉ tốn CPU: đánh dấu để CSS tạm dừng chúng.
    const pauser = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
    });
    root.querySelectorAll("[data-pause]").forEach((el) => pauser.observe(el));

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onReduce);
    kick();
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onReduce);
      pauser.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}
