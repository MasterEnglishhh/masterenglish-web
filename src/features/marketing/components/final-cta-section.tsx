import { CTA_NOTE, FINAL } from "../data/content";
import { Mascot } from "@/components/mascot";
import { PrimaryCta } from "./primary-cta";

const CONFETTI = Array.from({ length: 14 }, (_, i) => i);

export function FinalCtaSection() {
  return (
    <section className="lp-section lp-final" data-mood="none" aria-labelledby="lp-final-title">
      <div className="lp-wrap lp-final-card lp-glass" data-pause>
        <div className="lp-confetti" aria-hidden="true">
          {CONFETTI.map((i) => (
            <span key={i} className={`lp-confetti-${i % 5}`} style={{ left: `${(i * 7 + 5) % 96}%`, animationDelay: `${(i % 7) * 0.35}s` }} />
          ))}
        </div>
        <div data-motion="pointer" className="lp-final-mascot-wrap">
          <Mascot expression="celebrating" idSuffix="-final" className="lp-final-mascot" />
        </div>
        <h2 id="lp-final-title">
          Bắt đầu <em>từ hôm nay.</em>
        </h2>
        <p className="lp-body">{FINAL.body}</p>
        <PrimaryCta />
        <p className="lp-note">{CTA_NOTE}</p>
      </div>
    </section>
  );
}
