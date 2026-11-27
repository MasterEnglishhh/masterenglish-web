import { RequireAuth } from "@/features/auth";
import { ToeicHome } from "@/features/toeic";
import { Suspense } from "react";

export default function ToeicPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p role="status">Đang mở danh sách bộ đề...</p>}>
        <ToeicHome />
      </Suspense>
    </RequireAuth>
  );
}
