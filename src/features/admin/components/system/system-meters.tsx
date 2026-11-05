import { Database, Sparkles } from "lucide-react";
import type { StorageQuota, AiQuotaMetric } from "../../types/system-policy";

interface SystemMetersProps {
  storage: StorageQuota;
  ai: AiQuotaMetric;
}

export function SystemMeters({ storage, ai }: SystemMetersProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 32 }}>
      {/* Cloudflare R2 Meter */}
      <div className="admin-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="admin-kpi-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
              <Database size={18} />
            </div>
            <div>
              <span className="admin-kicker">BỘ NHỚ ĐÁM MÂY</span>
              <h3 style={{ fontSize: 16, fontWeight: 750, margin: 0 }}>Cloudflare R2 Storage</h3>
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 750, color: "var(--indigo)" }}>
            {storage.percentUsed}%
          </span>
        </div>

        <div style={{ width: "100%", height: 10, background: "#e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          <div
            style={{
              width: `${storage.percentUsed}%`,
              height: "100%",
              background: "var(--indigo)",
              borderRadius: 8,
              transition: "width 0.3s",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
          <span>Đã dùng: <strong>{storage.usedFormatted}</strong></span>
          <span>Định mức: {storage.limitFormatted}</span>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9ca3af" }}>
          Bucket: <code style={{ fontFamily: "monospace" }}>{storage.bucket}</code> · {storage.filesCount} file audio & hình ảnh
        </p>
      </div>

      {/* AI Token Quota Meter */}
      <div className="admin-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="admin-kpi-icon" style={{ background: "#ede9fe", color: "var(--indigo-deep)" }}>
              <Sparkles size={18} />
            </div>
            <div>
              <span className="admin-kicker">QUOTA TRỢ LÝ AI</span>
              <h3 style={{ fontSize: 16, fontWeight: 750, margin: 0 }}>Hạn ngạch AI Token hằng ngày</h3>
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 750, color: "#059669" }}>
            {ai.percentUsed}%
          </span>
        </div>

        <div style={{ width: "100%", height: 10, background: "#e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          <div
            style={{
              width: `${ai.percentUsed}%`,
              height: "100%",
              background: "#10b981",
              borderRadius: 8,
              transition: "width 0.3s",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
          <span>Đã tiêu thụ: <strong>{(ai.dailyTokenUsage / 1000000).toFixed(2)}M tokens</strong></span>
          <span>Hạn mức: {(ai.dailyTokenLimit / 1000000).toFixed(0)}M tokens/ngày</span>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9ca3af" }}>
          Mô hình: {ai.model} · Đặt lại sau: {ai.resetHours} giờ
        </p>
      </div>
    </div>
  );
}
