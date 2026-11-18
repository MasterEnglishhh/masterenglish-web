"use client";

import { AlertTriangle, Info, Search, ShieldAlert } from "lucide-react";
import type { AuditLogEntry } from "../../types/system-policy";

interface AuditLogsTableProps {
  logs: AuditLogEntry[];
  totalLogs: number;
  search: string;
  onSearchChange: (search: string) => void;
  selectedEntity: string;
  onEntityChange: (entity: string) => void;
}

function SeverityIcon({ severity }: { severity: AuditLogEntry["severity"] }) {
  if (severity === "CRITICAL") return <ShieldAlert size={14} className="admin-list-icon is-warning" aria-label="Nghiêm trọng" />;
  if (severity === "WARNING") return <AlertTriangle size={14} className="admin-list-icon" aria-label="Cảnh báo" />;
  return <Info size={14} className="admin-list-icon" aria-label="Thông tin" />;
}

export function AuditLogsTable({
  logs,
  totalLogs,
  search,
  onSearchChange,
  selectedEntity,
  onEntityChange,
}: AuditLogsTableProps) {
  return (
    <section className="glass-card admin-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-kicker">NHẬT KÝ KIỂM TOÁN</span>
          <h2>
            Sổ cái kiểm toán hệ thống <em>(Audit Ledger)</em>
          </h2>
          <p className="admin-card-note">
            Lưu trữ bất biến hành vi quản trị, phân quyền, đăng nhập và thay đổi dữ liệu phục vụ bảo mật.
          </p>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="admin-search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo email, hành động hoặc nội dung..."
            aria-label="Tìm trong nhật ký kiểm toán"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
        <select
          className="admin-select"
          aria-label="Lọc theo đối tượng tác động"
          value={selectedEntity}
          onChange={(e) => onEntityChange(e.target.value)}
        >
          <option value="ALL">Tất cả đối tượng tác động</option>
          <option value="USER">Người dùng (USER)</option>
          <option value="ROLE">Vai trò (ROLE)</option>
          <option value="CONTENT">Nội dung (CONTENT)</option>
          <option value="FEATURE_FLAG">Cờ tính năng (FEATURE_FLAG)</option>
          <option value="SESSION">Phiên làm việc (SESSION)</option>
        </select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mức độ / Thời gian</th>
              <th>Người thực hiện</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>Chi tiết tác động</th>
              <th>Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="cell-empty">
                  Không tìm thấy bản ghi kiểm toán nào phù hợp.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="admin-chip-row">
                      <SeverityIcon severity={log.severity} />
                      <span className="admin-time">
                        {new Date(log.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}{" "}
                        {new Date(log.timestamp).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </td>
                  <td className="cell-name">{log.actorEmail}</td>
                  <td>
                    <code className="admin-badge admin-code">{log.action}</code>
                  </td>
                  <td className="cell-name">
                    {log.entityType}: {log.entityId}
                  </td>
                  <td className="cell-sub">{log.details}</td>
                  <td className="cell-sub admin-code">{log.ipAddress}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="admin-pagination">
          <span>
            Hiển thị <strong>{logs.length}</strong> / <strong>{totalLogs}</strong> bản ghi
          </span>
          <span>Bất biến (Immutable)</span>
        </div>
      </div>
    </section>
  );
}
