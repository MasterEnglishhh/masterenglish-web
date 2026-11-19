"use client";

import { useRef } from "react";
import { usePageMotion } from "../hooks/use-page-motion";

/** Phần tử gốc của landing: giữ biến chuyển động và áp phông Nunito. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  usePageMotion(ref);
  return (
    <div ref={ref} className={`lp-root`}>
      {children}
    </div>
  );
}
