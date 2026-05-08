"use client";

import { BookingDemoController } from "@/components/landing/booking-demo-controller";
import { LiveIncidentHero } from "@/components/landing/live-incident-hero";

export function LandingHeroBooking() {
  return (
    <BookingDemoController>
      {({ openBooking }) => <LiveIncidentHero onBookDemo={openBooking} />}
    </BookingDemoController>
  );
}
