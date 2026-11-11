"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminKpis, fetchRecentActivities } from "../lib/admin-client";
import type { AdminKPI, RecentActivity } from "../types/admin";

export function useAdminOverview() {
  const [kpis, setKpis] = useState<AdminKPI[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [kpisRes, actRes] = await Promise.all([
        fetchAdminKpis(),
        fetchRecentActivities(10),
      ]);

      if (kpisRes.success) {
        setKpis(kpisRes.data);
      } else {
        setError(kpisRes.error.message);
      }

      if (actRes.success) {
        setActivities(actRes.data);
      }
    } catch {
      setError("Không thể tải dữ liệu tổng quan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return {
    kpis,
    activities,
    isLoading,
    error,
    refreshOverview: loadOverview,
  };
}
