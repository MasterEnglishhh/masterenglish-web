"use client";

import { Search, ShieldAlert, Info, AlertTriangle } from "lucide-react";
import type { AuditLogEntry } from "../../types/system-policy";

interface AuditLogsTableProps {
  logs: AuditLogEntry[];
  totalLogs: number;
  search: string;
  onSearchChange: (search: string) => void;
  selectedEntity: string;
  onEntityChange: (entity: string) => void;
}

export function AuditLogsTable({
  logs,
  totalLogs,
  search,
  onSearchChange,
  selectedEntity,
  onEntityChange,
}: AuditLogsTableProps) {
  const getSeverityIcon = (sev: AuditLogEntry["severity"]) => {
    switch (sev) {
      case "CRITICAL":
        return <ShieldAlert size={14} color="#dc2626" />;
      case "WARNING":
        return <AlertTriangle size={14} color="#d97706" />;
      default:
        return <Info size={14} color="var(--indigo)" />;
    }
  };

  return (
    <div className="admin-card">
      <div style={{ marginBottom: 20 }}>
        <span className="admin-kicker">NHẬT KÝ KIỂM TOÁN</span>
        <h2 style={{ fontSize: 20, fontWeight: 750, margin: "4px 0 0" }}>
          Sổ cái kiểm toán hệ thống <em>(Audit Ledger)</em>
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
          Lưu trữ bất biến toàn bộ hành vi quản trị, phân quyền, đăng nhập và thay đổi dữ liệu phục vụ bảo mật.
        </p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo email, hành động hoặc nội dung..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          className="admin-select"
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
                <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  Không tìm thấy bản ghi kiểm toán nào phù hợp.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {getSeverityIcon(log.severity)}
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {new Date(log.timestamp).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {new Date(log.timestamp).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{log.actorEmail}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        background: "#f1f1eb",
                        padding: "3px 6px",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, color: "var(--indigo)", fontWeight: 750 }}>
                      {log.entityType}: {log.entityId}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#374151", maxWidth: 360 }}>
                    {log.details}
                  </td>
                  <td style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>
                    {log.ipAddress}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="admin-pagination">
          <span>Hiển thị <strong>{logs.length}</strong> / <strong>{totalLogs}</strong> bản ghi</span>
          <span>Bất biến (Immutable)</span>
        </div>
      </div>
    </div>
  );
}
