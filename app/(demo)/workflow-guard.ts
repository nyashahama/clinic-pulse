import { redirect } from "next/navigation";

import {
  AuthenticationRequiredError,
  InsufficientRoleError,
  getWorkflowInsufficientRoleRedirectPath,
  requireCurrentWorkflowRole,
  type ProtectedWorkflow,
} from "@/lib/auth/session";

export async function requireDemoWorkflowAccess(workflow: ProtectedWorkflow) {
  try {
    return await requireCurrentWorkflowRole(workflow);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect("/login");
    }

    if (error instanceof InsufficientRoleError) {
      redirect(getWorkflowInsufficientRoleRedirectPath(workflow));
    }

    throw error;
  }
}
