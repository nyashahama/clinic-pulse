import { requireDemoWorkflowAccess } from "../../workflow-guard";
import ScenarioControlsPageClient from "./page-client";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return <ScenarioControlsPageClient />;
}
