import { redirect } from "next/navigation";

import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("field");
  redirect("/field#submit-report");
}
