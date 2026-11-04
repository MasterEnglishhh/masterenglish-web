"use client";

import { useMemo, useState } from "react";
import { mockAdminUsers } from "../data/mock-admin-users";
import type { AdminUser, UserFilterState, UserRole, UserStatus } from "../types/user-management";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>(mockAdminUsers);
  const [filters, setFilters] = useState<UserFilterState>({
    search: "",
    role: "ALL",
    status: "ALL",
    page: 1,
    pageSize: 10,
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        filters.search === "" ||
        u.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        u.displayName.toLowerCase().includes(filters.search.toLowerCase());

      const matchRole =
        filters.role === "ALL" || u.roles.includes(filters.role);

      const matchStatus =
        filters.status === "ALL" || u.status === filters.status;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, filters]);

  const toggleLockUser = (userId: string, reason?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newStatus: UserStatus = u.status === "LOCKED" ? "ACTIVE" : "LOCKED";
        return {
          ...u,
          status: newStatus,
          lockReason: newStatus === "LOCKED" ? reason || "Khóa thủ công bởi quản trị viên" : undefined,
          lockedUntil: newStatus === "LOCKED" ? "2026-12-31T23:59:59Z" : null,
          activeSessionsCount: newStatus === "LOCKED" ? 0 : u.activeSessionsCount,
        };
      })
    );
  };

  const updateUserRoles = (userId: string, newRoles: UserRole[]) => {
    if (newRoles.length === 0) return; // Prevent stripping all roles
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roles: newRoles, authVersion: u.authVersion + 1 } : u))
    );
  };

  const revokeUserSessions = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, activeSessionsCount: 0, authVersion: u.authVersion + 1 } : u))
    );
  };

  return {
    users: filteredUsers,
    totalCount: filteredUsers.length,
    filters,
    setFilters,
    toggleLockUser,
    updateUserRoles,
    revokeUserSessions,
  };
}
