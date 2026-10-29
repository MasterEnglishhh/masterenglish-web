import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon } from "@/components/arrow-icon";
import { placeholderSections } from "@/features/learning/data/preview";

export function generateStaticParams() {
  return Object.keys(placeholderSections).map((section) => ({ section }));
}

async function SectionContent({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const resolved = await Promise.resolve(params);
  const section = resolved?.section;
  const item = section ? placeholderSections[section] : null;

  if (!item) {
    notFound();
  }

  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">{item.kicker}</span>
        <h1>
          {item.title}
          <br />
          <em>{item.emphasis}</em>
        </h1>
        <p>{item.description}</p>
      </div>
      <div className="empty-page">
        <div className="empty-page-symbol">✳</div>
        <span>KHÔNG GIAN ĐANG CHỜ DỮ LIỆU</span>
        <h2>{item.empty}</h2>
        <p>
          Trang này sẽ lấy dữ liệu từ tài khoản và API học tập khi được kết nối.
          Hiện bạn có thể khám phá các màn hình mẫu.
        </p>
        <Link href={item.href} className="button button-dark">
          {item.next} <ArrowIcon />
        </Link>
      </div>
    </main>
  );
}

export default function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="learning-content inner-page">
          <div className="page-heading">
            <span className="section-kicker">ĐANG TẢI...</span>
            <h1>Đang mở không gian học...</h1>
          </div>
        </main>
      }
    >
      <SectionContent params={params} />
    </Suspense>
  );
}
