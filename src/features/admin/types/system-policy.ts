export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "AI" | "STORAGE" | "AUTH" | "LEARNING";
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

export type AuditEntityType =
  | "USER"
  | "WORD"
  | "DECK"
  | "CONTENT_REVISION"
  | "FEATURE_FLAG";

export type AuditEntityFilter = "ALL" | AuditEntityType;

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string | null;
  details: string;
  ipAddress: string;
  timestamp: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}
