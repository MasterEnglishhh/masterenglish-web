import { Reveal } from "@/components/reveal";
import { CTA_NOTE, FEATURES } from "../data/content";
import { FlipCardDemo } from "./flip-card-demo";
import { NotebookMock, ProgressMock } from "./feature-mocks";
import { GoalMock } from "./goal-mock";
import { PrimaryCta } from "./primary-cta";

const FRAMES = [
  <FlipCardDemo key="review" compact />,
  <NotebookMock key="notebook" />,
  <GoalMock key="goal" />,
  <ProgressMock key="progress" />,
];

export function FeaturesSection() {
  return (
    <section className="lp-section" data-mood="happy" aria-labelledby="lp-feat-title">
      <div className="lp-wrap">
        <Reveal>
          <span className="lp-kicker">{FEATURES.kicker}</span>
          <h2 id="lp-feat-title">
            Bốn màn hình <em>bạn sẽ dùng.</em>
          </h2>
          <p className="lp-body">{FEATURES.lead}</p>
        </Reveal>
        <div className="lp-frames" data-motion="scroll">
          {FEATURES.frames.map((f, i) => (
            <figure key={f.id} className={`lp-glass lp-frame lp-frame-${i}`}>
              <figcaption>{f.name}</figcaption>
              {FRAMES[i]}
            </figure>
          ))}
        </div>
        <div className="lp-cta-row">
          <PrimaryCta />
          <p className="lp-note">{CTA_NOTE}</p>
        </div>
      </div>
    </section>
  );
}
