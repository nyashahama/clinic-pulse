import type { Metadata } from "next";

import { BookingDemoController } from "@/components/landing/booking-demo-controller";
import { DistrictSignalRail } from "@/components/landing/district-signal-rail";
import { EvidenceLedger } from "@/components/landing/evidence-ledger";
import { Footer } from "@/components/landing/footer";
import { IncidentNarrative } from "@/components/landing/incident-narrative";
import { Nav } from "@/components/landing/nav";
import { OperationalHero } from "@/components/landing/operational-hero";
import { ProductExplorer } from "@/components/landing/product-explorer";
import { WalkthroughCta } from "@/components/landing/walkthrough-cta";

export const metadata: Metadata = {
  title: "Clinic Pulse | Clinic operations platform",
  description:
    "Clinic Pulse connects clinic availability, offline field reporting, patient rerouting, and audit-ready operating records for district teams.",
  openGraph: {
    title: "Clinic Pulse | Clinic operations platform",
    description:
      "Explore a seeded clinic disruption from field report to district response, patient routing, and an audit-ready operating record.",
    type: "website",
  },
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
          <WalkthroughCta />
        </main>
        <Footer />
      </div>
    </BookingDemoController>
  );
}
