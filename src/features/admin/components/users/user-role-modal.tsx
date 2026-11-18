"use client";

import { useState } from "react";
import { Dialog } from "@/components/dialog";
import type { AdminUser, UserRole } from "../../types/user-management";

interface UserRoleModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (userId: string, roles: UserRole[]) => void;
}

const ROLES: { role: UserRole; hint: string }[] = [
  { role: "LEARNER", hint: "Người học tiếng Anh và luyện đề TOEIC thông thường" },
  { role: "CONTENT_ADMIN", hint: "Biên soạn, kiểm duyệt và xuất bản từ vựng, ngữ pháp, đề thi" },
  { role: "SYSTEM_ADMIN", hint: "Toàn quyền quản trị tài khoản, cấu hình hệ thống và audit log" },
];

export function UserRoleModal({ user, onClose, onSave }: UserRoleModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(user.roles);

  const toggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // không để người dùng không còn vai trò nào
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
    <Dialog
      kicker="PHÂN QUYỀN HỆ THỐNG"
      title={`Cập nhật vai trò cho ${user.displayName}`}
      description={
        <p className="admin-modal-note">
          Email: <strong>{user.email}</strong>
        </p>
      }
      onClose={onClose}
    >
      <div className="admin-role-list">
        {ROLES.map(({ role, hint }) => {
          const isChecked = selectedRoles.includes(role);
          return (
            <label key={role} className={`admin-role-option ${isChecked ? "is-selected" : ""}`}>
              <input type="checkbox" checked={isChecked} onChange={() => toggleRole(role)} />
              <span>
                <strong>{role}</strong>
                <small>{hint}</small>
              </span>
            </label>
          );
        })}
      </div>
      <div className="admin-form-actions">
        <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
          Hủy bỏ
        </button>
        <button type="button" className="btn-primary btn-sm" onClick={handleSave}>
          Lưu thay đổi vai trò
        </button>
      </div>
    </Dialog>
  );
}
