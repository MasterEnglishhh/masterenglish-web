export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  updatedAt: string;
}

export interface StorageQuota {
  bucket: string;
  usedBytes: number;
  maxBytes: number;
  usedFormatted: string;
  limitFormatted: string;
  percentUsed: number;
  filesCount: number;
}

export interface AiQuotaMetric {
  provider: string;
  model: string;
  dailyTokenUsage: number;
  dailyTokenLimit: number;
  percentUsed: number;
  resetHours: number;
}

export type AuditEntityFilter = "ALL" | "USER" | "WORD" | "DECK" | "CONTENT_REVISION" | "FEATURE_FLAG";

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details: string;
  ipAddress?: string | null;
  timestamp: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}
export interface SystemResource<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}
