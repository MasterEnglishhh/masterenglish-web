"use client";

import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import { UserTable } from "@/features/admin/components/users/user-table";

export default function AdminUsersPage() {
  const {
    users,
    totalCount,
    filters,
    setFilters,
    toggleLockUser,
    updateUserRoles,
    revokeUserSessions,
  } = useAdminUsers();

  return (
    <div>
      <div className="admin-heading">
        <span className="admin-kicker">QUẢN TRỊ TÀI KHOẢN & PHÂN QUYỀN</span>
        <h1 className="admin-title">
          Quản lý Người dùng & <em>Phân quyền</em>
        </h1>
        <p className="admin-description">
          Tra cứu tài khoản, gán/thu hồi vai trò quản trị (SYSTEM_ADMIN, CONTENT_ADMIN), kiểm soát trạng thái khóa và quản lý các phiên đăng nhập đang hoạt động.
        </p>
      </div>

      <UserTable
        users={users}
        totalCount={totalCount}
        filters={filters}
        onFilterChange={setFilters}
        onToggleLock={toggleLockUser}
        onUpdateRoles={updateUserRoles}
        onRevokeSessions={revokeUserSessions}
      />
    </div>
  );
}
