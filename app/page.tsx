import type { Metadata } from "next";
import { Suspense } from "react";

import { WalkthroughBookingCTA } from "@/components/landing/walkthrough-booking-cta";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { LandingHeroBooking } from "@/components/landing/landing-hero-booking";
import { OperatingGap } from "@/components/landing/operating-gap";
import { ProductFeatureCards } from "@/components/landing/product-feature-cards";
import { StakeholderProof } from "@/components/landing/stakeholder-proof";
import { TrustInfrastructure } from "@/components/landing/trust-infrastructure";
import { WorkflowTimeline } from "@/components/landing/workflow-timeline";
import { WorkspaceStoreProvider } from "@/lib/workspace/workspace-store";

export const metadata: Metadata = {
  title: "Clinic Pulse | Clinic operations platform",
  description:
    "Clinic Pulse gives district teams live clinic availability, offline field reporting, patient rerouting, and audit-ready operating records.",
};

export default function Home() {
  return (
    <div className="bg-white text-neutral-950 dark:bg-background dark:text-foreground">
      <Nav />
      <main>
        <WorkspaceStoreProvider>
          <Suspense fallback={null}>
            <LandingHeroBooking />
          </Suspense>
        </WorkspaceStoreProvider>
        <StakeholderProof />
        <OperatingGap />
        <WorkflowTimeline />
        <ProductFeatureCards />
        <TrustInfrastructure />
        <WalkthroughBookingCTA />
      </main>
      <Footer />
    </div>
  );
}
