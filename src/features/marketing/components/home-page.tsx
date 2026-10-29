import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { Reveal } from "@/components/reveal";
import { modules } from "../data/modules";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function HomePage() {
  return <div className="site-shell">
    <SiteHeader />

    <main>
      <section className="home-hero wrap" aria-labelledby="home-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> TIẾNG ANH ĐI CÙNG BẠN</div>
          <h1 id="home-title">Học có hướng.<br /><em>Tiến bộ</em> có lý do.</h1>
          <p className="hero-description">Một không gian để học tiếng Anh và luyện TOEIC theo cách rõ ràng hơn: bắt đầu từ điều bạn cần, luyện vừa đủ, rồi hiểu sâu những chỗ mình còn vấp.</p>
          <div className="hero-actions"><Link className="button button-dark" href="/learn">Khám phá không gian học <ArrowIcon /></Link><a className="text-link" href="#method">Xem cách học <span>↗</span></a></div>
          <div className="hero-footnote"><span className="tiny-star">✳</span> Bản xem trước giao diện · Chưa kết nối tài khoản học</div>
        </div>
        <div className="hero-art" aria-label="Minh họa hành trình học theo từng bước" role="img">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-label art-label-top"><span className="art-dot" /> YOUR LEARNING SPACE <span>↗</span></div>
          <div className="art-core"><div className="art-core-ink">M<span>✳</span></div><div className="art-core-caption">make it<br />make sense.</div></div>
          <div className="art-chip chip-one"><span>01</span> Học đúng trọng tâm <b>↗</b></div>
          <div className="art-chip chip-two"><span>02</span> Luyện từng bước <b>↗</b></div>
          <div className="art-chip chip-three"><span>03</span> Hiểu để tiến xa <b>↗</b></div>
          <div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✳</div>
          <div className="art-label art-label-bottom">ENGLISH, IN YOUR OWN RHYTHM <span>↘</span></div>
        </div>
      </section>

      <section id="method" className="method-section">
        <div className="wrap method-grid">
          <Reveal className="section-intro"><span className="section-kicker">01 / MỘT CÁCH HỌC DỄ THEO</span><h2>Đừng học nhiều hơn.<br /><em>Học rõ hơn.</em></h2></Reveal>
          <Reveal className="method-content"><p>Không có một lộ trình giống nhau cho tất cả. MasterEnglish giúp bạn nhìn thấy bước tiếp theo, luyện theo kỹ năng, rồi quay lại đúng phần cần cải thiện.</p><div className="method-steps"><div><span>01</span><strong>Chọn điều muốn học</strong><p>Từ vựng, ngữ pháp hoặc từng Part TOEIC.</p></div><div><span>02</span><strong>Luyện tập trong ngữ cảnh</strong><p>Đọc, nghe và làm bài theo nội dung phù hợp.</p></div><div><span>03</span><strong>Hiểu lỗi để đi tiếp</strong><p>Xem lại lời giải, ôn đúng phần còn vướng.</p></div></div></Reveal>
        </div>
      </section>

      <section id="roadmap" className="explore-section wrap">
        <Reveal className="explore-heading"><div><span className="section-kicker">02 / KHÔNG GIAN HỌC TẬP</span><h2>Mọi kỹ năng,<br /><em>một nhịp học.</em></h2></div><p>Mở một cánh cửa bất kỳ. Mỗi phần đều được thiết kế để bạn biết mình đang học gì và nên đi tiếp thế nào.</p></Reveal>
        <div className="module-list">{modules.map((module) => <Reveal key={module.number} className={`module-row module-${module.tone}`}><Link href={module.href}><span className="module-index">{module.number} /</span><span className="module-glyph" aria-hidden="true">{module.glyph}</span><span className="module-copy"><strong>{module.name}</strong><small>{module.detail}</small></span><span className="module-arrow"><ArrowIcon /></span></Link></Reveal>)}</div>
      </section>

      <section id="experience" className="preview-section"><div className="wrap preview-grid"><Reveal className="preview-title"><span className="section-kicker">03 / THỬ MỘT CHÚT</span><h2>Đủ trực quan<br />để muốn <em>bắt đầu.</em></h2><p>Khám phá một buổi học mẫu, từ chọn nội dung đến làm một câu luyện tập. Trải nghiệm này dùng dữ liệu minh họa trong lúc các API học tập được kết nối.</p><Link className="button button-light" href="/learn">Xem bản học thử <ArrowIcon /></Link></Reveal><Reveal className="preview-visual"><div className="preview-paper"><span className="paper-top">HÔM NAY BẠN MUỐN HỌC GÌ? <b>✳</b></span><div className="paper-big">A little<br /><i>every day</i><span className="paper-period">.</span></div><div className="paper-bottom"><span>Học → Luyện → Hiểu</span><span>01 — 03</span></div></div><div className="preview-sticker">KEEP<br />GOING ↗</div></Reveal></div></section>
    </main>
    <SiteFooter />
  </div>;
}
