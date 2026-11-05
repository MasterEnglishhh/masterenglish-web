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
  subValue?: string;
  changePercent?: number;
  trendText?: string;
  trendDirection?: "up" | "down" | "neutral";
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
