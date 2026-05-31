import { PartnerOperationsBriefing } from "@/components/product/partner-operations-briefing";
import {
  buildPartnerLaunchCockpitModel,
  buildPartnerReadinessModel,
} from "@/lib/workspace/partner-readiness";
import { requireWorkspaceWorkflowAccess } from "../../workflow-guard";
import { loadAdminPartnerReadiness } from "../admin-loaders";
import { formatDateTime } from "../governance-formatters";
import { PartnerReadinessPageClient } from "./page-client";

function getLatestPartnerActivityLabel(
  readiness: Awaited<ReturnType<typeof loadAdminPartnerReadiness>>,
) {
  const latest = [
    ...readiness.apiKeys.flatMap((apiKey) => [
      apiKey.updatedAt,
      apiKey.lastUsedAt,
      apiKey.revokedAt,
      apiKey.createdAt,
    ]),
    ...readiness.webhookSubscriptions.flatMap((subscription) => [
      subscription.updatedAt,
      subscription.lastTestedAt,
      subscription.createdAt,
    ]),
    ...readiness.webhookEvents.flatMap((event) => [
      event.deliveredAt,
      event.createdAt,
    ]),
    ...readiness.exportRuns.map((exportRun) => exportRun.createdAt),
    ...readiness.integrationChecks.map((check) => check.checkedAt),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return latest ? formatDateTime(latest.toISOString()) : "Unavailable";
}

export default async function Page() {
  await requireWorkspaceWorkflowAccess("admin");

  const partnerReadiness = await loadAdminPartnerReadiness();
  const readinessModel = buildPartnerReadinessModel(partnerReadiness);
  const cockpit = buildPartnerLaunchCockpitModel(partnerReadiness);
  const latestActivityLabel = getLatestPartnerActivityLabel(partnerReadiness);
  const statusLabel =
    cockpit.handoffPacket.tone === "clear"
      ? "Partner handoff packet is ready"
      : readinessModel.title;

  return (
    <div className="space-y-4">
      <PartnerOperationsBriefing
        eyebrow="Partner readiness"
        title="Partner Launch Cockpit"
        description="Confirm the credential, endpoint contract, webhook receiver, export checksum, and integration checks before partner handoff."
        statusLabel={statusLabel}
        statusDetail={cockpit.handoffPacket.summary}
        latestActivityLabel={latestActivityLabel}
        cockpit={cockpit}
        metrics={readinessModel.metrics.map((metric) => ({
          id: metric.label,
          label: metric.label,
          value: metric.value,
          detail: metric.detail,
          tone: metric.tone,
        }))}
        actions={[
          {
            label: "Open handoff workspace",
            href: "#partner-readiness-workspace",
          },
          {
            label: "Open delivery console",
            href: "/admin/integrations",
            variant: "secondary",
          },
        ]}
      />

      <section id="partner-readiness-workspace" className="scroll-mt-24">
        <PartnerReadinessPageClient readiness={partnerReadiness} />
      </section>
    </div>
  );
}
