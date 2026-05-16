import { toClientAuthSession } from "@/lib/auth/session";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import FieldPageClient from "../page-client";

export default async function Page() {
  const session = await requireDemoWorkflowAccess("field");

  return <FieldPageClient session={toClientAuthSession(session)} />;
}
