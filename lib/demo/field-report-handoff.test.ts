import { describe, expect, it } from "vitest";

import type { ClinicRow, ReportStreamItem } from "@/lib/demo/types";
import { buildFieldReportHandoffItems } from "./field-report-handoff";

const baseClinic = {
  id: "clinic-a",
  name: "Clinic A",
  facilityCode: "CPA",
  province: "Gauteng",
  district: "Tshwane",
  latitude: -25.74,
  longitude: 28.13,
  services: ["Primary care"],
  operatingHours: "08:00-16:00",
  imageKey: "clinic-front-01",
  image: {
    src: "/demo/clinics/clinic-front-01.jpg",
    alt: "Clinic entrance.",
    caption: "Clinic frontage.",
    credit: "ClinicPulse demo asset",
  },
  clinicId: "clinic-a",
  status: "operational",
  reason: "Routine service available.",
  freshness: "fresh",
  lastReportedAt: "2026-05-01T08:00:00.000Z",
  reporterName: "Seed",
  source: "seed",
  staffPressure: "normal",
  stockPressure: "normal",
  queuePressure: "low",
} satisfies ClinicRow;

const baseReport = {
  id: "report-a",
  clinicId: "clinic-a",
  clinicName: "Clinic A",
  facilityCode: "CPA",
  reporterName: "Seed",
  source: "field_worker",
  offlineCreated: false,
  submittedAt: "2026-05-01T08:00:00.000Z",
  receivedAt: "2026-05-01T08:00:00.000Z",
  status: "operational",
  reason: "Routine service available.",
  staffPressure: "normal",
  stockPressure: "normal",
  queuePressure: "low",
  notes: "Routine service available.",
} satisfies ReportStreamItem;

function clinic(overrides: Partial<ClinicRow>): ClinicRow {
  return { ...baseClinic, ...overrides };
}

function report(overrides: Partial<ReportStreamItem>): ReportStreamItem {
  return { ...baseReport, ...overrides };
}

describe("field report handoff items", () => {
  it("falls back to reporter-visible clinic updates when report events are unavailable", () => {
    const items = buildFieldReportHandoffItems({
      reports: [],
      clinics: [
        clinic({
          id: "clinic-old",
          clinicId: "clinic-old",
          name: "Older Clinic",
          facilityCode: "OLD",
          lastReportedAt: "2026-05-01T06:00:00.000Z",
        }),
        clinic({
          id: "clinic-new",
          clinicId: "clinic-new",
          name: "Newer Clinic",
          facilityCode: "NEW",
          reason: "Fresh field update.",
          reporterName: "Nomsa Dlamini",
          source: "field_worker",
          lastReportedAt: "2026-05-01T08:30:00.000Z",
        }),
      ],
    });

    expect(items.map((item) => item.id)).toEqual([
      "clinic-update-clinic-new",
      "clinic-update-clinic-old",
    ]);
    expect(items[0]).toMatchObject({
      clinicName: "Newer Clinic",
      facilityCode: "NEW",
      reason: "Fresh field update.",
      reporterName: "Nomsa Dlamini",
      source: "field_worker",
      offlineCreated: false,
    });
  });

  it("prefers explicit report events so offline sync context is retained", () => {
    const items = buildFieldReportHandoffItems({
      clinics: [
        clinic({
          id: "clinic-new",
          clinicId: "clinic-new",
          name: "Newer Clinic",
          lastReportedAt: "2026-05-01T08:30:00.000Z",
        }),
      ],
      reports: [
        report({
          id: "report-offline",
          clinicId: "clinic-a",
          clinicName: "Clinic A",
          offlineCreated: true,
          receivedAt: "2026-05-01T07:30:00.000Z",
        }),
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "report-offline",
      clinicName: "Clinic A",
      offlineCreated: true,
    });
  });
});
