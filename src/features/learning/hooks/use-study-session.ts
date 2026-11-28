"use client";

import { useEffect, useState } from "react";
import {
  startStudySession,
  heartbeatStudySession,
  closeStudySession,
  type StudySession,
  type StudySource,
} from "../lib/study-session-client";

export function useStudySession(
  sourceType: StudySource,
  id: string,
  enabled = true
) {
  const [warning, setWarning] = useState<string | null>(null);
  const [todayActiveMinutes, setTodayActiveMinutes] = useState<number | null>(
    null
  );
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let stopped = false;
    let session: StudySession | null = null;
    let heartbeat: Promise<void> | null = null;
    let acquiring = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let release: (() => void) | undefined;
    const lifetime = new Promise<void>((resolve) => {
      release = resolve;
    });
    const active = () =>
      document.visibilityState === "visible" && document.hasFocus();
    function stop() {
      stopped = true;
      clearInterval(timer);
      release?.();
    }
    function tick() {
      if (disposed || stopped || !session || heartbeat) return;
      const current = session;
      heartbeat = (async () => {
        const result = await heartbeatStudySession(current.sessionId, {
          creditToken: current.creditToken,
          version: current.version,
          active: active(),
        });
        if (result.ok) {
          session = result.data;
          if (!disposed) setTodayActiveMinutes(result.data.todayActiveMinutes);
        } else {
          stop();
          if (!disposed)
            setWarning(
              result.status === 409
                ? "Ghi nhận thời gian đã dừng vì phiên học thay đổi ở nơi khác."
                : "Chưa ghi nhận được thời gian học. Bạn vẫn có thể tiếp tục bài học."
            );
        }
      })()
        .catch(() => {
          stop();
          if (!disposed) setWarning("Chưa ghi nhận được thời gian học.");
        })
        .finally(() => {
          heartbeat = null;
        });
    }
    async function run() {
      if (disposed) return;
      if (!active()) return;
      setWarning(null);
      const result = await startStudySession(sourceType, id);
      if (!result.ok) {
        if (result.status === 409) stopped = true;
        if (!disposed)
          setWarning(
            "Dịch vụ ghi nhận thời gian chưa khả dụng. Bạn vẫn có thể học bình thường."
          );
        return;
      }
      session = result.data;
      if (!disposed) {
        setTodayActiveMinutes(result.data.todayActiveMinutes);
        timer = setInterval(tick, 15_000);
      }
      await lifetime;
      await heartbeat;
      if (session && !session.closedAt)
        await closeStudySession(session.sessionId, session.creditToken);
    }
    // Khóa giữ trong suốt phiên, tab thứ hai không chiếm phiên đang ghi nhận.
    function wake() {
      if (session && !stopped) {
        tick();
        return;
      }
      if (disposed || stopped || acquiring || !active()) return;
      acquiring = true;
      void Promise.resolve()
        .then(async () => {
          if (navigator.locks)
            await navigator.locks.request(
              "masterenglish-study",
              { ifAvailable: true },
              async (lock) => {
                if (lock) await run();
                else if (!disposed)
                  setWarning("Thời gian học đang được ghi nhận ở tab khác.");
              }
            );
          else await run();
        })
        .catch(() => {
          if (!disposed) setWarning("Chưa ghi nhận được thời gian học.");
        })
        .finally(() => {
          acquiring = false;
        });
    }
    document.addEventListener("visibilitychange", wake);
    if (typeof window !== "undefined") {
      window.addEventListener("focus", wake);
      window.addEventListener("blur", tick);
    }
    wake();
    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", wake);
        window.removeEventListener("blur", tick);
      }
      release?.();
    };
  }, [sourceType, id, enabled]);
  return { warning: enabled ? warning : null, todayActiveMinutes };
}
