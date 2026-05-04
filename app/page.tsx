import type { Metadata } from "next";
import { Suspense } from "react";

import { DemoBookingCTA } from "@/components/landing/demo-booking-cta";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { LandingHeroBooking } from "@/components/landing/landing-hero-booking";
import { OperatingGap } from "@/components/landing/operating-gap";
import { ProductFeatureCards } from "@/components/landing/product-feature-cards";
import { StakeholderProof } from "@/components/landing/stakeholder-proof";
import { TrustInfrastructure } from "@/components/landing/trust-infrastructure";
import { WorkflowTimeline } from "@/components/landing/workflow-timeline";
import { DemoStoreProvider } from "@/lib/demo/demo-store";

export const metadata: Metadata = {
  title: "Clinic Pulse | Clinic operations platform",
  description:
    "Clinic Pulse gives district teams live clinic availability, offline field reporting, patient rerouting, and audit-ready operating records.",
};

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <DemoStoreProvider>
          <Suspense fallback={null}>
            <LandingHeroBooking />
          </Suspense>
        </DemoStoreProvider>
        <StakeholderProof />
        <OperatingGap />
        <WorkflowTimeline />
        <ProductFeatureCards />
        <TrustInfrastructure />
        <DemoBookingCTA />
      </main>
      <Footer />
    </>
  );
}
