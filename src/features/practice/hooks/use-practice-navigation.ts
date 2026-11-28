"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function usePracticeNavigation(dirty: boolean) {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      )
        return;
      const current = new URL(window.location.href);
      const next = new URL(anchor.href);
      if (
        next.origin !== current.origin ||
        (next.pathname === current.pathname && next.search === current.search)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setDestination(next.pathname + next.search + next.hash);
    };
    // Bắt cả liên kết trong bài lẫn điều hướng chung trước handler của Next Link.
    // shortcut: Back/Forward không phát click; cần history blocker để bảo vệ cả lượt điều hướng đó.
    window.addEventListener("click", prevent, { capture: true });
    return () =>
      window.removeEventListener("click", prevent, { capture: true });
  }, [dirty]);
  return {
    destination,
    stay: () => setDestination(null),
    leave: () => {
      if (destination) router.push(destination);
      setDestination(null);
    },
  };
}
