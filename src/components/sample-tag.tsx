export const SAMPLE_LABEL = "Ví dụ minh họa";

/** Nhãn bắt buộc trên mọi giao diện mô phỏng hoặc dữ liệu minh họa. */
export function SampleTag({ className = "", label = SAMPLE_LABEL }: { className?: string; label?: string }) {
  return <span className={`sample-tag ${className}`}>{label}</span>;
}
