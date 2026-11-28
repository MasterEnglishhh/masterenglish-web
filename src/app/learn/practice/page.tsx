import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth";
import { PracticePage } from "@/features/practice";
export const metadata: Metadata = { title: "Bài luyện | MasterEnglish" };
export default function Page() {
  return (
    <RequireAuth>
      <Suspense fallback={<p role="status">Đang mở bài luyện...</p>}>
        <PracticePage />
      </Suspense>
    </RequireAuth>
  );
}
