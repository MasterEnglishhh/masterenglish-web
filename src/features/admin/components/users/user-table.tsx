"use client";

import { useState } from "react";
import { Search, ShieldAlert, Key, LogOut } from "lucide-react";
import type { AdminUser, UserFilterState, UserRole, UserStatus } from "../../types/user-management";
import { UserRoleModal } from "./user-role-modal";
import { UserLockModal } from "./user-lock-modal";

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

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "SYSTEM_ADMIN":
        return "admin-badge badge-role-admin";
      case "CONTENT_ADMIN":
        return "admin-badge badge-role-content";
      default:
        return "admin-badge badge-role-learner";
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return <span className="admin-badge badge-active">Hoạt động</span>;
      case "LOCKED":
        return <span className="admin-badge badge-locked">Đã khóa</span>;
      case "PENDING_VERIFICATION":
        return <span className="admin-badge badge-draft">Chờ OTP</span>;
      default:
        return <span className="admin-badge">{status}</span>;
    }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên hoặc email..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            className="admin-select"
            value={filters.role}
            onChange={(e) =>
              onFilterChange({ ...filters, role: e.target.value as UserRole | "ALL" })
            }
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
            <option value="CONTENT_ADMIN">CONTENT_ADMIN</option>
            <option value="LEARNER">LEARNER</option>
          </select>

          <select
            className="admin-select"
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value as UserStatus | "ALL" })
            }
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="LOCKED">Đã khóa (Locked)</option>
            <option value="PENDING_VERIFICATION">Chờ OTP</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Phiên hoạt động</th>
              <th>Đăng nhập cuối</th>
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  Không tìm thấy người dùng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>{u.displayName}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.email}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {u.roles.map((r) => (
                        <span key={r} className={getRoleBadgeClass(r)}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{getStatusBadge(u.status)}</td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{u.activeSessionsCount}</span> phiên
                  </td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{u.lastLoginAt || "Chưa có"}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        type="button"
                        className="btn-3d-outline btn-sm"
                        title="Phân vai trò"
                        onClick={() => setRoleModalUser(u)}
                      >
                        <Key size={13} /> Vai trò
                      </button>

                      {u.activeSessionsCount > 0 && (
                        <button
                          type="button"
                          className="btn-3d-outline btn-sm"
                          title="Thu hồi phiên (Revoke Session)"
                          onClick={() => onRevokeSessions(u.id)}
                        >
                          <LogOut size={13} /> Hủy phiên
                        </button>
                      )}

                      <button
                        type="button"
                        className={u.status === "LOCKED" ? "btn-3d-lime btn-sm" : "btn-3d-outline btn-sm"}
                        style={u.status !== "LOCKED" ? { color: "#dc2626" } : undefined}
                        title={u.status === "LOCKED" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        onClick={() => setLockModalUser(u)}
                      >
                        <ShieldAlert size={13} /> {u.status === "LOCKED" ? "Mở khóa" : "Khóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="admin-pagination">
          <span>
            Hiển thị <strong>{users.length}</strong> / <strong>{totalCount}</strong> tài khoản
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>
              Trang <strong>{filters.page}</strong> / <strong>{totalPages}</strong>
            </span>
            <button
              type="button"
              className="btn-3d-outline btn-sm"
              disabled={filters.page <= 1 || isLoading}
              onClick={() => onFilterChange({ ...filters, page: filters.page - 1 })}
            >
              ← Trước
            </button>
            <button
              type="button"
              className="btn-3d-outline btn-sm"
              disabled={filters.page >= totalPages || isLoading}
              onClick={() => onFilterChange({ ...filters, page: filters.page + 1 })}
            >
              Sau →
            </button>
          </div>
        </div>
      </div>

      {roleModalUser && (
        <UserRoleModal
          user={roleModalUser}
          isOpen={true}
          onClose={() => setRoleModalUser(null)}
          onSave={onUpdateRoles}
        />
      )}

      {lockModalUser && (
        <UserLockModal
          user={lockModalUser}
          isOpen={true}
          onClose={() => setLockModalUser(null)}
          onConfirm={onToggleLock}
        />
      )}
    </div>
  );
}
