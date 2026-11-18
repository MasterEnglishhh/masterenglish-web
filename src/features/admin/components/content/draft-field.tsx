import type { ReactNode } from "react";

/** Một ô nhập của biểu mẫu soạn nội dung: nhãn bao quanh điều khiển nên được gắn đúng cho trình đọc màn hình. */
export function DraftField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="draft-field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/** Hai ô nhập cạnh nhau. */
export function DraftRow({ children }: { children: ReactNode }) {
  return <div className="admin-form-row">{children}</div>;
}

export const CEFR_OPTIONS = [
  ["A1", "A1 - Căn bản"],
  ["A2", "A2 - Sơ cấp"],
  ["B1", "B1 - Trung cấp"],
  ["B2", "B2 - Trung cao cấp"],
  ["C1", "C1 - Cao cấp"],
  ["C2", "C2 - Thành thạo"],
] as const;
