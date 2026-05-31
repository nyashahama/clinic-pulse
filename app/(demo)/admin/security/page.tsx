import {
  EvidenceCaseBriefPanel,
  EvidenceCommandChip,
  EvidenceCommandHeader,
  EvidenceCommandMetricStrip,
  EvidenceDecisionPanel,
  EvidenceTimeline,
} from "@/components/product/evidence-command";
import { SecurityEvidenceWorkspace } from "@/components/product/security-evidence-workspace";
import { buildSecurityEvidenceViewModel } from "@/lib/demo/admin-security-evidence";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";

export default async function Page() {
  await requireDemoWorkflowAccess("admin");

  const governanceData = await loadAdminGovernanceData();
  const { auditEvents, partnerReadiness, users } = governanceData;
  const securityEvidence = buildSecurityEvidenceViewModel({
    apiKeys: partnerReadiness.apiKeys,
    webhookSubscriptions: partnerReadiness.webhookSubscriptions,
    webhookEvents: partnerReadiness.webhookEvents,
    users,
    auditEvents,
  });
  const headerActions = securityEvidence.commandBrief.decision.actions.filter(
    (action) => action.priority === "secondary",
  );

  return (
    <div className="space-y-4" data-admin-module="security">
      <EvidenceCommandHeader
        actions={headerActions}
        eyebrow="Platform evidence"
        title="Security posture cockpit"
        description="Inspect credential lifecycle, webhook receiver integrity, privileged access, and access-related audit activity from one evidence surface."
      >
        <div className="flex flex-wrap gap-1.5">
          {securityEvidence.commandBrief.chips.map((chip) => (
            <EvidenceCommandChip chip={chip} key={`${chip.label}-${chip.tone ?? "neutral"}`} />
          ))}
        </div>
      </EvidenceCommandHeader>

      <EvidenceCommandMetricStrip
        ariaLabel="Security posture command metrics"
        metrics={securityEvidence.commandBrief.metrics}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <EvidenceCaseBriefPanel
          description={securityEvidence.commandBrief.caseBrief.description}
          primaryFields={securityEvidence.commandBrief.caseBrief.primaryFields}
          sections={securityEvidence.commandBrief.caseBrief.sections}
          summary={securityEvidence.commandBrief.caseBrief.summary}
          title={securityEvidence.commandBrief.caseBrief.title}
        />
        <div className="grid min-w-0 content-start gap-4">
          <EvidenceDecisionPanel decision={securityEvidence.commandBrief.decision} />
          <EvidenceTimeline
            description={securityEvidence.commandBrief.timeline.description}
            items={securityEvidence.commandBrief.timeline.items}
            title={securityEvidence.commandBrief.timeline.title}
          />
        </div>
      </div>

      <section id="security-evidence-workspace" className="scroll-mt-24">
        <SecurityEvidenceWorkspace
          metrics={securityEvidence.metrics}
          posture={securityEvidence.posture}
          rows={securityEvidence.rows}
        />
      </section>
    </div>
  );
}
