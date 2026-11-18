import { Lora, Nunito } from "next/font/google";

// Phông dùng cho cả ứng dụng, gắn một lần ở <html> trong app/layout.tsx.
// Cần cả subset latin vì chữ không dấu nằm ở đó, subset vietnamese chỉ chứa phần dấu.
export const nunito = Nunito({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-sans",
});

// Chữ nghiêng có chân cho từ nhấn <em>. Georgia in nghiêng thiếu glyph tiếng Việt (ế, ộ...), nên dùng Lora.
export const serif = Lora({
  subsets: ["vietnamese", "latin"],
  style: "italic",
  weight: ["600"],
  display: "swap",
  variable: "--font-serif",
});
