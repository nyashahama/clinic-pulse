"use client";

import { BookingWalkthroughController } from "@/components/landing/booking-walkthrough-controller";
import { LiveIncidentHero } from "@/components/landing/live-incident-hero";

export function LandingHeroBooking() {
  return (
    <BookingWalkthroughController>
      {({ openBooking }) => <LiveIncidentHero onBookWalkthrough={openBooking} />}
    </BookingWalkthroughController>
  );
}
