import {
  Users,
  BookOpen,
  Database,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { AdminKPI } from "../../types/admin";

const iconMap = {
  users: Users,
  "book-open": BookOpen,
  database: Database,
  "shield-check": ShieldCheck,
};

export function KpiCard({ kpi }: { kpi: AdminKPI }) {
  const IconComponent =
    iconMap[kpi.iconName as keyof typeof iconMap] || ShieldCheck;

  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-header">
        <span className="admin-kpi-title">{kpi.title}</span>
        <div className="admin-kpi-icon">
          <IconComponent size={20} strokeWidth={2.2} />
        </div>
      </div>

      <div className="admin-kpi-value">{kpi.value}</div>

      <div className="admin-kpi-footer">
        {kpi.changePercent !== undefined && (
          <span
            className={`admin-kpi-trend ${
              kpi.trendDirection === "up" ? "positive" : "neutral"
            }`}
          >
            <TrendingUp size={14} />
            {kpi.trendText}
          </span>
        )}
        {kpi.subValue && !kpi.changePercent && (
          <span>{kpi.subValue}</span>
        )}
      </div>
    </div>
  );
}
