import { AudienceSection } from "./audience-section";
import { CustomCursor } from "./custom-cursor";
import { FaqSection } from "./faq-section";
import { FeaturesSection } from "./features-section";
import { FinalCtaSection } from "./final-cta-section";
import { FooterSection } from "./footer-section";
import { HeroSection } from "./hero-section";
import { HowSection } from "./how-section";
import { IntroSplash } from "./intro-splash";
import { MascotGuide } from "./mascot-guide";
import { MotionRoot } from "./motion-root";
import { NavbarSection } from "./navbar-section";
import { RoadmapSection } from "./roadmap-section";
import { WhySection } from "./why-section";
import "../styles/marketing.css";

export function HomePage() {
  return (
    <MotionRoot>
      <NavbarSection />
      <main>
        <HeroSection />
        <WhySection />
        <AudienceSection />
        <HowSection />
        <FeaturesSection />
        <RoadmapSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <FooterSection />
      <MascotGuide />
      <CustomCursor />
      <IntroSplash />
    </MotionRoot>
  );
}
