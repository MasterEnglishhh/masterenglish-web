import { RequireAuth } from "@/features/auth";
import { GrammarPreview } from "@/features/learning";

export default function GrammarPage() {
  return (
    <RequireAuth>
      <GrammarPreview />
    </RequireAuth>
  );
}
