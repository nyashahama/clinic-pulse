import { describe, expect, it, vi } from "vitest";

import {
  mapOnlineFieldReportToCreateReportInput,
  submitOnlineFieldReport,
} from "@/lib/demo/field-report";
import type { SubmitFieldReportInput } from "@/lib/demo/types";

const report: SubmitFieldReportInput = {
  clinicId: "form-clinic-id",
  reporterName: "Field worker",
  source: "field_worker",
  status: "degraded",
  reason: "Mamelodi East status update from field worker report.",
  staffPressure: "strained",
  stockPressure: "low",
  queuePressure: "high",
  notes: "Pharmacy queue is backing up.",
  submittedAt: "2026-05-03T08:30:00.000Z",
  offlineCreated: true,
};

describe("field report submission", () => {
  it("forces online field reports to use the field worker source", () => {
    expect(
      mapOnlineFieldReportToCreateReportInput({
        clinicId: "clinic-mamelodi-east",
        report: {
          ...report,
          source: "seed",
        } as SubmitFieldReportInput,
      }),
    ).toMatchObject({
      source: "field_worker",
    });
  });

  it("forces online field reports to be durable backend submissions", () => {
    expect(
      mapOnlineFieldReportToCreateReportInput({
        clinicId: "clinic-mamelodi-east",
        report: {
          ...report,
          offlineCreated: true,
        },
      }),
    ).toMatchObject({
      offlineCreated: false,
    });
  });

  it("forwards only fields owned by the field report flow", () => {
    const input = mapOnlineFieldReportToCreateReportInput({
      clinicId: "clinic-mamelodi-east",
      report: {
        ...report,
        confidence: 0.01,
        externalId: "caller-controlled-id",
      } as SubmitFieldReportInput & {
        confidence: number;
        externalId: string;
      },
    });

    expect(input).not.toHaveProperty("confidence");
    expect(input).not.toHaveProperty("externalId");
  });

  it("omits optional fields when the field form did not provide them", () => {
    const input = mapOnlineFieldReportToCreateReportInput({
      clinicId: "clinic-mamelodi-east",
      report: {
        reporterName: "",
        status: "operational",
        reason: "Routine field check.",
        staffPressure: "normal",
        stockPressure: "normal",
        queuePressure: "low",
        notes: "",
      },
    });

    expect(input).not.toHaveProperty("reporterName");
    expect(input).not.toHaveProperty("submittedAt");
    expect(input).not.toHaveProperty("notes");
  });

  it("submits online field reports before updating visible state and refreshing", async () => {
    const submitReport = vi.fn().mockResolvedValue({ ok: true });
    const submitFieldReport = vi.fn();
    const refresh = vi.fn();

    await submitOnlineFieldReport({
      clinicId: "clinic-mamelodi-east",
      refresh,
      report,
      submitReport,
      submitFieldReport,
    });

    const durableReport = {
      ...report,
      clinicId: "clinic-mamelodi-east",
      offlineCreated: false,
    };
    expect(submitReport).toHaveBeenCalledWith({
      clinicId: "clinic-mamelodi-east",
      report,
    });
    expect(submitFieldReport).toHaveBeenCalledWith(durableReport);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(submitReport.mock.invocationCallOrder[0]).toBeLessThan(
      submitFieldReport.mock.invocationCallOrder[0],
    );
    expect(submitFieldReport.mock.invocationCallOrder[0]).toBeLessThan(
      refresh.mock.invocationCallOrder[0],
    );
  });

  it("does not update local visible state when the online submission rejects", async () => {
    const submitReport = vi.fn().mockRejectedValue(new Error("API unavailable"));
    const submitFieldReport = vi.fn();
    const refresh = vi.fn();

    await expect(
      submitOnlineFieldReport({
        clinicId: "clinic-mamelodi-east",
        refresh,
        report,
        submitReport,
        submitFieldReport,
      }),
    ).rejects.toThrow("API unavailable");

    expect(submitFieldReport).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
