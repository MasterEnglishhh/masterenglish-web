"use client";

import { Check, X } from "lucide-react";
import type { FeatureFlag } from "../../types/system-policy";

interface FeatureFlagsPanelProps {
  flags: FeatureFlag[];
  onToggle: (key: string) => void;
}

export function FeatureFlagsPanel({ flags, onToggle }: FeatureFlagsPanelProps) {
  return (
    <div className="admin-card" style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 20 }}>
        <span className="admin-kicker">M09.05 / ĐIỀU PHỐI TÍNH NĂNG</span>
        <h2 style={{ fontSize: 20, fontWeight: 750, margin: "4px 0 0" }}>
          Cờ tính năng hệ thống <em>(Feature Flags)</em>
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
          Bật/tắt các phân hệ động theo thời gian thực mà không cần deploy lại backend.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {flags.map((flag) => (
          <div
            key={flag.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 18px",
              background: "#fafaf7",
              borderRadius: 14,
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 14, color: "var(--ink)" }}>{flag.name}</strong>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: "#e0e7ff",
                    color: "var(--indigo-deep)",
                  }}
                >
                  {flag.category}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                {flag.description}
              </p>
              <span style={{ fontSize: 11, color: "#9ca3af", display: "inline-block", marginTop: 4 }}>
                Mã cờ: <code style={{ fontFamily: "monospace" }}>{flag.key}</code>
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggle(flag.key)}
              style={{
                width: 54,
                height: 30,
                borderRadius: 20,
                background: flag.enabled ? "var(--indigo)" : "#d1d5db",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "center",
                padding: 3,
                flexShrink: 0,
              }}
              title={flag.enabled ? "Bấm để tắt" : "Bấm để bật"}
              aria-label={`Bật/tắt ${flag.name}`}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  transform: flag.enabled ? "translateX(24px)" : "translateX(0)",
                  transition: "transform 0.2s",
                  color: flag.enabled ? "var(--indigo)" : "#9ca3af",
                }}
              >
                {flag.enabled ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
