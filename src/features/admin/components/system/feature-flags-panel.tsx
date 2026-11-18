"use client";

import { Check, X } from "lucide-react";
import type { FeatureFlag } from "../../types/system-policy";

interface FeatureFlagsPanelProps {
  flags: FeatureFlag[];
  onToggle: (key: string) => void;
}

export function FeatureFlagsPanel({ flags, onToggle }: FeatureFlagsPanelProps) {
  return (
    <section className="glass-card admin-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-kicker">ĐIỀU PHỐI TÍNH NĂNG</span>
          <h2>
            Cờ tính năng hệ thống <em>(Feature Flags)</em>
          </h2>
          <p className="admin-card-note">Bật/tắt các tính năng theo thời gian thực mà không cần deploy lại backend.</p>
        </div>
      </div>
      <div className="admin-list">
        {flags.map((flag) => (
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
            </div>
            <button
              type="button"
              className="flag-switch"
              onClick={() => onToggle(flag.key)}
              aria-pressed={flag.enabled}
              title={flag.enabled ? "Bấm để tắt" : "Bấm để bật"}
              aria-label={`Bật/tắt ${flag.name}`}
            >
              <span className="flag-switch-track">
                <span className="flag-switch-thumb">
                  {flag.enabled ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
