"use client";

import { useId, useState } from "react";
import { Dialog } from "@/components/dialog";
import { ErrorState } from "@/components/error-state";
import { useUserModalSave } from "../../hooks/use-user-modal-save";
import type { AdminUser } from "../../types/user-management";

interface UserLockModalProps {
  user: AdminUser;
  onClose: () => void;
  onConfirm: (user: AdminUser, reason?: string) => Promise<boolean>;
  mutationError?: string | null;
}

export function UserLockModal({
  user,
  onClose,
  onConfirm,
  mutationError,
}: UserLockModalProps) {
  const reasonId = useId();
  const [reason, setReason] = useState(
    user.status === "LOCKED"
      ? ""
      : "Vi phạm quy tắc hệ thống / Nghi vấn bảo mật OTP"
  );
  const isLocking = user.status !== "LOCKED";
  const { busy, failed, save } = useUserModalSave(onClose);

  return (
    <Dialog
      kicker="TRẠNG THÁI TÀI KHOẢN"
      title={isLocking ? "Khóa tài khoản người dùng" : "Mở khóa tài khoản"}
      description={
        <p className="admin-modal-note">
          Tài khoản: <strong>{user.email}</strong> ({user.displayName})
        </p>
      }
      busy={busy}
      onClose={onClose}
    >
      {failed && (
        <ErrorState
          variant="inline"
          message={
            mutationError ||
            "Không thể đổi trạng thái tài khoản. Vui lòng thử lại."
          }
        />
      )}
      {isLocking ? (
        <div>
          <label htmlFor={reasonId} className="field-label">
            Lý do khóa tài khoản:
          </label>
          <textarea
            id={reasonId}
            className="admin-textarea"
            value={reason}
            disabled={busy}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Nhập lý do khóa..."
          />
          <p className="field-error">
            Lưu ý: khóa tài khoản sẽ đồng thời thu hồi mọi phiên đăng nhập
            (Active Sessions) ngay lập tức.
          </p>
        </div>
      ) : (
        <p className="admin-modal-note">
          Bạn có chắc chắn muốn mở khóa cho tài khoản này? Người dùng sẽ có thể
          đăng nhập bình thường.
        </p>
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
          className={isLocking ? "btn-danger-soft btn-sm" : "btn-lime btn-sm"}
          disabled={busy}
          onClick={() => save(() => onConfirm(user, reason))}
        >
          {busy
            ? "Đang lưu..."
            : isLocking
              ? "Xác nhận khóa"
              : "Xác nhận mở khóa"}
        </button>
      </div>
    </Dialog>
  );
}
