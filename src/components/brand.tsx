import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="MasterEnglish, về trang chủ">
      <span className="brand-mark">m<span>✳</span></span>
      <span>master<span>english</span><small>LEARN WITH PURPOSE</small></span>
    </Link>
  );
}
