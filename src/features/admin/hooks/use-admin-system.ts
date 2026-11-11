"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAiQuotaMetrics,
  fetchAuditLogs,
  fetchFeatureFlags,
  fetchStorageQuota,
  updateFeatureFlag,
} from "../lib/admin-client";
import type {
  AiQuotaMetric,
  AuditLogEntry,
  FeatureFlag,
  StorageQuota,
} from "../types/system-policy";

export function useAdminSystem() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [aiQuota, setAiQuota] = useState<AiQuotaMetric[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logSearch, setLogSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSystemData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [flagsRes, storageRes, aiRes, logsRes] = await Promise.all([
        fetchFeatureFlags(),
        fetchStorageQuota(),
        fetchAiQuotaMetrics(),
        fetchAuditLogs(logSearch, selectedEntity, 0, 50),
      ]);

      if (flagsRes.success) setFlags(flagsRes.data);
      if (storageRes.success) setStorageQuota(storageRes.data);
      if (aiRes.success) setAiQuota(aiRes.data);
      if (logsRes.success) {
        setAuditLogs(logsRes.data.items);
        setTotalLogs(logsRes.data.totalItems);
      }
    } catch {
      setError("Không thể tải cấu hình hệ thống.");
    } finally {
      setIsLoading(false);
    }
  }, [logSearch, selectedEntity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSystemData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadSystemData]);

  const toggleFeatureFlag = async (flagKey: string) => {
    const targetFlag = flags.find((f) => f.key === flagKey);
    if (!targetFlag) return;
    const nextState = !targetFlag.enabled;

    // Optimistic UI update
    setFlags((prev) =>
      prev.map((f) => (f.key === flagKey ? { ...f, enabled: nextState } : f))
    );

    const res = await updateFeatureFlag(flagKey, nextState);
    if (!res.success) {
      // Revert if error
      setFlags((prev) =>
        prev.map((f) => (f.key === flagKey ? { ...f, enabled: !nextState } : f))
      );
      alert(`Không thể đổi trạng thái cờ: ${res.error.message}`);
    } else {
      // Reload audit logs to reflect the new update
      const logsRes = await fetchAuditLogs(logSearch, selectedEntity, 0, 50);
      if (logsRes.success) {
        setAuditLogs(logsRes.data.items);
        setTotalLogs(logsRes.data.totalItems);
      }
    }
  };

  return {
    flags,
    storageQuota: storageQuota || {
      bucket: "r2-masterenglish-media",
      usedBytes: 0,
      maxBytes: 107374182400,
      usedFormatted: "0 B",
      limitFormatted: "100 GB",
      percentUsed: 0,
      filesCount: 0,
    },
    aiQuota,
    auditLogs,
    totalLogs,
    logSearch,
    setLogSearch,
    selectedEntity,
    setSelectedEntity,
    isLoading,
    error,
    toggleFeatureFlag,
    refreshSystem: loadSystemData,
  };
}
