import { RequireAuth } from "@/features/auth";
import { Suspense } from "react";
import { GrammarPageView } from "@/features/grammar";

export default function GrammarPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p role="status">Đang mở ngữ pháp...</p>}>
        <GrammarPageView />
      </Suspense>
    </RequireAuth>
  );
}
