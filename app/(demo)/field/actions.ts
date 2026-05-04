"use server";

import type {
  OnlineFieldReportActionInput,
  OnlineFieldReportResult,
} from "@/lib/demo/field-report";
import type { OfflineSyncApiResponse } from "@/lib/demo/api-types";
import type { OfflineReportQueueItem } from "@/lib/demo/types";
import {
  AuthenticationRequiredError,
  getCurrentSession,
  getSessionCookieHeader,
  requireWorkflowRole,
} from "@/lib/auth/session";
import { createReport, syncOfflineReportsApi } from "@/lib/demo/api-client";
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

export async function syncQueuedFieldReports(
  items: OfflineReportQueueItem[],
): Promise<OfflineSyncApiResponse> {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    throw new AuthenticationRequiredError();
  }

  requireWorkflowRole(await getCurrentSession({ cookieHeader }), "field");

  return syncOfflineReportsApi(
    {
      items: items.map((item) => ({
        clientReportId: item.clientReportId,
        clinicId: item.clinicId,
        status: item.status,
        reason: item.reason,
        staffPressure: item.staffPressure,
        stockPressure: item.stockPressure,
        queuePressure: item.queuePressure,
        notes: item.notes,
        submittedAt: item.submittedAt,
        queuedAt: item.queuedAt,
        attemptCount: item.attemptCount,
      })),
    },
    {
      init: {
        headers: {
          cookie: cookieHeader,
        },
      },
    },
  );
}
