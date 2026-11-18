import { Reveal } from "@/components/reveal";
import { HOW } from "../data/content";
import { FlipCardDemo } from "./flip-card-demo";

export function HowSection() {
  return (
    <section id="cach-hoc" className="lp-section" data-mood="happy" aria-labelledby="lp-how-title">
      <div className="lp-wrap lp-how">
        <Reveal className="lp-how-copy">
          <span className="lp-kicker">{HOW.kicker}</span>
          <h2 id="lp-how-title">
            Ba bước, <em>đủ để đi tiếp.</em>
          </h2>
          <ol className="lp-steps">
            {HOW.steps.map((s) => (
              <li key={s.n}>
                <span className="lp-step-n">{s.n}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal className="lp-how-demo">
          <FlipCardDemo />
        </Reveal>
      </div>
    </section>
  );
}
