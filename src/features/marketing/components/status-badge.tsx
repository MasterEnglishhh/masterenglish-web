import { STATUS_LABEL, type Status } from "../data/content";

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`lp-badge lp-badge-${status}`}>{STATUS_LABEL[status]}</span>;
}
