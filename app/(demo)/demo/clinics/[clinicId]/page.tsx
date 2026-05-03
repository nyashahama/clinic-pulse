import { connection } from "next/server";

import { requireDemoWorkflowAccess } from "../../../workflow-guard";
import ClinicDetailPageClient from "./page-client";

export default async function ClinicDetailPage() {
  await connection();
  await requireDemoWorkflowAccess("demo");

  return <ClinicDetailPageClient />;
}
