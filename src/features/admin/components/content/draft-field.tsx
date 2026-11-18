import type { ReactNode } from "react";

/** Một ô nhập của biểu mẫu soạn nội dung: nhãn phía trên, điều khiển ở dưới. */
export function DraftField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--ink)",
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/** Hai ô nhập cạnh nhau. */
export function DraftRow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {children}
    </div>
  );
}

export const CEFR_OPTIONS = [
  ["A1", "A1 - Căn bản"],
  ["A2", "A2 - Sơ cấp"],
  ["B1", "B1 - Trung cấp"],
  ["B2", "B2 - Trung cao cấp"],
  ["C1", "C1 - Cao cấp"],
  ["C2", "C2 - Thành thạo"],
] as const;
