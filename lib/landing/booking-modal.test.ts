import { describe, expect, it } from "vitest";

import { shouldOpenBookingModal } from "@/lib/landing/booking-modal";

describe("shouldOpenBookingModal", () => {
  it("opens for the booking hash", () => {
    expect(shouldOpenBookingModal("http://localhost:3000/#booking")).toBe(true);
  });

  it("opens for the booking query fallback", () => {
    expect(shouldOpenBookingModal("http://localhost:3000/?booking=1")).toBe(true);
  });

  it("stays closed for normal landing visits", () => {
    expect(shouldOpenBookingModal("http://localhost:3000/")).toBe(false);
  });
});
