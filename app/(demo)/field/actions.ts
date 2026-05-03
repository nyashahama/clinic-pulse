"use server";

import type {
  OnlineFieldReportActionInput,
  OnlineFieldReportResult,
} from "@/lib/demo/field-report";
import {
  AuthenticationRequiredError,
  getCurrentSession,
  getSessionCookieHeader,
  requireWorkflowRole,
} from "@/lib/auth/session";
import { createReport } from "@/lib/demo/api-client";
import { mapOnlineFieldReportToCreateReportInput } from "@/lib/demo/field-report";

export async function createFieldReport(
  input: OnlineFieldReportActionInput,
): Promise<OnlineFieldReportResult> {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    throw new AuthenticationRequiredError();
  }

  const session = requireWorkflowRole(await getCurrentSession({ cookieHeader }), "field");
  const reporterName = session.user.displayName || session.user.email;
  const reportInput = mapOnlineFieldReportToCreateReportInput(input);
  reportInput.reporterName = reporterName;

  await createReport(reportInput, {
    init: {
      headers: {
        cookie: cookieHeader,
      },
    },
  });

  return { ok: true, reporterName };
}
