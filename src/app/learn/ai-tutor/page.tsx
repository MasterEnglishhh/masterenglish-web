import { RequireAuth } from "@/features/auth";
import { AiTutorPreview } from "@/features/learning";

export default function AiTutorPage() {
  return (
    <RequireAuth>
      <AiTutorPreview />
    </RequireAuth>
  );
}
