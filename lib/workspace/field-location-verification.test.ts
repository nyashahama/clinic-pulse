import { describe, expect, it } from "vitest";

import {
  buildFieldLocationVerification,
  formatCoordinatePair,
} from "@/lib/workspace/field-location-verification";

describe("buildFieldLocationVerification", () => {
  it("marks a high-accuracy capture at the selected clinic as on site", () => {
    const result = buildFieldLocationVerification({
      accuracyMeters: 4.4,
      clinic: {
        latitude: -25.7096,
        longitude: 28.3676,
        name: "Mamelodi East Community Clinic",
      },
      capturedAt: "2026-05-26T18:15:00.000Z",
      position: {
        latitude: -25.7096,
        longitude: 28.3676,
      },
    });

    expect(result.distanceMeters).toBe(0);
    expect(result.distanceLabel).toBe("0 m");
    expect(result.accuracyLabel).toBe("Good GPS accuracy");
    expect(result.statusLabel).toBe("Location verified");
    expect(result.tone).toBe("clear");
  });

  it("marks a far capture as away from the selected clinic", () => {
    const result = buildFieldLocationVerification({
      accuracyMeters: 120,
      clinic: {
        latitude: -25.7096,
        longitude: 28.3676,
        name: "Mamelodi East Community Clinic",
      },
      capturedAt: "2026-05-26T18:15:00.000Z",
      position: {
        latitude: -25.7401,
        longitude: 28.1872,
      },
    });

    expect(result.distanceMeters).toBeGreaterThan(1000);
    expect(result.statusLabel).toBe("Away from selected clinic");
    expect(result.accuracyLabel).toBe("Poor GPS accuracy");
    expect(result.tone).toBe("blocked");
  });
});

describe("formatCoordinatePair", () => {
  it("formats coordinates in a compact field-readable shape", () => {
    expect(formatCoordinatePair({ latitude: -25.7033123, longitude: 28.3151876 })).toBe(
      "25.70331°S 28.31519°E",
    );
  });
});
