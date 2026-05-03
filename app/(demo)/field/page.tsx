import { requireDemoWorkflowAccess } from "../workflow-guard";
import FieldPageClient from "./page-client";

export default async function FieldPage() {
  await requireDemoWorkflowAccess("field");

  return <FieldPageClient />;
}
