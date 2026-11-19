import { RequireAuth } from "@/features/auth";
import { VocabularyPage } from "@/features/vocabulary";

export default function Page() {
  return (
    <RequireAuth>
      <VocabularyPage />
    </RequireAuth>
  );
}
