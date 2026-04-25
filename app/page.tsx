import { Background } from "@/components/ui/background";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { Manifesto } from "@/components/landing/manifesto";
import { ProductModules } from "@/components/landing/product-modules";
import { InterfaceShowcase } from "@/components/landing/interface-showcase";
import { FeaturesSection } from "@/components/landing/features-section";
import { SocialProofSection } from "@/components/landing/social-proof";
import { ScaleSection } from "@/components/landing/scale-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Background />
      <Nav />
      <main>
        <Hero />
        <TrustStrip />
        <Manifesto />
        <ProductModules />
        <InterfaceShowcase />
        <FeaturesSection />
        <SocialProofSection />
        <ScaleSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
