import { CTA_NOTE, HERO } from "../data/content";
import { HeroStage } from "./hero-stage";
import { PrimaryCta } from "./primary-cta";

export function HeroSection() {
  return (
    <section className="lp-hero lp-wrap" aria-labelledby="lp-title" data-mood="none">
      <div className="lp-hero-copy">
        <h1 id="lp-title">
          Học có hướng. <em>Tiến bộ</em> có lý do.
        </h1>
        <p className="lp-lead">{HERO.lead}</p>
        <div className="lp-actions">
          <PrimaryCta />
          <a className="lp-btn lp-btn-ghost" href="#cach-hoc">
            {HERO.secondary}
          </a>
        </div>
        <p className="lp-note">{CTA_NOTE}</p>
      </div>
      <HeroStage />
    </section>
  );
}
