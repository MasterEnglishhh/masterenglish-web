"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/http";
import { useApiResource } from "@/lib/use-api-resource";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/notification-client";
import type { NotificationFilters } from "../types/notification";

export function useLearnerNotifications({
  page = 0,
  type = "",
  unreadOnly = false,
}: NotificationFilters) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [feed, unread] = await Promise.all([
        fetchNotifications({ page, size: 20, type, unreadOnly }, signal),
        fetchUnreadCount(signal),
      ]);
      if (!feed.ok) return feed;
      if (!unread.ok) return unread;
      return {
        ok: true as const,
        status: 200,
        data: { feed: feed.data, count: unread.data.count },
      };
    },
    [page, type, unreadOnly]
  );
  const resource = useApiResource(load);
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const current = new AbortController();
    controller.current = current;
    return () => current.abort();
  }, []);

  const mark = async (id?: string) => {
    if (pending.current) return false;
    const signal = controller.current?.signal;
    if (!signal || signal.aborted) return false;
    pending.current = true;
    setIsMutating(true);
    setActionError(null);
    try {
      const result =
        id === undefined
          ? await markAllNotificationsRead(signal)
          : await markNotificationRead(id, signal);
      if (signal.aborted) return false;
      if (!result.ok) {
        setActionError(apiErrorMessage(result));
        return false;
      }
      resource.reload();
      return true;
    } catch {
      if (!signal.aborted)
        setActionError("Chưa cập nhật được thông báo. Vui lòng thử lại.");
      return false;
    } finally {
      pending.current = false;
      if (!signal.aborted) setIsMutating(false);
    }
  };
  return {
    ...resource,
    isMutating,
    actionError,
    markRead: (id: string) => mark(id),
    markAllRead: () => mark(),
  };
}
