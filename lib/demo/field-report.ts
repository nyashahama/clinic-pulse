import type { CreateReportApiInput } from "@/lib/demo/api-types";
import type { SubmitFieldReportInput } from "@/lib/demo/types";

export type OnlineFieldReportInput = Pick<
  SubmitFieldReportInput,
  | "reporterName"
  | "status"
  | "reason"
  | "staffPressure"
  | "stockPressure"
  | "queuePressure"
  | "notes"
  | "submittedAt"
>;

export type OnlineFieldReportActionInput = {
  clinicId: string;
  report: OnlineFieldReportInput;
};

export type OnlineFieldReportResult = {
  ok: true;
};

type SubmitOnlineFieldReportAction = (
  input: OnlineFieldReportActionInput,
) => Promise<OnlineFieldReportResult>;

type SubmitOnlineFieldReportOptions = {
  clinicId: string;
  report: OnlineFieldReportInput;
  refresh: () => void;
  submitReport: SubmitOnlineFieldReportAction;
  submitFieldReport: (report: SubmitFieldReportInput) => void;
};

export function mapOnlineFieldReportToCreateReportInput({
  clinicId,
  report,
}: OnlineFieldReportActionInput): CreateReportApiInput {
  const input: CreateReportApiInput = {
    clinicId,
    status: report.status,
    staffPressure: report.staffPressure,
    stockPressure: report.stockPressure,
    queuePressure: report.queuePressure,
    reason: report.reason,
    source: "field_worker",
    offlineCreated: false,
  };

  if (report.reporterName) {
    input.reporterName = report.reporterName;
  }

  if (report.submittedAt) {
    input.submittedAt = report.submittedAt;
  }

  if (report.notes) {
    input.notes = report.notes;
  }

  return input;
}

function createVisibleOnlineReport(
  clinicId: string,
  report: OnlineFieldReportInput,
): SubmitFieldReportInput {
  return {
    clinicId,
    reporterName: report.reporterName,
    source: "field_worker",
    status: report.status,
    reason: report.reason,
    staffPressure: report.staffPressure,
    stockPressure: report.stockPressure,
    queuePressure: report.queuePressure,
    notes: report.notes,
    submittedAt: report.submittedAt,
    offlineCreated: false,
  };
}

export async function submitOnlineFieldReport({
  clinicId,
  report,
  refresh,
  submitReport,
  submitFieldReport,
}: SubmitOnlineFieldReportOptions) {
  await submitReport({
    clinicId,
    report,
  });

  submitFieldReport(createVisibleOnlineReport(clinicId, report));
  refresh();
}
