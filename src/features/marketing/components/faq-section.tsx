import { Reveal } from "@/components/reveal";
import { FAQ } from "../data/content";

export function FaqSection() {
  return (
    <section id="hoi-dap" className="lp-section" data-mood="thinking" aria-labelledby="lp-faq-title">
      <div className="lp-wrap lp-faq">
        <Reveal>
          <span className="lp-kicker">{FAQ.kicker}</span>
          <h2 id="lp-faq-title">
            Hỏi thẳng, <em>đáp thẳng.</em>
          </h2>
        </Reveal>
        <div className="lp-faq-list">
          {FAQ.items.map((item) => (
            <details key={item.q} className="lp-glass lp-faq-item">
              <summary>
                <span>{item.q}</span>
                <i aria-hidden="true" />
              </summary>
              <div className="lp-faq-answer">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
