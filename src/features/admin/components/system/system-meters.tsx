import { Database, Sparkles } from "lucide-react";
import type { AiQuotaMetric, StorageQuota } from "../../types/system-policy";

interface SystemMetersProps {
  storage: StorageQuota;
  ai: AiQuotaMetric | AiQuotaMetric[];
}

export function SystemMeters({ storage, ai }: SystemMetersProps) {
  const aiMetric = Array.isArray(ai)
    ? ai.length > 0
      ? ai[0]
      : null
    : ai || null;

  return (
    <div className="meter-grid">
      <section className="glass-card admin-card">
        <div className="meter-head">
          <div className="meter-title">
            <span className="admin-kpi-icon tone-peach">
              <Database size={18} aria-hidden="true" />
            </span>
            <div>
              <span className="admin-kicker">BỘ NHỚ ĐÁM MÂY</span>
              <h3>Cloudflare R2 Storage</h3>
            </div>
          </div>
          <span className="meter-percent">{storage.percentUsed}%</span>
        </div>
        <div className="meter-bar" role="img" aria-label={`Đã dùng ${storage.percentUsed}% dung lượng`}>
          <span style={{ width: `${storage.percentUsed}%` }} />
        </div>
        <div className="meter-line">
          <span>
            Đã dùng: <strong>{storage.usedFormatted}</strong>
          </span>
          <span>Định mức: {storage.limitFormatted}</span>
        </div>
        <p className="meter-note">
          Bucket: <code className="admin-code">{storage.bucket}</code> · {storage.filesCount} file audio & hình ảnh
        </p>
      </section>

      <section className="glass-card admin-card">
        <div className="meter-head">
          <div className="meter-title">
            <span className="admin-kpi-icon">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div>
              <span className="admin-kicker">QUOTA TRỢ LÝ AI</span>
              <h3>Hạn ngạch AI Token hằng ngày</h3>
            </div>
          </div>
          {aiMetric && <span className="meter-percent">{aiMetric.percentUsed}%</span>}
        </div>
        {aiMetric ? (
          <>
            <div className="meter-bar is-ai" role="img" aria-label={`Đã dùng ${aiMetric.percentUsed}% hạn ngạch`}>
              <span style={{ width: `${aiMetric.percentUsed}%` }} />
            </div>
            <div className="meter-line">
              <span>
                Đã tiêu thụ: <strong>{(aiMetric.dailyTokenUsage / 1000000).toFixed(2)}M tokens</strong>
              </span>
              <span>Hạn mức: {(aiMetric.dailyTokenLimit / 1000000).toFixed(0)}M tokens/ngày</span>
            </div>
            <p className="meter-note">
              Mô hình: {aiMetric.model} · Đặt lại sau: {aiMetric.resetHours} giờ
            </p>
          </>
        ) : (
          <p className="meter-note" style={{ marginTop: 12 }}>
            Chưa có dữ liệu sử dụng AI
          </p>
        )}
      </section>
    </div>
  );
}
