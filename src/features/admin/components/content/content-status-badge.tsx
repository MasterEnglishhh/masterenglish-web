import type { ContentRevisionStatus } from "../../types/content-ops";

const BADGES: Record<string, { className: string; label: string }> = {
  DRAFT: { className: "badge-draft", label: "Bản nháp (Draft)" },
  IN_REVIEW: { className: "badge-review", label: "Đang thẩm định" },
  APPROVED: { className: "badge-approved", label: "Đã duyệt" },
  REJECTED: { className: "badge-locked", label: "Bị từ chối" },
  PUBLISHED: { className: "badge-published", label: "Đã xuất bản (Live)" },
  ARCHIVED: { className: "badge-archived", label: "Lưu trữ" },
};

export function ContentStatusBadge({ status }: { status: ContentRevisionStatus }) {
  const badge = BADGES[status];
  return <span className={`admin-badge ${badge?.className ?? ""}`}>{badge?.label ?? status}</span>;
}
