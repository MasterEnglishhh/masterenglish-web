"use client";

import { useAdminSystem } from "../hooks/use-admin-system";
import { FeatureFlagsPanel } from "./system/feature-flags-panel";
import { SystemMeters } from "./system/system-meters";
import { AuditLogsTable } from "./system/audit-logs-table";
import { RequireSystemAdmin } from "./require-admin";

export function AdminSystem() {
  return (
    <RequireSystemAdmin>
      <AdminSystemContent />
    </RequireSystemAdmin>
  );
}

function AdminSystemContent() {
  const {
    storage,
    ai,
    flags,
    logs,
    logSearch,
    setLogSearch,
    selectedEntity,
    setSelectedEntity,
    logPage,
    setLogPage,
    pendingFlags,
    flagErrors,
    toggleFeatureFlag,
  } = useAdminSystem();

  return (
    <div>
      <div className="admin-heading">
        <span className="admin-kicker">CHÍNH SÁCH, QUOTA & AN TOÀN</span>
        <h1 className="admin-title">
          Cấu hình Hệ thống & <em>Sổ cái Kiểm toán</em>
        </h1>
        <p className="admin-description">
          Điều chỉnh cờ tính năng động, giám sát định mức lưu trữ Cloudflare
          R2, hạn ngạch token trí tuệ nhân tạo (AI) và theo dõi nhật ký kiểm
          toán bất biến.
        </p>
      </div>

      <SystemMeters storage={storage} ai={ai} />

      <FeatureFlagsPanel flags={flags} pendingFlags={pendingFlags} flagErrors={flagErrors} onToggle={toggleFeatureFlag} />

      <AuditLogsTable
        logs={logs}
        search={logSearch}
        onSearchChange={setLogSearch}
        selectedEntity={selectedEntity}
        onEntityChange={setSelectedEntity}
        page={logPage}
        onPageChange={setLogPage}
      />
    </div>
  );
}
