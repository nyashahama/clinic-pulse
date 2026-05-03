import { connection } from "next/server";

import { requireDemoWorkflowAccess } from "../workflow-guard";
import DistrictConsolePageClient from "./page-client";

export default async function DistrictConsolePage() {
  await connection();
  await requireDemoWorkflowAccess("demo");

  return <DistrictConsolePageClient />;
}
