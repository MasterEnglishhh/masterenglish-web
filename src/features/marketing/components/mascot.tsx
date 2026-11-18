export type MascotExpression = "happy" | "thinking" | "celebrating" | "sleepy";

interface MascotProps {
  expression?: MascotExpression;
  /** Nối vào id các bộ phận khi trang có nhiều linh vật, để id không trùng nhau. */
  idSuffix?: string;
  className?: string;
}

/**
 * Linh vật vẽ bằng SVG tách lớp. Mọi chuyển động nằm trong marketing.css và bám vào
 * `data-part`, `data-mouth`, `data-extra`, nên có thể thay ruột SVG bằng bản vẽ khác
 * miễn giữ nguyên các thuộc tính này. Con ngươi đọc `--mx`, `--my` từ phần tử cha.
 */
export function Mascot({ expression = "happy", idSuffix = "", className = "" }: MascotProps) {
  const id = (name: string) => `mascot-${name}${idSuffix}`;
  return (
    <svg
      className={`mascot ${className}`}
      data-expression={expression}
      viewBox="0 0 220 240"
      role="img"
      aria-label="Linh vật MasterEnglish"
    >
      <ellipse cx="110" cy="226" rx="58" ry="8" fill="#20223b" opacity=".1" />

      <g id={id("hands")} data-part="hands">
        <g data-hand="l">
          <path d="M66 156c-14 2-22 10-24 20" stroke="#fff" strokeWidth="15" strokeLinecap="round" fill="none" />
          <circle cx="42" cy="178" r="11" fill="#fff" />
        </g>
        <g data-hand="r">
          <path d="M154 156c14 2 22 10 24 20" stroke="#fff" strokeWidth="15" strokeLinecap="round" fill="none" />
          <circle cx="178" cy="178" r="11" fill="#fff" />
        </g>
      </g>

      <g id={id("body")} data-part="body">
        <path
          d="M110 86c40 0 66 24 66 62 0 34-24 70-66 70s-66-36-66-70c0-38 26-62 66-62z"
          fill="#fff"
        />
        <path d="M70 188c10 14 24 22 40 22s30-8 40-22c-12 6-26 9-40 9s-28-3-40-9z" fill="#f0eeff" />
        <ellipse cx="78" cy="152" rx="11" ry="7" fill="#ffc9b8" opacity=".75" />
        <ellipse cx="142" cy="152" rx="11" ry="7" fill="#ffc9b8" opacity=".75" />
      </g>

      <g id={id("ears")} data-part="ears">
        <g data-ear="l">
          <path d="M58 110c-8-18-6-34 2-42 12 4 24 14 30 26z" fill="#fff" />
          <path d="M64 102c-3-10-3-18 0-24 7 3 13 9 17 16z" fill="#dedbfd" />
        </g>
        <g data-ear="r">
          <path d="M162 110c8-18 6-34-2-42-12 4-24 14-30 26z" fill="#fff" />
          <path d="M156 102c3-10 3-18 0-24-7 3-13 9-17 16z" fill="#dedbfd" />
        </g>
      </g>

      <g id={id("hat")} data-part="hat">
        <path d="M80 84v14c0 8 14 14 30 14s30-6 30-14V84z" fill="#3933a8" />
        <path d="M110 58 168 80 110 102 52 80z" fill="#5a54e8" />
        <path d="M110 58 168 80 110 102" fill="#fff" opacity=".1" />
        <path d="M110 80 160 84v18" stroke="#d9f586" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="160" cy="106" r="5.5" fill="#d9f586" />
      </g>

      <g id={id("eyes")} data-part="eyes">
        <g data-eye-open>
          <ellipse cx="88" cy="136" rx="15" ry="19" fill="#20223b" />
          <ellipse cx="132" cy="136" rx="15" ry="19" fill="#20223b" />
          <g id={id("pupils")} data-part="pupils">
            <circle cx="91" cy="131" r="6" fill="#fff" />
            <circle cx="135" cy="131" r="6" fill="#fff" />
            <circle cx="85" cy="142" r="3" fill="#fff" opacity=".85" />
            <circle cx="129" cy="142" r="3" fill="#fff" opacity=".85" />
          </g>
        </g>
        <g data-eye-closed fill="none" stroke="#20223b" strokeWidth="4" strokeLinecap="round">
          <path d="M74 138q14 10 28 0" />
          <path d="M118 138q14 10 28 0" />
        </g>
      </g>

      <g id={id("mouth")} data-part="mouth">
        <path data-mouth="happy" d="M98 158q12 12 24 0" stroke="#20223b" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path data-mouth="thinking" d="M102 162q8-4 16 0" stroke="#20223b" strokeWidth="4" strokeLinecap="round" fill="none" />
        <g data-mouth="celebrating">
          <path d="M96 156q14 24 28 0z" fill="#20223b" />
          <path d="M102 166q8 8 16 0q-8-4-16 0z" fill="#ff8f8f" />
        </g>
        <ellipse data-mouth="sleepy" cx="110" cy="162" rx="5" ry="4" fill="#20223b" />
      </g>

      <g data-extra="thinking" fill="#5a54e8">
        <circle cx="170" cy="60" r="4" />
        <circle cx="182" cy="46" r="6" />
        <circle cx="198" cy="28" r="9" />
      </g>
      <g data-extra="sleepy" fill="#5a54e8" fontWeight="900" fontSize="22">
        <text x="162" y="82">z</text>
        <text x="180" y="62" fontSize="16">z</text>
      </g>
      <g data-extra="celebrating" fill="#d9f586" stroke="#5a54e8" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M30 70l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" />
        <path d="M192 96l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </g>
    </svg>
  );
}
