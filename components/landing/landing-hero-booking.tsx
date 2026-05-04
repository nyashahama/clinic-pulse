"use client";

import { BookingDemoController } from "@/components/landing/booking-demo-controller";
import { OpenPanelProductHero } from "@/components/landing/openpanel-product-hero";

export function LandingHeroBooking() {
  return (
    <BookingDemoController>
      {({ openBooking }) => <OpenPanelProductHero onBookDemo={openBooking} />}
    </BookingDemoController>
  );
}
