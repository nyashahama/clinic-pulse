import { describe, expect, it } from "vitest";

import {
  auditSealEvents,
  heroMapPulses,
  heroSignalPackets,
  operationsTickerEvents,
} from "@/lib/landing/landing-motion-content";

function expectUniqueIds(items: Array<{ id: string }>) {
  expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
}

describe("landing motion content", () => {
  it("defines non-empty motion datasets with unique ids", () => {
    expect(heroSignalPackets.length).toBeGreaterThanOrEqual(6);
    expect(heroMapPulses.length).toBeGreaterThanOrEqual(4);
    expect(operationsTickerEvents.length).toBeGreaterThanOrEqual(8);
    expect(auditSealEvents.length).toBeGreaterThanOrEqual(5);

    expectUniqueIds(heroSignalPackets);
    expectUniqueIds(heroMapPulses);
    expectUniqueIds(operationsTickerEvents);
    expectUniqueIds(auditSealEvents);
  });

  it("keeps every motion event tied to clinic operations", () => {
    for (const event of operationsTickerEvents) {
      expect(event.label.length).toBeGreaterThan(2);
      expect(["report", "status", "route", "audit", "sync"]).toContain(event.stage);
      expect(["critical", "warning", "healthy", "neutral"]).toContain(event.tone);
    }
  });

  it("defines map pulse coordinates inside percentage bounds", () => {
    for (const pulse of heroMapPulses) {
      expect(pulse.x).toBeGreaterThanOrEqual(0);
      expect(pulse.x).toBeLessThanOrEqual(100);
      expect(pulse.y).toBeGreaterThanOrEqual(0);
      expect(pulse.y).toBeLessThanOrEqual(100);
    }
  });
});
