export type Status = "available" | "rolling" | "soon";

export const STATUS_LABEL: Record<Status, string> = {
  available: "Đã có",
  rolling: "Đang mở dần",
  soon: "Sắp ra mắt",
};

/** Nhãn trạng thái tính năng. Chỉ có ba mức, theo luật trung thực sản phẩm (docs/UI_STYLE_GUIDE.md). */
export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-badge-${status}`}>{STATUS_LABEL[status]}</span>;
}
