"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminUsers,
  lockAdminUser,
  revokeAdminUserSessions,
  unlockAdminUser,
  updateAdminUserRoles,
} from "../lib/admin-client";
import type { AdminUser, UserFilterState, UserRole } from "../types/user-management";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<UserFilterState>({
    search: "",
    role: "ALL",
    status: "ALL",
    page: 1,
    pageSize: 10,
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminUsers(filters);
      if (res.success) {
        setUsers(res.data.items);
        setTotalCount(res.data.totalItems);
        setTotalPages(Math.max(1, res.data.totalPages));
      } else {
        setError(res.error.message);
      }
    } catch {
      setError("Không thể tải danh sách tài khoản.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const toggleLockUser = async (userId: string, reason?: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (target.status === "LOCKED") {
      const res = await unlockAdminUser(userId);
      if (res.success) {
        await loadUsers();
      } else {
        alert(`Mở khóa thất bại: ${res.error.message}`);
      }
    } else {
      const lockReason = reason || "Khóa thủ công bởi quản trị viên";
      const res = await lockAdminUser(userId, lockReason);
      if (res.success) {
        await loadUsers();
      } else {
        alert(`Khóa tài khoản thất bại: ${res.error.message}`);
      }
    }
  };

  const updateUserRoles = async (userId: string, newRoles: UserRole[]) => {
    if (newRoles.length === 0) {
      alert("Tài khoản phải có tối thiểu 1 vai trò.");
      return;
    }
    const res = await updateAdminUserRoles(userId, newRoles);
    if (res.success) {
      await loadUsers();
    } else {
      alert(`Đổi vai trò thất bại: ${res.error.message}`);
    }
  };

  const revokeUserSessions = async (userId: string) => {
    const res = await revokeAdminUserSessions(userId);
    if (res.success) {
      alert(res.data.message || "Đã thu hồi toàn bộ phiên đăng nhập của người dùng.");
      await loadUsers();
    } else {
      alert(`Hủy phiên thất bại: ${res.error.message}`);
    }
  };

  return {
    users,
    totalCount,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    toggleLockUser,
    updateUserRoles,
    revokeUserSessions,
    refreshUsers: loadUsers,
  };
}
