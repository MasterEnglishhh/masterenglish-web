"use client";

import { AlertTriangle, Info, Search, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import type { PageResponse } from "../../lib/admin-client";
import type {
  AuditEntityFilter,
  AuditLogEntry,
  SystemResource,
} from "../../types/system-policy";
import { SystemSectionStatus } from "./system-section-status";

interface AuditLogsTableProps {
  logs: SystemResource<PageResponse<AuditLogEntry>>;
  search: string;
  onSearchChange: (search: string) => void;
  selectedEntity: AuditEntityFilter;
  onEntityChange: (entity: AuditEntityFilter) => void;
  page: number;
  onPageChange: (page: number) => void;
}

function SeverityIcon({ severity }: { severity: AuditLogEntry["severity"] }) {
  if (severity === "CRITICAL")
    return (
      <ShieldAlert
        size={14}
        className="admin-list-icon is-warning"
        aria-label="Nghiêm trọng"
      />
    );
  if (severity === "WARNING")
    return (
      <AlertTriangle
        size={14}
        className="admin-list-icon"
        aria-label="Cảnh báo"
      />
    );
  return <Info size={14} className="admin-list-icon" aria-label="Thông tin" />;
}

export function AuditLogsTable({
  logs,
  search,
  onSearchChange,
  selectedEntity,
  onEntityChange,
  page,
  onPageChange,
}: AuditLogsTableProps) {
  const confirmed = logs.data;
  return (
    <section className="glass-card admin-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-kicker">NHẬT KÝ KIỂM TOÁN</span>
          <h2>
            Sổ cái kiểm toán hệ thống <em>(Audit Ledger)</em>
          </h2>
          <p className="admin-card-note">
            Lưu trữ bất biến hành vi quản trị, phân quyền, đăng nhập và thay đổi
            dữ liệu phục vụ bảo mật.
          </p>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="admin-search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo hành động hoặc lý do..."
            aria-label="Tìm trong nhật ký kiểm toán"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
        <select
          className="admin-select"
          aria-label="Lọc theo đối tượng tác động"
          value={selectedEntity}
          onChange={(e) => onEntityChange(e.target.value as AuditEntityFilter)}
        >
          <option value="ALL">Tất cả đối tượng tác động</option>
          <option value="USER">Người dùng (USER)</option>
          <option value="WORD">Từ vựng (WORD)</option>
          <option value="DECK">Bộ thẻ (DECK)</option>
          <option value="CONTENT_REVISION">
            Phiên bản nội dung (CONTENT_REVISION)
          </option>
          <option value="FEATURE_FLAG">Cờ tính năng (FEATURE_FLAG)</option>
        </select>
      </div>
      <SystemSectionStatus
        resource={logs}
        loadingLabel="Đang tải nhật ký kiểm toán..."
      />
      {confirmed?.items.length === 0 && (
        <EmptyState
          className="admin-empty"
          title="Không tìm thấy bản ghi kiểm toán"
        />
      )}
      {confirmed && (confirmed.items.length > 0 || page > 1) && (
        <div className="admin-table-wrap">
          {confirmed.items.length > 0 && (
            <div
              className="admin-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Bảng nhật ký kiểm toán"
            >
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
                  {confirmed.items.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="admin-chip-row">
                          <SeverityIcon severity={log.severity} />
                          <span className="admin-time">
                            {new Date(log.timestamp).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" }
                            )}{" "}
                            {new Date(log.timestamp).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="cell-name">{log.actorEmail}</td>
                      <td>
                        <code className="admin-badge admin-code">
                          {log.action}
                        </code>
                      </td>
                      <td className="cell-name">
                        {log.entityType}
                        {log.entityId && ` · ${log.entityId}`}
                      </td>
                      <td className="cell-sub">{log.details}</td>
                      <td className="cell-sub admin-code">
                        {log.ipAddress ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            className="admin-pagination"
            label="Phân trang nhật ký kiểm toán"
            page={page}
            totalPages={confirmed.totalPages}
            hasNext={confirmed.hasNext}
            busy={logs.isLoading || Boolean(logs.error)}
            onChange={onPageChange}
            summary={
              <>
                Hiển thị <strong>{confirmed.items.length}</strong> /{" "}
                <strong>{confirmed.totalItems}</strong> bản ghi
              </>
            }
          />
        </div>
      )}
    </section>
  );
}
