import type { Metadata } from "next";
import { ProgressView } from "@/features/vocabulary";
import { RequireAuth } from "@/features/auth";

export const metadata: Metadata = { title: "Kết quả | MasterEnglish" };

export default function ResultsPage() {
  return (
    <RequireAuth>
      <main className="learning-content inner-page">
        <div className="page-heading">
          <span className="section-kicker">KẾT QUẢ / NHÌN LẠI ĐỂ ĐI TIẾP</span>
          <h1>
            Mỗi lần luyện,
            <br />
            <em>một điều hiểu thêm.</em>
          </h1>
          <p>Tiến độ từ vựng và lịch sử ôn tập của bạn.</p>
        </div>
        <ProgressView />
      </main>
    </RequireAuth>
  );
}
