import type { Metadata } from "next";

import { Background } from "@/components/ui/background";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { DemoBookingCTA } from "@/components/landing/demo-booking-cta";
import { ProblemContrast } from "@/components/landing/problem-contrast";
import { ProductFlow } from "@/components/landing/product-flow";
import { ProofStrip } from "@/components/landing/proof-strip";
import { RoutingMoment } from "@/components/landing/routing-moment";
import { ScenarioHero } from "@/components/landing/scenario-hero";
import { TrustInfrastructure } from "@/components/landing/trust-infrastructure";
import { DemoStoreProvider } from "@/lib/demo/demo-store";

export const metadata: Metadata = {
  title: "ClinicPulse | Live clinic availability for district teams",
  description:
    "ClinicPulse shows which clinics can serve patients right now, verifies report freshness, and reroutes patients before wasted trips happen.",
};

export default function Home() {
  return (
    <>
      <Background />
      <Nav />
      <main>
        <DemoStoreProvider>
          <ScenarioHero />
        </DemoStoreProvider>
        <ProofStrip />
        <ProblemContrast />
        <ProductFlow />
        <RoutingMoment />
        <TrustInfrastructure />
        <DemoBookingCTA />
      </main>
      <Footer />
    </>
  );
}
