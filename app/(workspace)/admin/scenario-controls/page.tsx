import { requireDashboardWorkflowAccess } from "../../workflow-guard";
import ScenarioControlsPageClient from "./page-client";

export default async function Page() {
  await requireDashboardWorkflowAccess("admin");

  return <ScenarioControlsPageClient />;
}
