import { Reveal } from "@/components/reveal";
import { AUDIENCE } from "../data/content";
import { TiltGlassCard } from "./tilt-glass-card";

export function AudienceSection() {
  return (
    <section id="danh-cho-ai" className="lp-section" data-mood="thinking" aria-labelledby="lp-aud-title">
      <div className="lp-wrap">
        <Reveal>
          <span className="lp-kicker">{AUDIENCE.kicker}</span>
          <h2 id="lp-aud-title">
            Hai cách học, <em>một nơi để bắt đầu.</em>
          </h2>
        </Reveal>
        <div className="lp-audience">
          {AUDIENCE.cards.map((c, i) => (
            <TiltGlassCard key={c.tag} className={`lp-aud-card lp-aud-card-${i}`}>
              <span className="lp-tag">{c.tag}</span>
              <h3>{c.title}</h3>
              <ul>
                {c.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </TiltGlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
