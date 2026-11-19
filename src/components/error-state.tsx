import { Mascot } from "./mascot";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** `page`: thẻ kính có linh vật cho lỗi tải cả vùng. `inline`: dải báo lỗi gọn cho thao tác nhỏ. */
  variant?: "page" | "inline";
  title?: string;
  idSuffix?: string;
}

/** Trạng thái lỗi: giải thích bằng tiếng Việt và nút thử lại. Luôn có role="alert". */
export function ErrorState({
  message,
  onRetry,
  retryLabel = "Thử tải lại",
  variant = "page",
  title = "Chưa tải được dữ liệu",
  idSuffix = "-error",
}: ErrorStateProps) {
  const retry = onRetry && (
    <button type="button" className="btn-ghost btn-sm" onClick={onRetry}>
      {retryLabel}
    </button>
  );
  if (variant === "inline") {
    return (
      <div role="alert" className="error-state">
        <span>{message}</span>
        {retry}
      </div>
    );
  }
  return (
    <div role="alert" className="glass-card empty-page">
      <Mascot expression="thinking" idSuffix={idSuffix} className="empty-page-mascot" />
      <h2>{title}</h2>
      <p>{message}</p>
      {retry}
    </div>
  );
}
