"use client";

import { useState } from "react";
import { Key, LogOut, ShieldAlert } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { AdminFilterBar } from "../admin-filter-bar";
import type { AdminUser, UserFilterState, UserRole, UserStatus } from "../../types/user-management";
import { UserLockModal } from "./user-lock-modal";
import { UserRoleModal } from "./user-role-modal";

interface UserTableProps {
  users: AdminUser[];
  totalCount: number;
  totalPages?: number;
  isLoading?: boolean;
  filters: UserFilterState;
  onFilterChange: (filters: UserFilterState) => void;
  onToggleLock: (userId: string, reason?: string) => void;
  onUpdateRoles: (userId: string, roles: UserRole[]) => void;
  onRevokeSessions: (userId: string) => void;
}

const ROLE_BADGE: Record<UserRole, string> = {
  SYSTEM_ADMIN: "badge-role-admin",
  CONTENT_ADMIN: "badge-role-content",
  LEARNER: "badge-role-learner",
};

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "ACTIVE") return <span className="admin-badge badge-active">Hoạt động</span>;
  if (status === "LOCKED") return <span className="admin-badge badge-locked">Đã khóa</span>;
  if (status === "PENDING_VERIFICATION") return <span className="admin-badge badge-draft">Chờ OTP</span>;
  return <span className="admin-badge">{status}</span>;
}

export function UserTable({
  users,
  totalCount,
  totalPages = 1,
  isLoading = false,
  filters,
  onFilterChange,
  onToggleLock,
  onUpdateRoles,
  onRevokeSessions,
}: UserTableProps) {
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [lockModalUser, setLockModalUser] = useState<AdminUser | null>(null);

  return (
    <div>
      <AdminFilterBar
        search={filters.search}
        onSearchChange={(search) => onFilterChange({ ...filters, search })}
        searchLabel="Tìm người dùng theo tên hoặc email"
        placeholder="Tìm theo tên hoặc email..."
      >
        <select
          className="admin-select"
          aria-label="Lọc theo vai trò"
          value={filters.role}
          onChange={(e) => onFilterChange({ ...filters, role: e.target.value as UserRole | "ALL" })}
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
          <option value="CONTENT_ADMIN">CONTENT_ADMIN</option>
          <option value="LEARNER">LEARNER</option>
        </select>
        <select
          className="admin-select"
          aria-label="Lọc theo trạng thái"
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as UserStatus | "ALL" })}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động (Active)</option>
          <option value="LOCKED">Đã khóa (Locked)</option>
          <option value="PENDING_VERIFICATION">Chờ OTP</option>
        </select>
      </AdminFilterBar>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Phiên hoạt động</th>
              <th>Đăng nhập cuối</th>
              <th className="cell-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="cell-empty">
                  Không tìm thấy người dùng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-name">{u.displayName}</div>
                    <div className="cell-sub">{u.email}</div>
                  </td>
                  <td>
                    <div className="admin-chip-row">
                      {u.roles.map((r) => (
                        <span key={r} className={`admin-badge ${ROLE_BADGE[r] ?? "badge-role-learner"}`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td>
                    <strong>{u.activeSessionsCount}</strong> phiên
                  </td>
                  <td className="cell-sub">{u.lastLoginAt || "Chưa có"}</td>
                  <td className="cell-right">
                    <div className="admin-row-actions">
                      <button type="button" className="btn-ghost btn-sm" title="Phân vai trò" onClick={() => setRoleModalUser(u)}>
                        <Key size={13} aria-hidden="true" /> Vai trò
                      </button>
                      {u.activeSessionsCount > 0 && (
                        <button
                          type="button"
                          className="btn-ghost btn-sm"
                          title="Thu hồi phiên (Revoke Session)"
                          onClick={() => onRevokeSessions(u.id)}
                        >
                          <LogOut size={13} aria-hidden="true" /> Hủy phiên
                        </button>
                      )}
                      <button
                        type="button"
                        className={u.status === "LOCKED" ? "btn-lime btn-sm" : "btn-danger-soft btn-sm"}
                        title={u.status === "LOCKED" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        onClick={() => setLockModalUser(u)}
                      >
                        <ShieldAlert size={13} aria-hidden="true" /> {u.status === "LOCKED" ? "Mở khóa" : "Khóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          className="admin-pagination"
          label="Phân trang người dùng"
          page={filters.page}
          totalPages={totalPages}
          busy={isLoading}
          onChange={(page) => onFilterChange({ ...filters, page })}
          summary={
            <>
              Hiển thị <strong>{users.length}</strong> / <strong>{totalCount}</strong> tài khoản
            </>
          }
        />
      </div>

      {roleModalUser && (
        <UserRoleModal user={roleModalUser} onClose={() => setRoleModalUser(null)} onSave={onUpdateRoles} />
      )}
      {lockModalUser && (
        <UserLockModal user={lockModalUser} onClose={() => setLockModalUser(null)} onConfirm={onToggleLock} />
      )}
    </div>
  );
}
