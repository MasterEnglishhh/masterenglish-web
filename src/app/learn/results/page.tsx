import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultsPage } from "@/features/results";
import { RequireAuth } from "@/features/auth";
export const metadata: Metadata = { title: "Kết quả | MasterEnglish" };
export default function Page() {
  return (
    <RequireAuth>
      <Suspense fallback={<p role="status">Đang mở kết quả...</p>}>
        <ResultsPage />
      </Suspense>
    </RequireAuth>
  );
}
