import { toClientAuthSession } from "@/lib/auth/session";
import { requireWorkspaceWorkflowAccess } from "../../workflow-guard";
import FieldPageClient from "../page-client";

export default async function Page() {
  const session = await requireWorkspaceWorkflowAccess("field");

  return (
    <>
      <h1 className="sr-only">Recent field reports</h1>
      <FieldPageClient
        initialSectionId="recent-reports"
        session={toClientAuthSession(session)}
      />
    </>
  );
}
