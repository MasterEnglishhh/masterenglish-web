"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminUserDetail } from "../lib/admin-client";
import type { AdminUser, UserRole } from "../types/user-management";

export type AdminUserDetailStatus = "loading" | "ready" | "error";

/**
 * Chi tiết mới nhất của một tài khoản (vai trò, phiên, lần đăng nhập gần nhất).
 * Trước khi tải xong, hoặc khi tải lỗi, hook trả về dữ liệu đang có trong danh sách.
 */
export function useAdminUserDetail(user: AdminUser) {
  const [loaded, setLoaded] = useState<{
    id: string;
    detail: AdminUser;
  } | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetchAdminUserDetail(user.id)
      .then((res) => {
        if (!active) return;
        if (res.success) {
          setLoaded({ id: user.id, detail: res.data });
          setFailedId(null);
        } else {
          setFailedId(user.id);
        }
      })
      .catch(() => {
        if (active) setFailedId(user.id);
      });
    return () => {
      active = false;
    };
  }, [user.id, attempt]);

  const isLoadedForUser = loaded?.id === user.id;
  const status: AdminUserDetailStatus = isLoadedForUser
    ? "ready"
    : failedId === user.id
      ? "error"
      : "loading";
  const detail = isLoadedForUser && loaded ? loaded.detail : user;

  const reload = useCallback(() => {
    setFailedId(null);
    setAttempt((count) => count + 1);
  }, []);

  return { detail, status, reload };
}

/**
 * Chỉ cho lưu vai trò khi chi tiết đã tải xong hoặc người quản trị đã tự chọn lại vai trò.
 * Tránh ghi đè vai trò mới hơn trên máy chủ bằng dữ liệu cũ của danh sách.
 */
export function canSaveUserRoles(
  editedRoles: UserRole[] | null,
  status: AdminUserDetailStatus
): boolean {
  return editedRoles !== null || status === "ready";
}
