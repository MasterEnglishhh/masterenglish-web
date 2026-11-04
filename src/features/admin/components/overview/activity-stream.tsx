import { Clock, ShieldAlert, CheckCircle, Info } from "lucide-react";
import type { RecentActivity } from "../../types/admin";

export function ActivityStream({ activities }: { activities: RecentActivity[] }) {
  return (
    <div className="admin-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <span className="admin-kicker">NHẬT KÝ VẬN HÀNH</span>
          <h2 style={{ fontSize: 18, fontWeight: 750, margin: 0 }}>
            Hoạt động quản trị <em>gần đây</em>
          </h2>
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={13} /> Cập nhật tức thời
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {activities.map((act) => (
          <div
            key={act.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "12px 14px",
              background: "#fafaf7",
              borderRadius: 14,
              border: "1px solid #eeeee8",
            }}
          >
            <div
              style={{
                marginTop: 2,
                color:
                  act.status === "WARNING"
                    ? "#dc2626"
                    : act.status === "SUCCESS"
                    ? "#059669"
                    : "var(--indigo)",
              }}
            >
              {act.status === "WARNING" ? (
                <ShieldAlert size={18} />
              ) : act.status === "SUCCESS" ? (
                <CheckCircle size={18} />
              ) : (
                <Info size={18} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                  {act.action}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{act.timestamp}</span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#616579" }}>
                Đối tượng: <strong>{act.target}</strong> · Thực hiện bởi: {act.actorName} ({act.actorEmail})
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
