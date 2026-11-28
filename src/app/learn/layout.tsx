import { LearningShell } from "@/features/learning";
import "@/components/study.css";

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return <LearningShell>{children}</LearningShell>;
}
