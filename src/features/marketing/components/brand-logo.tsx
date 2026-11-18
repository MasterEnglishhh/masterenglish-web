import { useId } from "react";

const BUBBLE =
  "M16 6h32a12 12 0 0 1 12 12v22a12 12 0 0 1-12 12H30L16 62V52h0A12 12 0 0 1 4 40V18A12 12 0 0 1 16 6z";
const LETTER_M =
  "M13 47V25h7v3c2-3 4-4 8-4 4 0 7 2 8 5 2-3 5-5 9-5 6 0 9 4 9 11v12h-8V36c0-4-1-5-4-5s-5 2-5 6v10h-8V36c0-4-1-5-4-5s-5 2-5 6v10z";
const STAR = "M52 2l3.4 8.6L64 14l-8.6 3.4L52 26l-3.4-8.6L40 14l8.6-3.4z";

/** Dấu hiệu: chữ m trong bong bóng thoại, kèm ngôi sao bốn cánh. */
export function BrandMark({ monochrome = false, size = 40 }: { monochrome?: boolean; size?: number }) {
  const maskId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {monochrome ? (
        <>
          <mask id={maskId}>
            <rect width="64" height="64" fill="#fff" />
            <path d={LETTER_M} transform="translate(-2 -9)" fill="#000" />
          </mask>
          <path d={BUBBLE} fill="currentColor" mask={`url(#${maskId})`} />
          <path d={STAR} fill="currentColor" />
        </>
      ) : (
        <>
          <path d={BUBBLE} fill="#5a54e8" />
          <path d={LETTER_M} transform="translate(-2 -9)" fill="#fff" />
          <path d={STAR} fill="#d9f586" stroke="#20223b" strokeWidth="1.5" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/** Logo đầy đủ: dấu hiệu + "masterenglish" viết thường liền nhau. */
export function BrandLogo({ monochrome = false, className = "" }: { monochrome?: boolean; className?: string }) {
  return (
    <span className={`lp-logo ${monochrome ? "is-mono" : ""} ${className}`}>
      <BrandMark monochrome={monochrome} />
      <span className="lp-logo-word">
        master<span>english</span>
      </span>
    </span>
  );
}
