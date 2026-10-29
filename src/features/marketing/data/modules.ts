import type { HomeModule } from "../types/module";

export const modules = [
  { number: "01", name: "Từ vựng", detail: "Học theo nghĩa, nhớ theo nhịp của bạn.", tone: "mint", glyph: "Aa", href: "/learn/vocabulary" },
  { number: "02", name: "Ngữ pháp", detail: "Từ cấu trúc đến cách dùng trong câu.", tone: "peach", glyph: "{ }", href: "/learn/grammar" },
  { number: "03", name: "Luyện TOEIC", detail: "Tập trung từng Part, hiểu từng lỗi sai.", tone: "lavender", glyph: "▶", href: "/learn/toeic" },
] as const satisfies readonly HomeModule[];
