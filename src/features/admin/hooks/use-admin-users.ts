"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLatestRequestTracker } from "@/lib/latest-request";
import {
  fetchAdminUsers,
  lockAdminUser,
  revokeAdminUserSessions,
  unlockAdminUser,
  updateAdminUserRoles,
  type AdminResult,
} from "../lib/admin-client";
import type { AdminUser, UserFilterState, UserRole } from "../types/user-management";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const [filters, setFilterState] = useState<UserFilterState>({
    search: "",
    role: "ALL",
    status: "ALL",
    page: 1,
    pageSize: 10,
  });
  const currentFilters = useRef(filters);

  // Phản hồi của lần tải cũ không được ghi đè lần tải mới (gõ tìm kiếm nhanh, đổi trang).
  const requests = useRef(createLatestRequestTracker());

  const setFilters = useCallback((next: UserFilterState) => {
    const current = currentFilters.current;
    if (next.search !== current.search || next.role !== current.role || next.status !== current.status || next.pageSize !== current.pageSize) {
      next = { ...next, page: 1 };
    }
    requests.current.invalidate();
    currentFilters.current = next;
    setFilterState(next);
    setIsLoading(true);
    setError(null);
  }, []);

  const loadUsers = useCallback(async (query = currentFilters.current) => {
    const ticket = requests.current.begin();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminUsers(query);
      if (!requests.current.isCurrent(ticket)) return;
      if (res.success) {
        const lastPage = Math.max(1, res.data.totalPages);
        setTotalPages(lastPage);
        if (query.page > lastPage) {
          setFilters({ ...query, page: lastPage });
          return;
        }
        setUsers(res.data.items);
        setTotalCount(res.data.totalItems);
      } else {
        setError(res.error.message);
      }
    } catch {
      if (!requests.current.isCurrent(ticket)) return;
      setError("Không thể tải danh sách tài khoản.");
    }
    setIsLoading(false);
  }, [setFilters]);

  useEffect(() => {
    const tracker = requests.current;
    const timer = setTimeout(() => {
      void loadUsers(filters);
    }, 250);
    return () => {
      clearTimeout(timer);
      tracker.invalidate();
    };
  }, [filters, loadUsers]);

  const saveUserChange = async (save: () => Promise<AdminResult<AdminUser>>, failureLabel: string) => {
    setMutationError(null);
    setNotice(null);
    try {
      const res = await save();
      if (res.success) {
        await loadUsers();
        return true;
      }
      setMutationError(`${failureLabel}. ${res.error.message}`);
    } catch {
      setMutationError(`${failureLabel}. Vui lòng thử lại.`);
    }
    return false;
  };

  const toggleLockUser = (user: AdminUser, reason?: string) => user.status === "LOCKED"
    ? saveUserChange(() => unlockAdminUser(user.id), "Mở khóa thất bại")
    : saveUserChange(
        () => lockAdminUser(user.id, reason?.trim() || "Khóa thủ công bởi quản trị viên"),
        "Khóa tài khoản thất bại"
      );

  const updateUserRoles = async (userId: string, newRoles: UserRole[]) => {
    if (newRoles.length === 0) {
      setMutationError("Tài khoản phải có tối thiểu 1 vai trò.");
      return false;
    }
    return saveUserChange(() => updateAdminUserRoles(userId, newRoles), "Đổi vai trò thất bại");
  };

  const revokeUserSessions = async (userId: string) => {
    setRevokeError(null);
    setNotice(null);
    const res = await revokeAdminUserSessions(userId);
    if (res.success) {
      setNotice(res.data.message || "Đã thu hồi toàn bộ phiên đăng nhập của người dùng.");
      await loadUsers();
    } else {
      setRevokeError(`Hủy phiên thất bại. ${res.error.message}`);
    }
  };

  return {
    users,
    totalCount,
    totalPages,
    isLoading,
    error,
    mutationError,
    revokeError,
    notice,
    filters,
    setFilters,
    toggleLockUser,
    updateUserRoles,
    revokeUserSessions,
    refreshUsers: () => loadUsers(),
  };
}
