"use client";

import { RotateCw } from "lucide-react";
import { useAdminOverview } from "../hooks/use-admin-overview";
import { ActivityStream } from "./overview/activity-stream";
import { KpiCard } from "./overview/kpi-card";
import { QuickActions } from "./overview/quick-actions";

export function AdminOverview() {
  const { kpis, activities, isLoading, error, refreshOverview } = useAdminOverview();

  return (
    <div>
      <div className="admin-heading admin-heading-row">
        <div>
          <span className="admin-kicker">TỔNG QUAN HỆ THỐNG</span>
          <h1 className="admin-title">
            Bảng điều khiển <em>Quản trị & Vận hành</em>
          </h1>
          <p className="admin-description">
            Theo dõi người học, tiến độ thẩm định nội dung từ vựng và hoạt động quản trị gần đây.
          </p>
        </div>
        <button type="button" onClick={refreshOverview} disabled={isLoading} className="btn-ghost btn-sm">
          <RotateCw size={14} className={isLoading ? "animate-spin" : ""} aria-hidden="true" />
          Làm mới dữ liệu
        </button>
      </div>

      {error && (
        <div role="alert" className="admin-alert">
          {error}
        </div>
      )}

      <div className="admin-kpi-grid">
        {isLoading && kpis.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="admin-kpi-card" aria-hidden="true">
                <div className="admin-skeleton" style={{ height: 16, width: "60%" }} />
                <div className="admin-skeleton" style={{ height: 32, width: "40%" }} />
                <div className="admin-skeleton" style={{ height: 14, width: "80%" }} />
              </div>
            ))
          : kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </div>

      <QuickActions />

      <ActivityStream activities={activities} />
    </div>
  );
}
