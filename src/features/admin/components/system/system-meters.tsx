import { Database, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type {
  AiQuotaMetric,
  StorageQuota,
  SystemResource,
} from "../../types/system-policy";
import { SystemSectionStatus } from "./system-section-status";

interface SystemMetersProps {
  storage: SystemResource<StorageQuota>;
  ai: SystemResource<AiQuotaMetric[]>;
}

const formatCount = new Intl.NumberFormat("vi-VN");

export function SystemMeters({ storage, ai }: SystemMetersProps) {
  const quota = storage.data;
  return (
    <div className="meter-grid">
      <section className="glass-card admin-card">
        <div className="meter-head">
          <div className="meter-title">
            <span className="admin-kpi-icon tone-peach">
              <Database size={18} aria-hidden="true" />
            </span>
            <h2>Cloudflare R2 Storage</h2>
          </div>
          {quota && <span className="meter-percent">{quota.percentUsed}%</span>}
        </div>
        <SystemSectionStatus
          resource={storage}
          loadingLabel="Đang tải dung lượng lưu trữ..."
        />
        {quota && (
          <>
            <div
              className="meter-bar"
              role="img"
              aria-label={`Đã dùng ${quota.percentUsed}% dung lượng`}
            >
              <span style={{ width: `${Math.min(quota.percentUsed, 100)}%` }} />
            </div>
            <div className="meter-line">
              <span>
                Đã dùng <strong>{quota.usedFormatted}</strong>
              </span>
              <span>Định mức {quota.limitFormatted}</span>
            </div>
            <p className="meter-note">
              Bucket <code className="admin-code">{quota.bucket}</code> ·{" "}
              {formatCount.format(quota.filesCount)} tệp âm thanh và hình ảnh
            </p>
          </>
        )}
      </section>

      <section className="glass-card admin-card">
        <div className="meter-head">
          <div className="meter-title">
            <span className="admin-kpi-icon">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <h2>Hạn ngạch AI hằng ngày</h2>
          </div>
        </div>
        <SystemSectionStatus
          resource={ai}
          loadingLabel="Đang tải hạn ngạch AI..."
        />
        {ai.data?.length === 0 && (
          <EmptyState
            className="admin-empty"
            title="Chưa có dữ liệu hạn ngạch AI"
          />
        )}
        {ai.data && ai.data.length > 0 && (
          <div className="meter-ai-list">
            {ai.data.map((metric) => (
              <div key={`${metric.provider}/${metric.model}`}>
                <div className="meter-head">
                  <span>
                    <strong>{metric.provider}</strong> · {metric.model}
                  </span>
                  <span className="meter-percent">{metric.percentUsed}%</span>
                </div>
                <div
                  className="meter-bar is-ai"
                  role="img"
                  aria-label={`Đã dùng ${metric.percentUsed}% hạn ngạch`}
                >
                  <span
                    style={{ width: `${Math.min(metric.percentUsed, 100)}%` }}
                  />
                </div>
                <div className="meter-line">
                  <span>
                    Đã dùng{" "}
                    <strong>
                      {formatCount.format(metric.dailyTokenUsage)}
                    </strong>{" "}
                    token
                  </span>
                  <span>
                    Hạn mức {formatCount.format(metric.dailyTokenLimit)}{" "}
                    token/ngày
                  </span>
                </div>
                <p className="meter-note">
                  Đặt lại sau {metric.resetHours} giờ
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
