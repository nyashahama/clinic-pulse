import { describe, expect, it } from "vitest";

import {
  buildFinderAlternatives,
  estimateDistanceKm,
  filterClinicRows,
  isClinicUnavailable,
  sortClinicRowsByDistance,
} from "@/lib/demo/finder";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getClinicRows } from "@/lib/demo/selectors";
import type { ClinicRow } from "@/lib/demo/types";

function getRows() {
  return getClinicRows(createInitialDemoState());
}

function cloneClinic(row: ClinicRow, overrides: Partial<ClinicRow> = {}): ClinicRow {
  return {
    ...row,
    services: [...row.services],
    ...overrides,
  };
}

describe("isClinicUnavailable", () => {
  it("is true for non-functional, unknown, stale, and needs-confirmation clinics", () => {
    const [base] = getRows();

    expect(isClinicUnavailable(cloneClinic(base, { status: "non_functional", freshness: "fresh" }))).toBe(true);
    expect(isClinicUnavailable(cloneClinic(base, { status: "unknown", freshness: "fresh" }))).toBe(true);
    expect(isClinicUnavailable(cloneClinic(base, { status: "operational", freshness: "stale" }))).toBe(true);
    expect(isClinicUnavailable(cloneClinic(base, { status: "degraded", freshness: "needs_confirmation" }))).toBe(true);
  });

  it("is false for operational and fresh clinics", () => {
    const [base] = getRows();

    expect(isClinicUnavailable(cloneClinic(base, { status: "operational", freshness: "fresh" }))).toBe(false);
  });
});

describe("filterClinicRows", () => {
  it("filters by query, status, and service", () => {
    const rows = getRows();
    const mamelodi = rows.find((clinic) => clinic.id === "clinic-mamelodi-east");

    expect(mamelodi).toBeDefined();

    const testRows = rows.map((clinic) =>
      clinic.id === "clinic-mamelodi-east"
        ? cloneClinic(clinic, {
            status: "degraded",
            services: [...clinic.services, "ARV pickup"],
          })
        : clinic,
    );

    const result = filterClinicRows(testRows, {
      query: "mamelodi",
      status: "degraded",
      service: "arv",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("clinic-mamelodi-east");
  });
});

describe("sortClinicRowsByDistance", () => {
  it("returns distance-sorted results", () => {
    const sorted = sortClinicRowsByDistance(getRows());

    expect(sorted.map((entry) => entry.distanceKm)).toEqual(
      [...sorted.map((entry) => entry.distanceKm)].sort((left, right) => left - right),
    );
  });
});

describe("estimateDistanceKm", () => {
  it("returns a positive distance", () => {
    const [clinic] = getRows();

    expect(estimateDistanceKm(clinic.latitude, clinic.longitude)).toBeGreaterThan(0);
  });
});

describe("buildFinderAlternatives", () => {
  it("returns compatible ranked alternatives and excludes non-functional clinics", () => {
    const rows = getRows();
    const source = rows.find((clinic) => clinic.id === "clinic-mabopane-station");

    expect(source).toBeDefined();

    const alternatives = buildFinderAlternatives(rows, source!);

    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.every((entry) => entry.clinic.id !== source!.id)).toBe(true);
    expect(alternatives.every((entry) => entry.compatibilityServices.length > 0)).toBe(true);
    expect(alternatives.every((entry) => entry.distanceKm > 0)).toBe(true);
    expect(alternatives.every((entry) => entry.estimatedMinutes >= 5)).toBe(true);
    expect(alternatives.every((entry) => entry.reason.length > 0)).toBe(true);
    expect(alternatives.some((entry) => entry.clinic.status === "non_functional")).toBe(false);
  });
});
