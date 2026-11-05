"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import type { DueQueueResponse } from "../types/vocabulary";
import { fetchDueQueue } from "../lib/vocabulary-client";
import { FlashcardView } from "./flashcard-view";
import { VocabularyError } from "./vocabulary-view";
import Link from "next/link";

export function ReviewView() {
  const params = useSearchParams();
  const { user } = useAuthSession();
  const deckId = params.get("deck") || undefined;
  const [attempt, setAttempt] = useState(0);
  return (
    <ReviewQueue
      key={[user?.id, deckId, attempt].join(":")}
      deckId={deckId}
      reload={() => setAttempt((value) => value + 1)}
    />
  );
}
function ReviewQueue({
  deckId,
  reload,
}: {
  deckId?: string;
  reload: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<DueQueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void fetchDueQueue({ deckId, limit: 20 }).then((result) => {
      if (!active) return;
      if (result.success) setData(result.data);
      else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, [deckId]);
  if (error) return <VocabularyError message={error} retry={reload} />;
  if (!data) return <p role="status">Đang tải các thẻ đến hạn...</p>;
  if (data.cards.length === 0)
    return (
      <div className="empty-page">
        <h2>Không có thẻ đến hạn</h2>
        <p>Bạn có thể học từ mới hoặc quay lại khi đến lịch ôn tiếp theo.</p>
        <Link href="/learn/vocabulary">Học từ mới</Link>
      </div>
    );
  return (
    <>
      <p>
        {data.totalDue} thẻ đến hạn. Đang hiển thị {data.cards.length} thẻ trong
        lượt này.
      </p>
      <FlashcardView
        cards={data.cards}
        title="ÔN TẬP ĐẾN HẠN"
        onReloadQueue={reload}
        onBackToDecks={() => router.push("/learn/vocabulary")}
      />
      <button className="button button-light" onClick={reload}>
        Tải lại hàng đợi đến hạn
      </button>
    </>
  );
}
