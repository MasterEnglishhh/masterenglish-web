import { WHY } from "../data/content";
import { Reveal } from "@/components/reveal";
import { StatusBadge } from "@/components/status-badge";

export function WhySection() {
  return (
    <section className="lp-section lp-why" data-mood="happy" aria-labelledby="lp-why-title">
      <div className="lp-wrap">
        <Reveal>
          <span className="lp-kicker">{WHY.kicker}</span>
          <h2 id="lp-why-title">
            TOEIC <em>Listening &amp; Reading</em>
          </h2>
          <p className="lp-body">{WHY.body}</p>
        </Reveal>
      </div>
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track" data-motion="scroll">
          {[...WHY.marquee, ...WHY.marquee, ...WHY.marquee].map((w, i) => (
            <span key={i}>
              {w}
              <i>✳</i>
            </span>
          ))}
        </div>
      </div>
      <div className="lp-wrap lp-pillars">
        {WHY.pillars.map((p) => (
          <Reveal key={p.name} className="lp-glass lp-pillar">
            <StatusBadge status={p.status} />
            <h3>{p.name}</h3>
            <p>{p.note}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
