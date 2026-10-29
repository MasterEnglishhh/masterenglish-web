import type { LearningNavigationItem } from "../types/learning";

export const learningNavigation = [
  { href: "/learn", label: "Tổng quan", icon: "◫" },
  { href: "/learn/vocabulary", label: "Từ vựng", icon: "Aa" },
  { href: "/learn/review", label: "Ôn tập", icon: "↺" },
  { href: "/learn/grammar", label: "Ngữ pháp", icon: "{}" },
  { href: "/learn/toeic", label: "Luyện TOEIC", icon: "▷" },
  { href: "/learn/results", label: "Kết quả", icon: "↗" },
  { href: "/learn/ai-tutor", label: "AI Tutor", icon: "✳" },
] as const satisfies readonly LearningNavigationItem[];
