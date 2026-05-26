import { afterEach, describe, expect, it } from "vitest";

import type { FieldReportDraftInput } from "./field-report-draft";
import {
  __setFieldReportDraftStorageForTests,
  clearFieldReportDraft,
  getFieldReportDraft,
  getFieldReportDraftKey,
  saveFieldReportDraft,
} from "./field-report-draft";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

const draftInput = {
  notes: "Queue spilling into the waiting area.",
  queuePressure: "high",
  staffPressure: "strained",
  status: "degraded",
  stockPressure: "low",
} satisfies FieldReportDraftInput;

describe("field report drafts", () => {
  afterEach(() => {
    __setFieldReportDraftStorageForTests(null);
  });

  it("stores and restores the latest clinic draft on this browser", () => {
    __setFieldReportDraftStorageForTests(createStorage());

    const saved = saveFieldReportDraft("clinic-a", draftInput, new Date("2026-05-01T08:00:00.000Z"));

    expect(saved).toMatchObject({
      clinicId: "clinic-a",
      input: draftInput,
      schemaVersion: 1,
      updatedAt: "2026-05-01T08:00:00.000Z",
    });
    expect(getFieldReportDraft("clinic-a")).toEqual(saved);
  });

  it("keeps drafts scoped by clinic", () => {
    __setFieldReportDraftStorageForTests(createStorage());

    saveFieldReportDraft("clinic-a", draftInput, new Date("2026-05-01T08:00:00.000Z"));
    saveFieldReportDraft(
      "clinic-b",
      { ...draftInput, notes: "Different stop." },
      new Date("2026-05-01T08:05:00.000Z"),
    );

    expect(getFieldReportDraft("clinic-a")?.input.notes).toBe(
      "Queue spilling into the waiting area.",
    );
    expect(getFieldReportDraft("clinic-b")?.input.notes).toBe("Different stop.");
    expect(getFieldReportDraftKey("clinic-a")).not.toBe(getFieldReportDraftKey("clinic-b"));
  });

  it("clears a draft after it is submitted or saved to the offline queue", () => {
    const storage = createStorage();
    __setFieldReportDraftStorageForTests(storage);
    saveFieldReportDraft("clinic-a", draftInput, new Date("2026-05-01T08:00:00.000Z"));

    clearFieldReportDraft("clinic-a");

    expect(getFieldReportDraft("clinic-a")).toBeNull();
  });

  it("ignores corrupted draft payloads", () => {
    const storage = createStorage();
    __setFieldReportDraftStorageForTests(storage);
    storage.setItem(getFieldReportDraftKey("clinic-a"), "{not-json");

    expect(getFieldReportDraft("clinic-a")).toBeNull();
  });
});
