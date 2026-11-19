"use client";

import { useState } from "react";
import { Dialog } from "@/components/dialog";
import {
  canSaveUserRoles,
  useAdminUserDetail,
} from "../../hooks/use-admin-user-detail";
import type {
  AdminUser,
  UserRole,
  UserStatus,
} from "../../types/user-management";

interface UserRoleModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (userId: string, roles: UserRole[]) => void;
}

const ROLES: { role: UserRole; hint: string }[] = [
  {
    role: "LEARNER",
    hint: "Người học tiếng Anh và luyện đề TOEIC thông thường",
  },
  {
    role: "CONTENT_ADMIN",
    hint: "Biên soạn, kiểm duyệt và xuất bản từ vựng, ngữ pháp, đề thi",
  },
  {
    role: "SYSTEM_ADMIN",
    hint: "Toàn quyền quản trị tài khoản, cấu hình hệ thống và audit log",
  },
];

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Đã khóa",
  DISABLED: "Đã vô hiệu hóa",
  PENDING_VERIFICATION: "Chờ OTP",
};

const formatDateTime = (iso: string) => new Date(iso).toLocaleString("vi-VN");

export function UserRoleModal({ user, onClose, onSave }: UserRoleModalProps) {
  const { detail, status, reload } = useAdminUserDetail(user);
  // null: người quản trị chưa đổi gì, nên hiển thị vai trò mới nhất từ máy chủ.
  const [editedRoles, setEditedRoles] = useState<UserRole[] | null>(null);
  const selectedRoles = editedRoles ?? detail.roles;
  const canSave = canSaveUserRoles(editedRoles, status);

  const toggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // không để người dùng không còn vai trò nào
      setEditedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setEditedRoles([...selectedRoles, role]);
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave(user.id, selectedRoles);
    onClose();
  };

  return (
    <Dialog
      kicker="PHÂN QUYỀN HỆ THỐNG"
      title={`Cập nhật vai trò cho ${detail.displayName}`}
      description={
        <>
          <p className="admin-modal-note">
            Email: <strong>{detail.email}</strong>
          </p>
          <p className="admin-modal-note">
            Trạng thái:{" "}
            <strong>{STATUS_LABEL[detail.status] ?? detail.status}</strong> ·
            Phiên đăng nhập: <strong>{detail.activeSessionsCount}</strong>
            {detail.lastLoginAt && (
              <>
                {" "}
                · Đăng nhập gần nhất:{" "}
                <strong>{formatDateTime(detail.lastLoginAt)}</strong>
              </>
            )}
          </p>
          {status === "loading" && (
            <p className="admin-modal-note">Đang tải chi tiết mới nhất…</p>
          )}
          {status === "error" && (
            <p className="admin-modal-note">
              Chưa tải được chi tiết, đang hiển thị dữ liệu từ danh sách.{" "}
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={reload}
              >
                Thử lại
              </button>
            </p>
          )}
        </>
      }
      onClose={onClose}
    >
      <div className="admin-role-list">
        {ROLES.map(({ role, hint }) => {
          const isChecked = selectedRoles.includes(role);
          return (
            <label
              key={role}
              className={`admin-role-option ${isChecked ? "is-selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleRole(role)}
              />
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
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={!canSave}
          onClick={handleSave}
        >
          Lưu thay đổi vai trò
        </button>
      </div>
    </Dialog>
  );
}
