import type { ClientAuthSession } from "@/lib/auth/api";
import { requireDemoWorkflowAccess } from "../workflow-guard";
import FieldPageClient from "./page-client";

export default async function FieldPage() {
  const workflowSession = await requireDemoWorkflowAccess("field");
  const session = {
    userId: workflowSession.user.id,
    name: workflowSession.user.displayName,
    displayName: workflowSession.user.displayName,
    email: workflowSession.user.email,
    role: workflowSession.role,
    ...(workflowSession.activeMembership.organisation?.name
      ? { organisationName: workflowSession.activeMembership.organisation.name }
      : {}),
    ...(workflowSession.activeMembership.district
      ? { district: workflowSession.activeMembership.district }
      : {}),
    ...(workflowSession.activeMembership.organisationId === undefined
      ? {}
      : { organisationId: workflowSession.activeMembership.organisationId }),
  } satisfies ClientAuthSession;

  return <FieldPageClient session={session} />;
}
