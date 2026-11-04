"use client";

import { useState } from "react";
import { mockAdminKpis, mockRecentActivities } from "../data/mock-admin-overview";
import type { AdminKPI, RecentActivity } from "../types/admin";

export function useAdminOverview() {
  const [kpis, setKpis] = useState<AdminKPI[]>(mockAdminKpis);
  const [activities, setActivities] = useState<RecentActivity[]>(mockRecentActivities);
  const [isLoading, setIsLoading] = useState(false);

  const refreshOverview = () => {
    setIsLoading(true);
    setTimeout(() => {
      setKpis([...mockAdminKpis]);
      setActivities([...mockRecentActivities]);
      setIsLoading(false);
    }, 250);
  };

  return {
    kpis,
    activities,
    isLoading,
    refreshOverview,
  };
}
