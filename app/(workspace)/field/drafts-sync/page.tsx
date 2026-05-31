import { toClientAuthSession } from "@/lib/auth/session";
import { requireWorkspaceWorkflowAccess } from "../../workflow-guard";
import FieldPageClient from "../page-client";

export default async function Page() {
  const session = await requireWorkspaceWorkflowAccess("field");

  return (
    <>
      <h1 className="sr-only">Drafts and sync</h1>
      <FieldPageClient
        initialSectionId="drafts-sync"
        session={toClientAuthSession(session)}
      />
    </>
  );
}
