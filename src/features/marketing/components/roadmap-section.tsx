import { Reveal } from "@/components/reveal";
import { ROADMAP } from "../data/content";
import { Mascot } from "./mascot";
import { StatusBadge } from "./status-badge";

export function RoadmapSection() {
  return (
    <section className="lp-section lp-roadmap" data-mood="none" aria-labelledby="lp-road-title">
      <div className="lp-wrap lp-road">
        <Reveal className="lp-road-copy">
          <span className="lp-kicker">{ROADMAP.kicker}</span>
          <h2 id="lp-road-title">
            Chưa xong, <em>nhưng nói thẳng.</em>
          </h2>
          <p className="lp-body">{ROADMAP.body}</p>
          <div className="lp-road-mascot-wrap" data-motion="pointer" data-pause>
            <Mascot expression="sleepy" idSuffix="-roadmap" className="lp-road-mascot" />
          </div>
        </Reveal>
        <ul className="lp-road-list">
          {ROADMAP.items.map((item) => (
            <li key={item.name}>
              <Reveal className="lp-glass lp-road-item">
                <StatusBadge status={item.status} />
                <h3>{item.name}</h3>
                <p>{item.note}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
