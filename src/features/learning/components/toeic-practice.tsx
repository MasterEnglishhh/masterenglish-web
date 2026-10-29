"use client";

import { useToeicPractice } from "../hooks/use-toeic-practice";

export function ToeicPractice() {
  const { options, answer, selected, submitted, message, isCorrect, selectOption, submit, reset } = useToeicPractice();

  return (
    <section className="practice-section" aria-labelledby="practice-title">
      <div className="practice-heading">
        <div>
          <span className="section-kicker">THỬ MỘT CÂU · PART 5</span>
          <h2 id="practice-title">Một câu nhỏ, <em>hiểu thật kỹ.</em></h2>
        </div>
        <span className="sample-label">BÀI MẪU · KHÔNG LƯU KẾT QUẢ</span>
      </div>

      <div className="practice-panel">
        <div className="question-panel">
          <div className="question-top"><span>READING / PART 5</span><span>01 / 01</span></div>
          <h3>The report must be ______ before the meeting begins.</h3>
          <p>Chọn từ phù hợp nhất để hoàn thành câu.</p>
          <fieldset className="options" disabled={submitted}>
            <legend className="sr-only">Các phương án trả lời</legend>
            {options.map(option => (
              <label
                key={option.key}
                className={`option ${selected === option.key ? "selected" : ""} ${submitted && option.key === answer ? "correct" : ""}`}
              >
                <input
                  type="radio"
                  name="toeic-demo"
                  value={option.key}
                  checked={selected === option.key}
                  onChange={() => selectOption(option.key)}
                />
                <span className="option-key">{option.key}</span>
                <span>{option.text}</span>
                <span className="option-indicator">{selected === option.key ? "✓" : ""}</span>
              </label>
            ))}
          </fieldset>
          {message && <p className="form-message" role="alert">{message}</p>}
          <div className="question-actions">
            {submitted ? (
              <button className="button button-outline" onClick={reset}>Làm lại câu này <span>↺</span></button>
            ) : (
              <button className="button button-dark" onClick={submit}>Xem lời giải <span>↗</span></button>
            )}
            <span>Lựa chọn chỉ được giữ trong phiên xem thử</span>
          </div>
        </div>

        <div className="explanation-panel">
          <div className="explanation-icon">✳</div>
          <span className="section-kicker">SAU KHI HOÀN THÀNH</span>
          {submitted ? (
            <>
              <h3>{isCorrect ? "Bạn đã chọn đúng." : "Cùng xem lại nhé."}</h3>
              <p><strong>Đáp án B · completed.</strong> Câu cần dạng bị động “must be + quá khứ phân từ”. Báo cáo phải được hoàn thành trước khi cuộc họp bắt đầu.</p>
              <div className="explanation-note">Cấu trúc cần nhớ <b>must be + V3/ed</b></div>
            </>
          ) : (
            <>
              <h3>Hiểu đáp án,<br />không chỉ nhớ đáp án.</h3>
              <p>Sau khi chọn và xem lời giải, phần này sẽ giải thích cấu trúc trong câu. Trước đó, đáp án đúng vẫn được giữ kín.</p>
              <div className="explanation-note">Bước 01 <b>Chọn một phương án</b></div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
