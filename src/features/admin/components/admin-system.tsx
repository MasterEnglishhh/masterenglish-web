"use client";

import { useAdminSystem } from "../hooks/use-admin-system";
import { FeatureFlagsPanel } from "./system/feature-flags-panel";
import { SystemMeters } from "./system/system-meters";
import { AuditLogsTable } from "./system/audit-logs-table";
import { RequireSystemAdmin } from "./require-admin";

export function AdminSystem() {
  const {
    flags,
    storageQuota,
    aiQuota,
    auditLogs,
    totalLogs,
    logSearch,
    setLogSearch,
    selectedEntity,
    setSelectedEntity,
  } = useAdminSystem();

  return (
    <RequireSystemAdmin>
      <div>
        <div className="admin-heading">
          <span className="admin-kicker">CHÍNH SÁCH, QUOTA & AN TOÀN</span>
          <h1 className="admin-title">
            Cấu hình Hệ thống & <em>Sổ cái Kiểm toán</em>
          </h1>
          <p className="admin-description">
            Xem trạng thái cờ tính năng, giám sát định mức lưu trữ Cloudflare
            R2 và theo dõi nhật ký kiểm toán bất biến.
          </p>
        </div>

        <SystemMeters storage={storageQuota} ai={aiQuota} />

        <FeatureFlagsPanel flags={flags} />

        <AuditLogsTable
          logs={auditLogs}
          totalLogs={totalLogs}
          search={logSearch}
          onSearchChange={setLogSearch}
          selectedEntity={selectedEntity}
          onEntityChange={setSelectedEntity}
        />
      </div>
    </RequireSystemAdmin>
  );
}
