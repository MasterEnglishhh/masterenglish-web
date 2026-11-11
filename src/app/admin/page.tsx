"use client";

import { useAdminOverview } from "@/features/admin/hooks/use-admin-overview";
import { KpiCard } from "@/features/admin/components/overview/kpi-card";
import { QuickActions } from "@/features/admin/components/overview/quick-actions";
import { ActivityStream } from "@/features/admin/components/overview/activity-stream";
import { RotateCw } from "lucide-react";

export default function AdminOverviewPage() {
  const { kpis, activities, isLoading, error, refreshOverview } = useAdminOverview();

  return (
    <div>
      <div className="admin-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <span className="admin-kicker">TỔNG QUAN HỆ THỐNG</span>
          <h1 className="admin-title">
            Bảng điều khiển <em>Quản trị & Vận hành</em>
          </h1>
          <p className="admin-description">
            Theo dõi lưu lượng người học, tiến độ thẩm định nội dung từ vựng - ngữ pháp - đề thi TOEIC và sức khỏe hạ tầng thời gian thực.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshOverview}
          disabled={isLoading}
          className="btn-3d-outline btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10 }}
        >
          <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
          Làm mới dữ liệu
        </button>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "10px 14px", borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div className="admin-kpi-grid">
        {isLoading && kpis.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-kpi-card" style={{ opacity: 0.6 }}>
              <div style={{ height: 16, width: "60%", background: "var(--line)", borderRadius: 4, marginBottom: 16 }} />
              <div style={{ height: 32, width: "40%", background: "var(--line)", borderRadius: 6, marginBottom: 12 }} />
              <div style={{ height: 14, width: "80%", background: "var(--line)", borderRadius: 4 }} />
            </div>
          ))
        ) : (
          kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)
        )}
      </div>

      <QuickActions />

      <ActivityStream activities={activities} />
    </div>
  );
}
