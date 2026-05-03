"use server";

import type {
  OnlineFieldReportActionInput,
  OnlineFieldReportResult,
} from "@/lib/demo/field-report";

export async function createFieldReport(
  _input: OnlineFieldReportActionInput,
): Promise<OnlineFieldReportResult> {
  void _input;
  // Demo-safe until authenticated field report submission is wired in Task 9/10.
  return { ok: true };
}
