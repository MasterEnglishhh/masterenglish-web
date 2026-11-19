"use client";

import { useAdminUsers } from "../hooks/use-admin-users";
import { UserTable } from "./users/user-table";
import { RequireSystemAdmin } from "./require-admin";

export function AdminUsers() {
  return (
    <RequireSystemAdmin>
      <AdminUsersContent />
    </RequireSystemAdmin>
  );
}

function AdminUsersContent() {
  const {
    users,
    totalCount,
    totalPages,
    isLoading,
    error,
    notice,
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
          Tra cứu tài khoản, gán/thu hồi vai trò quản trị (SYSTEM_ADMIN,
          CONTENT_ADMIN), kiểm soát trạng thái khóa và quản lý các phiên đăng
          nhập đang hoạt động.
        </p>
      </div>

      {error && (
        <div role="alert" className="admin-alert">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="admin-notice">
          {notice}
        </div>
      )}

      <UserTable
        users={users}
        totalCount={totalCount}
        totalPages={totalPages}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onToggleLock={toggleLockUser}
        onUpdateRoles={updateUserRoles}
        onRevokeSessions={revokeUserSessions}
      />
    </div>
  );
}
