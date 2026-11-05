import type { ContentRevisionStatus } from "../../types/content-ops";

export function ContentStatusBadge({ status }: { status: ContentRevisionStatus }) {
  switch (status) {
    case "DRAFT":
      return <span className="admin-badge badge-draft">Bản nháp (Draft)</span>;
    case "IN_REVIEW":
      return <span className="admin-badge badge-review">Đang thẩm định</span>;
    case "APPROVED":
      return <span className="admin-badge badge-role-admin">Đã duyệt</span>;
    case "PUBLISHED":
      return <span className="admin-badge badge-published">Đã xuất bản (Live)</span>;
    case "ARCHIVED":
      return <span className="admin-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>Lưu trữ</span>;
    default:
      return <span className="admin-badge">{status}</span>;
  }
}
