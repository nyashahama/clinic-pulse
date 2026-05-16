import { toClientAuthSession } from "@/lib/auth/session";
import { requireDemoWorkflowAccess } from "../workflow-guard";
import FieldPageClient from "./page-client";

export default async function FieldPage() {
  const session = await requireDemoWorkflowAccess("field");

  return (
    <>
      <h1 className="sr-only">Field reporting</h1>
      <FieldPageClient session={toClientAuthSession(session)} />
    </>
  );
}
