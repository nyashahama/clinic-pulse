import { describe, expect, it } from "vitest";

import {
  buildFinderAlternatives,
  estimateDistanceKm,
  filterClinicRows,
  isClinicUnavailable,
  resolveSelectedClinicId,
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

describe("resolveSelectedClinicId", () => {
  it("returns an existing selected id when it is present", () => {
    const sorted = sortClinicRowsByDistance(getRows()).slice(0, 3);
    const selectedId = sorted[1].clinic.id;

    expect(resolveSelectedClinicId(sorted, selectedId)).toBe(selectedId);
  });

  it("falls back to the first sorted clinic id when the selected id is stale", () => {
    const sorted = sortClinicRowsByDistance(getRows()).slice(0, 3);

    expect(resolveSelectedClinicId(sorted, "stale-clinic-id")).toBe(
      sorted[0].clinic.id,
    );
  });

  it("returns null for empty sorted results", () => {
    expect(resolveSelectedClinicId([], "stale-clinic-id")).toBeNull();
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

  it("ranks fresh operational alternatives ahead of weaker matches and breaks rank ties by distance", () => {
    const [sourceFixture, candidateFixture] = getRows();
    const sharedServices = ["Primary care"];
    const source = cloneClinic(sourceFixture, {
      id: "source",
      services: sharedServices,
    });
    const freshOperationalFar = cloneClinic(candidateFixture, {
      id: "fresh-operational-far",
      latitude: -25.78,
      longitude: 28.2,
      status: "operational",
      freshness: "fresh",
      services: sharedServices,
    });
    const freshOperationalNear = cloneClinic(candidateFixture, {
      id: "fresh-operational-near",
      latitude: -25.741,
      longitude: 28.131,
      status: "operational",
      freshness: "fresh",
      services: sharedServices,
    });
    const staleOperationalNear = cloneClinic(candidateFixture, {
      id: "stale-operational-near",
      latitude: -25.742,
      longitude: 28.132,
      status: "operational",
      freshness: "stale",
      services: sharedServices,
    });
    const degradedFreshNear = cloneClinic(candidateFixture, {
      id: "degraded-fresh-near",
      latitude: -25.743,
      longitude: 28.133,
      status: "degraded",
      freshness: "fresh",
      services: sharedServices,
    });

    const alternatives = buildFinderAlternatives(
      [
        source,
        staleOperationalNear,
        freshOperationalFar,
        degradedFreshNear,
        freshOperationalNear,
      ],
      source,
    );

    expect(alternatives.map((entry) => entry.clinic.id)).toEqual([
      "fresh-operational-near",
      "fresh-operational-far",
      "stale-operational-near",
      "degraded-fresh-near",
    ]);
  });
});
