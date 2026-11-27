"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLatestRequestTracker } from "@/lib/latest-request";
import {
  fetchAiQuotaMetrics,
  fetchAuditLogs,
  fetchFeatureFlags,
  fetchStorageQuota,
  updateFeatureFlag,
  type AdminResult,
} from "../lib/admin-client";
import type { AuditEntityFilter } from "../types/system-policy";

const LOG_PAGE_SIZE = 50;

interface SystemResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

function useSystemResource<T, Args extends unknown[]>(
  fetchData: (...args: Args) => Promise<AdminResult<T>>
) {
  const [state, setState] = useState<SystemResourceState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });
  const requests = useRef(createLatestRequestTracker());

  const reload = useCallback(
    async (...args: Args) => {
      const tracker = requests.current;
      const ticket = tracker.begin();
      setState((previous) => ({ ...previous, isLoading: true, error: null }));
      try {
        const result = await fetchData(...args);
        if (!tracker.isCurrent(ticket)) return;
        if (result.success)
          setState({ data: result.data, isLoading: false, error: null });
        else
          setState((previous) => ({
            ...previous,
            isLoading: false,
            error: result.error.message,
          }));
      } catch {
        if (tracker.isCurrent(ticket)) {
          setState((previous) => ({
            ...previous,
            isLoading: false,
            error: "Không thể tải dữ liệu hệ thống.",
          }));
        }
      }
    },
    [fetchData]
  );

  const invalidate = useCallback(() => requests.current.invalidate(), []);
  const markLoading = () => {
    invalidate();
    setState((previous) => ({ ...previous, isLoading: true, error: null }));
  };

  useEffect(() => invalidate, [invalidate]);

  return { ...state, reload, invalidate, markLoading, setState };
}

export function useAdminSystem() {
  const storage = useSystemResource(fetchStorageQuota);
  const ai = useSystemResource(fetchAiQuotaMetrics);
  const flags = useSystemResource(fetchFeatureFlags);
  const logs = useSystemResource(fetchAuditLogs);
  const [logFilter, setLogFilter] = useState({
    search: "",
    entity: "ALL" as AuditEntityFilter,
    page: 1,
  });
  const [logRevision, setLogRevision] = useState(0);
  const mutations = useRef(new Set<string>());
  const [pendingFlags, setPendingFlags] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [flagErrors, setFlagErrors] = useState<ReadonlyMap<string, string>>(
    () => new Map()
  );

  const { reload: reloadStorage } = storage;
  const { reload: reloadAi } = ai;
  const { reload: reloadFlags } = flags;
  const { reload: reloadLogs, invalidate: invalidateLogs } = logs;

  useEffect(() => {
    const timer = setTimeout(() => {
      void reloadStorage();
      void reloadAi();
      void reloadFlags();
    }, 0);
    return () => clearTimeout(timer);
  }, [reloadStorage, reloadAi, reloadFlags]);

  const loadLogs = useCallback(
    () =>
      reloadLogs(
        logFilter.search,
        logFilter.entity,
        logFilter.page - 1,
        LOG_PAGE_SIZE
      ),
    [logFilter, reloadLogs]
  );

  useEffect(() => {
    const timer = setTimeout(loadLogs, 250);
    return () => {
      clearTimeout(timer);
      invalidateLogs();
    };
  }, [loadLogs, logRevision, invalidateLogs]);

  const changeLogs = (filter: typeof logFilter) => {
    logs.markLoading();
    setLogFilter(filter);
  };

  const toggleFeatureFlag = async (key: string) => {
    const target = flags.data?.find((flag) => flag.key === key);
    if (!target || flags.isLoading || mutations.current.has(key)) return;
    mutations.current.add(key);
    setPendingFlags(new Set(mutations.current));
    setFlagErrors((previous) => {
      const next = new Map(previous);
      next.delete(key);
      return next;
    });

    try {
      const result = await updateFeatureFlag(key, !target.enabled);
      if (result.success) {
        flags.setState((previous) => ({
          ...previous,
          data:
            previous.data?.map((flag) =>
              flag.key === key ? result.data : flag
            ) ?? null,
        }));
        logs.markLoading();
        setLogRevision((revision) => revision + 1);
      } else {
        setFlagErrors((previous) =>
          new Map(previous).set(key, result.error.message)
        );
      }
    } catch {
      setFlagErrors((previous) =>
        new Map(previous).set(
          key,
          "Không thể đổi trạng thái cờ. Vui lòng thử lại."
        )
      );
    } finally {
      mutations.current.delete(key);
      setPendingFlags(new Set(mutations.current));
    }
  };

  return {
    storage,
    ai,
    flags: {
      ...flags,
      reload: () => {
        if (!mutations.current.size) return reloadFlags();
      },
    },
    logs: { ...logs, reload: loadLogs },
    logSearch: logFilter.search,
    setLogSearch: (search: string) =>
      changeLogs({ ...logFilter, search, page: 1 }),
    selectedEntity: logFilter.entity,
    setSelectedEntity: (entity: AuditEntityFilter) =>
      changeLogs({ ...logFilter, entity, page: 1 }),
    logPage: logFilter.page,
    setLogPage: (page: number) => changeLogs({ ...logFilter, page }),
    pendingFlags,
    flagErrors,
    toggleFeatureFlag,
  };
}
