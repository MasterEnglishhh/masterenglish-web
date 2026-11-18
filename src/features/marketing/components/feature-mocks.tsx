import { FEATURES, SAMPLE_WORDS } from "../data/content";
import { SampleTag } from "@/components/sample-tag";

/** Sổ tay từ vựng mẫu: đủ năm trường của một từ đã lưu (từ, phiên âm, cấp CEFR, loại từ, nghĩa). */
export function NotebookMock() {
  return (
    <div className="lp-notebook">
      <SampleTag />
      <ul>
        {SAMPLE_WORDS.map((w) => (
          <li key={w.lemma}>
            <span className="lp-nb-word">
              <strong>{w.lemma}</strong>
              <small className="ipa-text">{w.ipa}</small>
            </span>
            <span className="lp-nb-tags">
              <b>{w.cefr}</b>
              <i>{w.pos}</i>
            </span>
            <span className="lp-nb-meaning">{w.meaning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiến độ mẫu: đúng sáu chỉ số của màn Tiến độ thật. Không vẽ biểu đồ theo ngày vì sản phẩm không có số liệu theo ngày. */
export function ProgressMock() {
  return (
    <div className="lp-progressmock">
      <SampleTag />
      <dl>
        {FEATURES.progressStats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
