import { toClientAuthSession } from "@/lib/auth/session";
import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import FieldPageClient from "../page-client";

export default async function Page() {
  const session = await requireDashboardWorkflowAccess("field");

  return (
    <>
      <h1 className="sr-only">Submit field report</h1>
      <FieldPageClient session={toClientAuthSession(session)} />
    </>
  );
}
