"use client";

import { Check, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import type { FeatureFlag, SystemResource } from "../../types/system-policy";
import { SystemSectionStatus } from "./system-section-status";

interface FeatureFlagsPanelProps {
  flags: SystemResource<FeatureFlag[]>;
  pendingFlags: ReadonlySet<string>;
  flagErrors: ReadonlyMap<string, string>;
  onToggle: (key: string) => void;
}

export function FeatureFlagsPanel({
  flags,
  pendingFlags,
  flagErrors,
  onToggle,
}: FeatureFlagsPanelProps) {
  return (
    <section className="glass-card admin-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-kicker">ĐIỀU PHỐI TÍNH NĂNG</span>
          <h2>
            Cờ tính năng hệ thống <em>(Feature Flags)</em>
          </h2>
          <p className="admin-card-note">Trạng thái cờ do máy chủ xác nhận.</p>
        </div>
      </div>
      <SystemSectionStatus
        resource={flags}
        loadingLabel="Đang tải cờ tính năng..."
        retryDisabled={pendingFlags.size > 0}
      />
      {flags.data?.length === 0 && (
        <EmptyState className="admin-empty" title="Chưa có cờ tính năng" />
      )}
      <div className="admin-list">
        {flags.data?.map((flag) => {
          const error = flagErrors.get(flag.key);
          return (
            <div key={flag.key} className="flag-row">
              <div className="flag-info">
                <div className="flag-title">
                  <strong>{flag.name}</strong>
                  <span className="flag-category">{flag.category}</span>
                </div>
                <p>{flag.description}</p>
                <span className="flag-key">
                  Mã cờ: <code className="admin-code">{flag.key}</code>
                </span>
                {error && <ErrorState variant="inline" message={error} />}
              </div>
              <button
                type="button"
                className="flag-switch"
                onClick={() => onToggle(flag.key)}
                aria-pressed={flag.enabled}
                aria-busy={pendingFlags.has(flag.key)}
                disabled={flags.isLoading || pendingFlags.has(flag.key)}
                title={flag.enabled ? "Bấm để tắt" : "Bấm để bật"}
                aria-label={`Bật/tắt ${flag.name}`}
              >
                <span className="flag-switch-track">
                  <span className="flag-switch-thumb">
                    {flag.enabled ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <X size={14} strokeWidth={3} />
                    )}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
