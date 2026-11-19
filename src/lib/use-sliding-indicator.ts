"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Phần tử đang chọn trong thanh điều hướng/tab. */
const ACTIVE = '[aria-current="page"], [aria-pressed="true"], .active';

interface Options {
  /** Cuộn mục đang chọn vào vùng nhìn khi đổi mục (thanh cuộn ngang trên điện thoại). */
  scrollIntoView?: boolean;
}

/**
 * Cho khối nền của mục đang chọn trượt mượt giữa các mục.
 *
 * - `containerRef`: phần tử chứa các mục. Phải là phần tử định vị (position: relative) để đo `offsetLeft/offsetTop`.
 * - `indicatorRef`: `<span aria-hidden className="slide-indicator" />` đặt làm con trực tiếp của container.
 * - `activeKey`: giá trị đổi mỗi khi mục đang chọn đổi (vd. pathname).
 *
 * Chỉ ghi thẳng vào DOM (transform/width/height), không dùng state nên không render lại React.
 * Lần đo đầu tiên không chạy transition để chỉ báo không "bay" từ góc vào khi vừa tải trang.
 * Khi container đổi kích thước (xoay màn hình, hiện/ẩn thanh cuộn), chỉ báo được đo lại và trượt về vị trí mới.
 */
export function useSlidingIndicator(
  containerRef: RefObject<HTMLElement | null>,
  indicatorRef: RefObject<HTMLElement | null>,
  activeKey: string,
  { scrollIntoView = false }: Options = {}
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const measure = () => {
      const active = container.querySelector<HTMLElement>(ACTIVE);
      // Thanh đang ẩn (display: none) hoặc không có mục nào đang chọn: để CSS quay về kiểu tĩnh.
      if (!active || active.offsetParent === null) {
        container.removeAttribute("data-slide");
        return null;
      }
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
      container.dataset.slide = "on";
      return active;
    };

    const active = measure();
    const alreadyReady = container.dataset.slideReady === "true";

    if (!alreadyReady) {
      // Bật transition sau khung hình đầu, để vị trí ban đầu không bị trượt.
      const frame = requestAnimationFrame(() => {
        container.dataset.slideReady = "true";
      });
      return () => cancelAnimationFrame(frame);
    }

    if (scrollIntoView && active) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      active.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
  }, [containerRef, indicatorRef, activeKey, scrollIntoView]);

  // Đo lại khi kích thước container đổi (xoay màn hình, hiện/ẩn thanh cuộn, đổi phông). Không tắt transition ở đây:
  // đổi trang có thể làm thanh cuộn xuất hiện và kích hoạt lần đo này giữa lúc khối đang trượt.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const active = container.querySelector<HTMLElement>(ACTIVE);
      if (!active || active.offsetParent === null) {
        container.removeAttribute("data-slide");
        return;
      }
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
      container.dataset.slide = "on";
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, indicatorRef]);
}
