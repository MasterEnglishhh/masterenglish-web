import { SAMPLE_WORDS } from "../data/content";
import { Mascot } from "@/components/mascot";
import { SampleTag } from "@/components/sample-tag";
import { SparkleCanvas } from "./sparkle-canvas";
import { StarIcon } from "./star-icon";

/** Vị trí (trái, trên) của các ngôi sao nền, tối đa 8. */
const STARS = [
  ["8%", "14%"],
  ["88%", "10%"],
  ["20%", "70%"],
  ["92%", "62%"],
  ["50%", "4%"],
  ["4%", "44%"],
  ["76%", "88%"],
  ["64%", "30%"],
];

/**
 * Sân khấu 3D: ba lớp ở các độ sâu khác nhau (nền, thẻ từ, linh vật).
 * Độ nghiêng và độ lệch lấy từ --mx, --my của MotionRoot; lớp này không có JS riêng ngoài hạt sáng.
 */
export function HeroStage() {
  return (
    <div className="lp-stage" data-motion="both" data-pause>
      <SampleTag className="lp-stage-tag" />
      <div className="lp-scene">
        <div className="lp-layer lp-layer-back" aria-hidden="true">
          <span className="lp-blob lp-blob-a" />
          <span className="lp-blob lp-blob-b" />
          <span className="lp-blob lp-blob-c" />
          <SparkleCanvas />
          {STARS.map(([left, top], i) => (
            <StarIcon key={i} className={`lp-star lp-star-${i % 3}`} style={{ left, top }} />
          ))}
        </div>
        <div className="lp-layer lp-layer-mid">
          {SAMPLE_WORDS.map((w, i) => (
            <div key={w.lemma} className={`lp-wordcard lp-wordcard-${i}`}>
              <strong>{w.lemma}</strong>
              <span className="ipa-text">{w.ipa}</span>
              <small>
                <b>{w.cefr}</b> {w.pos} {w.meaning}
              </small>
            </div>
          ))}
        </div>
        <div className="lp-layer lp-layer-front">
          <Mascot expression="happy" className="lp-hero-mascot" />
        </div>
      </div>
    </div>
  );
}
