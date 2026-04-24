import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { DemoCard } from "@/components/landing/demo-card";
import { LogoCarousel } from "@/components/landing/logo-carousel";
import { ProblemSection } from "@/components/landing/problem-section";
import { InterfaceShowcase } from "@/components/landing/interface-showcase";
import { FeaturesSection } from "@/components/landing/features-section";
import { SocialProofSection } from "@/components/landing/social-proof";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <DemoCard />
        <LogoCarousel />
        <ProblemSection />
        <InterfaceShowcase />
        <FeaturesSection />
        <SocialProofSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}