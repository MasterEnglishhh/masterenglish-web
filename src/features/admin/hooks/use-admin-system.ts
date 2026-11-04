"use client";

import { useMemo, useState } from "react";
import {
  mockAiQuota,
  mockAuditLogs,
  mockFeatureFlags,
  mockStorageQuota,
} from "../data/mock-admin-system";
import type { AuditLogEntry, FeatureFlag } from "../types/system-policy";

export function useAdminSystem() {
  const [flags, setFlags] = useState<FeatureFlag[]>(mockFeatureFlags);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [logSearch, setLogSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        logSearch === "" ||
        log.actorEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(logSearch.toLowerCase());

      const matchEntity =
        selectedEntity === "ALL" || log.entityType === selectedEntity;

      return matchSearch && matchEntity;
    });
  }, [auditLogs, logSearch, selectedEntity]);

  const toggleFeatureFlag = (flagKey: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.key !== flagKey) return f;
        const nextState = !f.enabled;

        // Append real-time mock audit log entry
        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          actorEmail: "admin@masterenglish.edu.vn",
          action: "UPDATE_FEATURE_FLAG",
          entityType: "FEATURE_FLAG",
          entityId: f.key,
          details: `Chuyển cờ ${f.name} sang ${nextState ? "BẬT" : "TẮT"}`,
          ipAddress: "127.0.0.1 (Local)",
          timestamp: new Date().toISOString(),
          severity: "INFO",
        };
        setAuditLogs((currentLogs) => [newLog, ...currentLogs]);

        return {
          ...f,
          enabled: nextState,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  return {
    flags,
    storageQuota: mockStorageQuota,
    aiQuota: mockAiQuota,
    auditLogs: filteredLogs,
    totalLogs: filteredLogs.length,
    logSearch,
    setLogSearch,
    selectedEntity,
    setSelectedEntity,
    toggleFeatureFlag,
  };
}
