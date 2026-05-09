import { ModulePlaceholderPage } from "@/components/demo/module-placeholder-page";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  return (
    <ModulePlaceholderPage
      description="User access review for organisation admins, district managers, reporters, and partner operators."
      eyebrow="Administration"
      nextSteps={[
    "List active users and role memberships.",
    "Surface stale accounts and missing district assignments.",
    "Add invite, suspend, and role-change actions.",
      ]}
      title="Users and roles"
    />
  );
}
