import type {
  ClinicStatus,
  QueuePressure,
  StaffPressure,
  StockPressure,
} from "@/lib/demo/types";

export type FieldReportDraftInput = {
  status: ClinicStatus;
  staffPressure: StaffPressure;
  stockPressure: StockPressure;
  queuePressure: QueuePressure;
  notes: string;
};

export type FieldReportDraft = {
  schemaVersion: 1;
  clinicId: string;
  input: FieldReportDraftInput;
  updatedAt: string;
};

type FieldReportDraftStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const FIELD_REPORT_DRAFT_SCHEMA_VERSION = 1;
const FIELD_REPORT_DRAFT_KEY_PREFIX = "clinicpulse:field-report-draft";
const CLINIC_STATUSES = ["operational", "degraded", "non_functional", "unknown"];
const STAFF_PRESSURES = ["normal", "strained", "critical", "unknown"];
const STOCK_PRESSURES = ["normal", "low", "stockout", "unknown"];
const QUEUE_PRESSURES = ["low", "moderate", "high", "unknown"];

let testStorage: FieldReportDraftStorage | null = null;

export function __setFieldReportDraftStorageForTests(
  storage: FieldReportDraftStorage | null,
) {
  testStorage = storage;
}

function getStorage() {
  if (testStorage) {
    return testStorage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function isOneOf(value: unknown, allowedValues: string[]) {
  return typeof value === "string" && allowedValues.includes(value);
}

function isFieldReportDraft(value: unknown): value is FieldReportDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const input = record.input as Record<string, unknown> | undefined;

  return (
    record.schemaVersion === FIELD_REPORT_DRAFT_SCHEMA_VERSION &&
    typeof record.clinicId === "string" &&
    record.clinicId.trim().length > 0 &&
    typeof record.updatedAt === "string" &&
    !Number.isNaN(Date.parse(record.updatedAt)) &&
    Boolean(input) &&
    isOneOf(input?.status, CLINIC_STATUSES) &&
    isOneOf(input?.staffPressure, STAFF_PRESSURES) &&
    isOneOf(input?.stockPressure, STOCK_PRESSURES) &&
    isOneOf(input?.queuePressure, QUEUE_PRESSURES) &&
    typeof input?.notes === "string"
  );
}

export function getFieldReportDraftKey(clinicId: string) {
  return `${FIELD_REPORT_DRAFT_KEY_PREFIX}:${clinicId}`;
}

export function getFieldReportDraft(clinicId: string): FieldReportDraft | null {
  const storage = getStorage();

  if (!storage || !clinicId) {
    return null;
  }

  const value = storage.getItem(getFieldReportDraftKey(clinicId));
  if (!value) {
    return null;
  }

  try {
    const draft = JSON.parse(value);
    return isFieldReportDraft(draft) && draft.clinicId === clinicId ? draft : null;
  } catch {
    return null;
  }
}

export function saveFieldReportDraft(
  clinicId: string,
  input: FieldReportDraftInput,
  now = new Date(),
) {
  const storage = getStorage();
  const draft = {
    schemaVersion: FIELD_REPORT_DRAFT_SCHEMA_VERSION,
    clinicId,
    input,
    updatedAt: now.toISOString(),
  } satisfies FieldReportDraft;

  if (!storage || !clinicId) {
    return draft;
  }

  storage.setItem(getFieldReportDraftKey(clinicId), JSON.stringify(draft));
  return draft;
}

export function clearFieldReportDraft(clinicId: string) {
  const storage = getStorage();

  if (!storage || !clinicId) {
    return;
  }

  storage.removeItem(getFieldReportDraftKey(clinicId));
}
