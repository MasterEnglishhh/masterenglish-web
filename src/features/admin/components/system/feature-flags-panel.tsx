"use client";

import { Check, X } from "lucide-react";
import type { FeatureFlag } from "../../types/system-policy";

interface FeatureFlagsPanelProps {
  flags: FeatureFlag[];
}

export function FeatureFlagsPanel({ flags }: FeatureFlagsPanelProps) {
  return (
    <section className="glass-card admin-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-kicker">ĐIỀU PHỐI TÍNH NĂNG</span>
          <h2>
            Cờ tính năng hệ thống <em>(Feature Flags)</em>
          </h2>
          <p className="admin-card-note">
            Chưa hỗ trợ điều khiển tính năng; trạng thái lưu chưa phản ánh hoạt động thực tế.
          </p>
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
              disabled
              className="flag-switch"
              style={{ cursor: "not-allowed", opacity: 0.65 }}
              title="Chưa hỗ trợ điều khiển tính năng; trạng thái lưu chưa phản ánh hoạt động thực tế"
              aria-label={`Trạng thái ${flag.name}: ${flag.enabled ? "Bật" : "Tắt"}`}
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
