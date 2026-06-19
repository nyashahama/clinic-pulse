import type { Metadata } from "next";

import { FAQSection } from "@/components/landing/faq-section";
import { FinalCTA } from "@/components/landing/final-cta";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { LandingHeroBooking } from "@/components/landing/landing-hero-booking";
import { LogoCarousel } from "@/components/landing/logo-carousel";
import { Manifesto } from "@/components/landing/manifesto";
import { Nav } from "@/components/landing/nav";
import { OperatingGap } from "@/components/landing/operating-gap";
import { PaperNoise } from "@/components/landing/sections/paper-noise";
import { ProblemContrast } from "@/components/landing/problem-contrast";
import { ProductSurfaces } from "@/components/landing/product-surfaces";
import { ScaleSection } from "@/components/landing/scale-section";
import { SocialProofSection } from "@/components/landing/social-proof";
import { TrustInfrastructure } from "@/components/landing/trust-infrastructure";

export const metadata: Metadata = {
  title: "ClinicPulse — Audit-first clinic operations",
  description:
    "ClinicPulse gives district teams live clinic availability, offline field reporting, patient rerouting, and audit-ready operating records.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-clinics-paper text-clinics-ink">
      <PaperNoise />
      <Nav />
      <main>
        <LandingHeroBooking />
        <LogoCarousel />
        <Manifesto />
        <OperatingGap />
        <ScaleSection />
        <ProductSurfaces />
        <FeaturesSection />
        <ProblemContrast />
        <TrustInfrastructure />
        <SocialProofSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
