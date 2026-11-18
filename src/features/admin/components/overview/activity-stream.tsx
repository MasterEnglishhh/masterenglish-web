import { CheckCircle, Info, ShieldAlert } from "lucide-react";
import type { RecentActivity } from "../../types/admin";

const STATUS = {
  WARNING: { Icon: ShieldAlert, tone: "is-warning" },
  SUCCESS: { Icon: CheckCircle, tone: "is-success" },
} as const;

export function ActivityStream({ activities }: { activities: RecentActivity[] }) {
  return (
    <section className="glass-card admin-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-kicker">NHẬT KÝ VẬN HÀNH</span>
          <h2>
            Hoạt động quản trị <em>gần đây</em>
          </h2>
        </div>
      </div>
      <div className="admin-list">
        {activities.map((act) => {
          const { Icon, tone } = STATUS[act.status as keyof typeof STATUS] ?? { Icon: Info, tone: "" };
          return (
            <div key={act.id} className="admin-list-item">
              <span className={`admin-list-icon ${tone}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <div className="admin-list-body">
                <div className="admin-list-top">
                  <strong>{act.action}</strong>
                  <span className="admin-time">{act.timestamp}</span>
                </div>
                <p>
                  Đối tượng: <strong>{act.target}</strong> · Thực hiện bởi: {act.actorName} ({act.actorEmail})
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
