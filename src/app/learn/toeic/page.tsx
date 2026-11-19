import { RequireAuth } from "@/features/auth";
import { ToeicHome } from "@/features/toeic";

export default function ToeicPage() {
  return (
    <RequireAuth>
      <ToeicHome />
    </RequireAuth>
  );
}
