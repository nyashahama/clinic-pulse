import { connection } from "next/server";

import { requireDemoWorkflowAccess } from "../workflow-guard";
import AdminPageClient from "./page-client";

export default async function AdminPage() {
  await connection();
  await requireDemoWorkflowAccess("admin");

  return <AdminPageClient />;
}
