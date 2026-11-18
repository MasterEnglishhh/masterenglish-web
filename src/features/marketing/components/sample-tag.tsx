import { SAMPLE_LABEL } from "../data/content";

export function SampleTag({ className = "" }: { className?: string }) {
  return <span className={`lp-sample ${className}`}>{SAMPLE_LABEL}</span>;
}
