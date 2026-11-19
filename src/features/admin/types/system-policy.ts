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

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  action: string;
  entityType: "USER" | "ROLE" | "CONTENT" | "FEATURE_FLAG" | "SESSION";
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}
