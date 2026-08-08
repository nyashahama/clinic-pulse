import type { Metadata } from "next";

import { BookingDemoController } from "@/components/landing/booking-demo-controller";
import { DemoBookingCTA } from "@/components/landing/demo-booking-cta";
import { DistrictSignalRail } from "@/components/landing/district-signal-rail";
import { EvidenceLedger } from "@/components/landing/evidence-ledger";
import { Footer } from "@/components/landing/footer";
import { IncidentNarrative } from "@/components/landing/incident-narrative";
import { Nav } from "@/components/landing/nav";
import { OperationalHero } from "@/components/landing/operational-hero";
import { ProductExplorer } from "@/components/landing/product-explorer";
import { StakeholderProof } from "@/components/landing/stakeholder-proof";

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
          <EvidenceLedger />
          <ProductExplorer />
          <StakeholderProof />
          <DemoBookingCTA />
        </main>
        <Footer />
      </div>
    </BookingDemoController>
  );
}
