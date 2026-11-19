import { RequireAuth } from "@/features/auth";
import { LearningHome } from "@/features/learning";

export default function LearningHomePage() {
  return (
    <RequireAuth>
      <LearningHome />
    </RequireAuth>
  );
}
