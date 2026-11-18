/** Trạng thái lưu của một biểu mẫu và dòng thông báo kết quả của nó. */
export type SaveStatus =
  | { kind: "idle" | "saving" }
  | { kind: "saved"; message: string }
  | {
      kind: "error";
      error: {
        message: string;
        status?: number;
        fieldErrors?: Record<string, string>;
      };
    };

export function StatusLine({ status }: { status: SaveStatus }) {
  if (status.kind === "saved")
    return (
      <p className="account-status" role="status">
        ✓ {status.message}
      </p>
    );
  if (status.kind === "error")
    return (
      <p className="account-status account-status-error" role="alert">
        {status.error.message}
      </p>
    );
  return null;
}

export function fieldError(status: SaveStatus, field: string) {
  return status.kind === "error"
    ? status.error.fieldErrors?.[field]
    : undefined;
}
