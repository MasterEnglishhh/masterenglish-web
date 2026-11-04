"use client";

import { useState } from "react";
import type { AdminUser } from "../../types/user-management";

interface UserLockModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string, reason?: string) => void;
}

export function UserLockModal({ user, isOpen, onClose, onConfirm }: UserLockModalProps) {
  const [reason, setReason] = useState(
    user.status === "LOCKED" ? "" : "Vi phạm quy tắc hệ thống / Nghi vấn bảo mật OTP"
  );

  if (!isOpen) return null;

  const isLocking = user.status !== "LOCKED";

  const handleConfirm = () => {
    onConfirm(user.id, reason);
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal">
        <div>
          <span className="admin-kicker">M09.02 / TRẠNG THÁI TÀI KHOẢN</span>
          <h2 className="admin-modal-title">
            {isLocking ? "Khóa tài khoản người dùng" : "Mở khóa tài khoản"}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Tài khoản: <strong>{user.email}</strong> ({user.displayName})
          </p>
        </div>

        {isLocking ? (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Lý do khóa tài khoản:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                fontFamily: "inherit",
                fontSize: 13,
                outline: "none",
              }}
              placeholder="Nhập lý do khóa..."
            />
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#b91c1c" }}>
              Lưu ý: Khóa tài khoản sẽ đồng thời thu hồi mọi phiên đăng nhập (Active Sessions) ngay lập tức.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--ink)", margin: 0 }}>
            Bạn có chắc chắn muốn mở khóa cho tài khoản này? Người dùng sẽ có thể đăng nhập bình thường.
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
          <button type="button" className="btn-3d-outline btn-sm" onClick={onClose}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className={isLocking ? "btn-3d-dark btn-sm" : "btn-3d-lime btn-sm"}
            style={isLocking ? { background: "#dc2626", boxShadow: "0 4px 0 #991b1b" } : undefined}
            onClick={handleConfirm}
          >
            {isLocking ? "Xác nhận khóa" : "Xác nhận mở khóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
