"use server";

import { createReport } from "@/lib/demo/api-client";
import {
  mapOnlineFieldReportToCreateReportInput,
  type OnlineFieldReportActionInput,
  type OnlineFieldReportResult,
} from "@/lib/demo/field-report";

export async function createFieldReport(
  input: OnlineFieldReportActionInput,
): Promise<OnlineFieldReportResult> {
  await createReport(mapOnlineFieldReportToCreateReportInput(input));

  return { ok: true };
}
