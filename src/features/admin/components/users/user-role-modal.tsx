"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/dialog";
import { ErrorState } from "@/components/error-state";
import { createLatestRequestTracker } from "@/lib/latest-request";
import { useUserModalSave } from "../../hooks/use-user-modal-save";
import { fetchAdminUser } from "../../lib/admin-client";
import type { AdminUser, UserRole } from "../../types/user-management";

interface UserRoleModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (userId: string, roles: UserRole[]) => Promise<boolean>;
  mutationError?: string | null;
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

export function UserRoleModal({
  user,
  onClose,
  onSave,
  mutationError,
}: UserRoleModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[] | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const requests = useRef(createLatestRequestTracker());
  const { busy, failed, save } = useUserModalSave(onClose);

  const loadDetail = useCallback(async () => {
    const tracker = requests.current;
    const ticket = tracker.begin();
    setDetailError(null);
    setSelectedRoles(null);
    try {
      const result = await fetchAdminUser(user.id);
      if (!tracker.isCurrent(ticket)) return;
      if (result.success) setSelectedRoles(result.data.roles);
      else setDetailError(result.error.message);
    } catch {
      if (tracker.isCurrent(ticket))
        setDetailError("Không thể tải chi tiết tài khoản.");
    }
  }, [user.id]);

  useEffect(() => {
    const tracker = requests.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải chi tiết khi mở hộp thoại
    void loadDetail();
    return () => tracker.invalidate();
  }, [loadDetail]);

  const toggleRole = (role: UserRole) => {
    if (!selectedRoles || busy) return;
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // không để người dùng không còn vai trò nào
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
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
      busy={busy}
      onClose={onClose}
    >
      {detailError && (
        <ErrorState
          variant="inline"
          message={detailError}
          onRetry={loadDetail}
        />
      )}
      {!selectedRoles && !detailError && (
        <p className="admin-modal-note" role="status">
          Đang tải vai trò của tài khoản...
        </p>
      )}
      {failed && (
        <ErrorState
          variant="inline"
          message={mutationError || "Không thể lưu vai trò. Vui lòng thử lại."}
        />
      )}
      {selectedRoles && (
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
                  disabled={busy}
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
      )}
      <div className="admin-form-actions">
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={busy}
          onClick={onClose}
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={busy || !selectedRoles?.length}
          onClick={() =>
            selectedRoles?.length && save(() => onSave(user.id, selectedRoles))
          }
        >
          {busy ? "Đang lưu..." : "Lưu thay đổi vai trò"}
        </button>
      </div>
    </Dialog>
  );
}
