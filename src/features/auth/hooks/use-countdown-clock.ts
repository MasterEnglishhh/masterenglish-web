"use client";

import { useEffect, useState } from "react";

/**
 * Đồng hồ cho các bộ đếm lùi (chờ gửi lại OTP, bị chặn do quá nhiều lần thử, hạn OTP...).
 * Tích tắc mỗi giây và cho biết còn bao nhiêu giây tới một mốc thời gian.
 *
 * - `keepTicking`: giữ đồng hồ chạy bất kể mốc chặn (vd. đang đếm hạn của OTP).
 * - `blockedUntil`: mốc chặn muộn nhất (ms); còn ở tương lai thì đồng hồ cũng chạy.
 */
export function useCountdownClock(keepTicking: boolean, blockedUntil: number) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!keepTicking && blockedUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [keepTicking, blockedUntil]);
  return {
    /** Số giây còn lại tới `until` (làm tròn lên, không âm). */
    remaining: (until: number) => Math.max(0, Math.ceil((until - now) / 1000)),
    /**
     * Cập nhật đồng hồ ngay và trả về thời điểm đó. Gọi trước khi đặt một mốc mới để bộ đếm
     * hiện đúng số giây ngay, không chờ nhịp kế tiếp.
     */
    syncNow: () => {
      const time = Date.now();
      setNow(time);
      return time;
    },
  };
}
