"use client";

import { useState } from "react";
import type { AdminUser, UserRole } from "../../types/user-management";

interface UserRoleModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, roles: UserRole[]) => void;
}

export function UserRoleModal({ user, isOpen, onClose, onSave }: UserRoleModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(user.roles);

  if (!isOpen) return null;

  const toggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // Prevent 0 roles
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSave = () => {
    onSave(user.id, selectedRoles);
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal">
        <div>
          <span className="admin-kicker">M09.03 / PHÂN QUYỀN HỆ THỐNG</span>
          <h2 className="admin-modal-title">Cập nhật vai trò cho {user.displayName}</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Email: <strong>{user.email}</strong>
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(["LEARNER", "CONTENT_ADMIN", "SYSTEM_ADMIN"] as UserRole[]).map((role) => {
            const isChecked = selectedRoles.includes(role);
            return (
              <label
                key={role}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: isChecked ? "2px solid var(--indigo)" : "1px solid var(--line)",
                  background: isChecked ? "#f5f4fd" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleRole(role)}
                  style={{ width: 18, height: 18, accentColor: "var(--indigo)" }}
                />
                <div>
                  <strong style={{ fontSize: 13, display: "block" }}>{role}</strong>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {role === "SYSTEM_ADMIN"
                      ? "Toàn quyền quản trị tài khoản, cấu hình hệ thống và audit log"
                      : role === "CONTENT_ADMIN"
                      ? "Biên soạn, kiểm duyệt và xuất bản từ vựng, ngữ pháp, đề thi"
                      : "Người học tiếng Anh và luyện đề TOEIC thông thường"}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
          <button type="button" className="btn-3d-outline btn-sm" onClick={onClose}>
            Hủy bỏ
          </button>
          <button type="button" className="btn-3d-dark btn-sm" onClick={handleSave}>
            Lưu thay đổi vai trò
          </button>
        </div>
      </div>
    </div>
  );
}
