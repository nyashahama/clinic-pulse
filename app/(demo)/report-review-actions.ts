"use server";

import { revalidatePath } from "next/cache";

import {
  AuthenticationRequiredError,
  getCurrentSession,
  getSessionCookieHeader,
  requireRole,
} from "@/lib/auth/session";
import { reviewReport } from "@/lib/demo/api-client";
import type { ReviewReportApiInput } from "@/lib/demo/api-types";

const REVIEW_ROLES = ["district_manager", "org_admin", "system_admin"] as const;

export type ReviewPendingReportActionInput = {
  reportId: number;
  decision: ReviewReportApiInput["decision"];
  notes?: string;
};

export async function reviewPendingReportAction(input: ReviewPendingReportActionInput) {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    throw new AuthenticationRequiredError();
  }

  requireRole(await getCurrentSession({ cookieHeader }), REVIEW_ROLES);

  const result = await reviewReport(
    input.reportId,
    {
      decision: input.decision,
      notes: input.notes,
    },
    {
      init: {
        headers: {
          cookie: cookieHeader,
        },
      },
    },
  );

  revalidatePath("/district");
  revalidatePath("/admin");
  revalidatePath(`/district/clinics/${encodeURIComponent(result.report.clinicId)}`);
  revalidatePath("/finder");

  return result;
}
