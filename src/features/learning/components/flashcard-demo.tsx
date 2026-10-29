"use client";

import { useFlashcardDemo } from "../hooks/use-flashcard-demo";

export function FlashcardDemo() {
  const { cards, card, index, flipped, ratedCount, finished, flip, rate, restart } = useFlashcardDemo();

  return (
    <section className="flash-demo">
      <div className="flash-heading">
        <span>THẺ HỌC MẪU <b>·</b> {finished ? "HOÀN TẤT" : `${index + 1} / ${cards.length}`}</span>
        <div className="flash-progress" aria-hidden="true">
          {cards.map((_, i) => <span key={i} className={i < ratedCount ? "filled" : ""} />)}
        </div>
      </div>

      {finished ? (
        <div className="flash-finished">
          <span className="finish-star">✳</span>
          <span className="section-kicker">ĐÃ XEM HẾT THẺ MẪU</span>
          <h2>Một nhịp học<br /><em>đã hoàn thành.</em></h2>
          <p>Đây là trải nghiệm cục bộ. Đánh giá của bạn chưa được lưu hoặc dùng để lên lịch ôn.</p>
          <button className="button button-dark" onClick={restart}>Xem lại từ đầu <span>↺</span></button>
        </div>
      ) : (
        <>
          <button
            className={`flash-card ${flipped ? "flipped" : ""}`}
            onClick={flip}
            aria-label={flipped ? "Xem lại mặt trước" : "Lật thẻ để xem nghĩa"}
            aria-pressed={flipped}
          >
            <span className="flash-card-inner">
              <span className="flash-card-face flash-card-front" aria-hidden={flipped}>
                <span className="flash-card-top"><span>MASTERENGLISH / VOCABULARY</span><span>✳</span></span>
                <span className="flash-word">{card.word}</span>
                <span className="flash-type">{card.type} <span>·</span> {card.ipa}</span>
                <span className="flash-hint">Chạm để lật sang phải <b>→</b></span>
              </span>
              <span className="flash-card-face flash-card-back" aria-hidden={!flipped}>
                <span className="flash-card-top"><span>MASTERENGLISH / VOCABULARY</span><span>✳</span></span>
                <span className="flash-meaning">{card.meaning}</span>
                <span className="flash-example">“{card.example}”<small>{card.translation}</small></span>
                <span className="flash-hint">Chạm để xem lại từ <b>←</b></span>
              </span>
            </span>
          </button>
          <div className="flash-actions">
            <span>Bạn nhớ nghĩa này thế nào?</span>
            <div>
              <button onClick={() => rate("Quên")} disabled={!flipped}>Quên</button>
              <button onClick={() => rate("Khó")} disabled={!flipped}>Khó</button>
              <button onClick={() => rate("Đã nhớ")} disabled={!flipped}>Đã nhớ <span>↗</span></button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
