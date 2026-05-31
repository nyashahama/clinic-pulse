import { toClientAuthSession } from "@/lib/auth/session";
import { requireWorkspaceWorkflowAccess } from "../workflow-guard";
import FieldPageClient from "./page-client";

export default async function FieldPage() {
  const session = await requireWorkspaceWorkflowAccess("field");

  return <FieldPageClient session={toClientAuthSession(session)} />;
}
