import type { Metadata } from "next";

import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { LandingHeroBooking } from "@/components/landing/landing-hero-booking";
import { Manifesto } from "@/components/landing/manifesto";
import { Nav } from "@/components/landing/nav";
import { OperatingGap } from "@/components/landing/operating-gap";
import { PaperNoise } from "@/components/landing/sections/paper-noise";
import { ProductSurfaces } from "@/components/landing/product-surfaces";
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
        <Manifesto />
        <OperatingGap />
        <ProductSurfaces />
        <TrustInfrastructure />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
