import { Lora, Nunito } from "next/font/google";

// Phông chỉ áp cho landing (gắn ở MotionRoot), không đổi phông các trang khác.
// Cần cả subset latin vì chữ không dấu nằm ở đó, subset vietnamese chỉ chứa phần dấu.
export const nunito = Nunito({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

// Chữ nghiêng có chân cho từ nhấn mạnh. Georgia in nghiêng thiếu glyph tiếng Việt (ế, ộ...), nên dùng Lora.
export const serif = Lora({
  subsets: ["vietnamese", "latin"],
  style: "italic",
  weight: ["600"],
  display: "swap",
  variable: "--font-serif",
});
