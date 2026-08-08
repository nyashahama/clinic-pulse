import type { Metadata } from "next";

import { BookingDemoController } from "@/components/landing/booking-demo-controller";
import { DemoBookingCTA } from "@/components/landing/demo-booking-cta";
import { DistrictSignalRail } from "@/components/landing/district-signal-rail";
import { Footer } from "@/components/landing/footer";
import { IncidentNarrative } from "@/components/landing/incident-narrative";
import { Nav } from "@/components/landing/nav";
import { OperationalHero } from "@/components/landing/operational-hero";
import { ProductFeatureCards } from "@/components/landing/product-feature-cards";
import { StakeholderProof } from "@/components/landing/stakeholder-proof";
import { TrustInfrastructure } from "@/components/landing/trust-infrastructure";

export const metadata: Metadata = {
  title: "Clinic Pulse | Clinic operations platform",
  description:
    "Clinic Pulse connects clinic availability, offline field reporting, patient rerouting, and audit-ready operating records for district teams.",
};

export default function Home() {
  return (
    <BookingDemoController>
      <div className="min-h-screen bg-landing-paper text-landing-ink">
        <Nav />
        <main>
          <OperationalHero />
          <DistrictSignalRail />
          <IncidentNarrative />
          <StakeholderProof />
          <ProductFeatureCards />
          <TrustInfrastructure />
          <DemoBookingCTA />
        </main>
        <Footer />
      </div>
    </BookingDemoController>
  );
}
