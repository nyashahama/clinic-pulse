import type { CreateReportApiInput } from "@/lib/demo/api-types";
import type { SubmitFieldReportInput } from "@/lib/demo/types";
import type { FieldLocationVerification } from "@/lib/demo/field-location-verification";

export type OnlineFieldReportInput = Pick<
  SubmitFieldReportInput,
  | "reporterName"
  | "status"
  | "reason"
  | "staffPressure"
  | "stockPressure"
  | "queuePressure"
  | "notes"
>;

export type OnlineFieldReportActionInput = {
  clinicId: string;
  report: OnlineFieldReportInput;
  visitVerification?: FieldLocationVerification | null;
};

export type OnlineFieldReportResult = {
  ok: true;
  created: boolean;
  reporterName?: string;
};

type SubmitOnlineFieldReportAction = (
  input: OnlineFieldReportActionInput,
) => Promise<OnlineFieldReportResult>;

type SubmitOnlineFieldReportOptions = {
  clinicId: string;
  report: OnlineFieldReportInput;
  refresh: () => void;
  submitReport: SubmitOnlineFieldReportAction;
  visitVerification?: FieldLocationVerification | null;
};

export function mapOnlineFieldReportToCreateReportInput({
  clinicId,
  report,
  visitVerification,
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

  if (report.notes) {
    input.notes = report.notes;
  }

  if (visitVerification) {
    input.visitVerification = visitVerification;
  }

  return input;
}

export async function submitOnlineFieldReport({
  clinicId,
  report,
  refresh,
  submitReport,
  visitVerification,
}: SubmitOnlineFieldReportOptions) {
  const result = await submitReport({
    clinicId,
    report,
    visitVerification,
  });

  refresh();
  return result;
}
