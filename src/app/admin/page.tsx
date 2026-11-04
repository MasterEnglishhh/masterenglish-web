"use client";

import { useAdminOverview } from "@/features/admin/hooks/use-admin-overview";
import { KpiCard } from "@/features/admin/components/overview/kpi-card";
import { QuickActions } from "@/features/admin/components/overview/quick-actions";
import { ActivityStream } from "@/features/admin/components/overview/activity-stream";

export default function AdminOverviewPage() {
  const { kpis, activities } = useAdminOverview();

  return (
    <div>
      <div className="admin-heading">
        <span className="admin-kicker">TỔNG QUAN HỆ THỐNG</span>
        <h1 className="admin-title">
          Bảng điều khiển <em>Quản trị & Vận hành</em>
        </h1>
        <p className="admin-description">
          Theo dõi lưu lượng người học, tiến độ thẩm định nội dung từ vựng - ngữ pháp - đề thi TOEIC và sức khỏe hạ tầng thời gian thực.
        </p>
      </div>

      <div className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <QuickActions />

      <ActivityStream activities={activities} />
    </div>
  );
}
