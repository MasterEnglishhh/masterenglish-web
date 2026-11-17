"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLatestRequestTracker } from "@/lib/latest-request";
import { fetchAdminKpis, fetchRecentActivities } from "../lib/admin-client";
import type { AdminKPI, RecentActivity } from "../types/admin";

export function useAdminOverview() {
  const [kpis, setKpis] = useState<AdminKPI[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const tracker = useRef(createLatestRequestTracker());

  useEffect(() => {
    const requests = tracker.current;
    const ticket = requests.begin();
    // Không gọi setState đồng bộ trong effect: trạng thái đang tải ban đầu là
    // `true`, còn lần tải lại do `refreshOverview` đặt trước khi tăng token.
    void (async () => {
      let message: string | null = null;
      let nextKpis: AdminKPI[] | null = null;
      let nextActivities: RecentActivity[] | null = null;
      try {
        const [kpisRes, actRes] = await Promise.all([
          fetchAdminKpis(),
          fetchRecentActivities(10),
        ]);
        if (kpisRes.success) nextKpis = kpisRes.data;
        else message = kpisRes.error.message;
        if (actRes.success) nextActivities = actRes.data;
        else message ??= actRes.error.message;
      } catch {
        message = "Không thể tải dữ liệu tổng quan.";
      }
      if (!requests.isCurrent(ticket)) return;
      if (nextKpis) setKpis(nextKpis);
      if (nextActivities) setActivities(nextActivities);
      setError(message);
      setIsLoading(false);
    })();
    return () => requests.invalidate();
  }, [reloadToken]);

  const refreshOverview = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadToken((value) => value + 1);
  }, []);

  return {
    kpis,
    activities,
    isLoading,
    error,
    refreshOverview,
  };
}
