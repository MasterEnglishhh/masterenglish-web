import { ErrorState } from "@/components/error-state";
import type { SystemResource } from "../../types/system-policy";

interface SystemSectionStatusProps {
  resource: SystemResource<unknown>;
  loadingLabel: string;
  retryDisabled?: boolean;
}

export function SystemSectionStatus({
  resource,
  loadingLabel,
  retryDisabled,
}: SystemSectionStatusProps) {
  const { data, isLoading, error, reload } = resource;
  const previous =
    data !== null
      ? " Đang hiển thị dữ liệu từ lần tải thành công gần nhất."
      : "";
  if (isLoading)
    return (
      <p className="admin-card-note" role="status">
        {loadingLabel}
        {previous}
      </p>
    );
  if (error)
    return (
      <ErrorState
        variant="inline"
        message={`${error}${previous}`}
        onRetry={retryDisabled ? undefined : reload}
      />
    );
  return null;
}
