export interface NavItem {
  href: string;
  label: string;
  kicker: string;
  iconName: string;
  badge?: string;
}

export interface AdminKPI {
  id: string;
  title: string;
  value: string;
  subValue?: string | null;
  changePercent?: number | null;
  trendText?: string | null;
  trendDirection?: "up" | "down" | "neutral" | null;
  iconName: "users" | "book-open" | "database" | "shield-check" | "cpu" | "sparkles";
}

export interface RecentActivity {
  id: string;
  actorEmail: string;
  actorName: string;
  action: string;
  target: string;
  module: "IDENTITY" | "CONTENT" | "SYSTEM" | "SECURITY";
  timestamp: string;
  status: "SUCCESS" | "WARNING" | "INFO";
}
