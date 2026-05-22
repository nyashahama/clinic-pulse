"use client";

import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";

import {
  AdminDetailShell,
} from "@/components/product/admin-detail";
import {
  EvidenceCommandChip,
  EvidenceCommandHeader,
  EvidenceCommandMetricStrip,
  EvidenceDecisionPanel,
  EvidencePacketPanel,
  EvidenceTimeline,
} from "@/components/product/evidence-command";
import { useDemoStore } from "@/lib/demo/demo-store";
import type { AdminReturnTarget } from "@/lib/product/admin-detail-routes";
import {
  buildLeadDecisionCopy,
  formatEvidenceLabel,
  getLeadStatusTone,
  type EvidenceCommandAction,
  type EvidenceCommandChip as EvidenceCommandChipModel,
  type EvidenceCommandField,
  type EvidenceCommandMetric,
  type EvidenceCommandTimelineItem,
} from "@/lib/product/evidence-command";

function getRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LeadDetailPageClient({
  returnTarget,
}: {
  returnTarget: AdminReturnTarget;
}) {
  const params = useParams<{ leadId?: string | string[] }>();
  const { state } = useDemoStore();
  const leadId = getRouteParam(params.leadId);
  const lead = useMemo(
    () => state.leads.find((item) => item.id === leadId) ?? null,
    [leadId, state.leads],
  );

  if (!lead) {
    return (
      <AdminDetailShell
        eyebrow="Operations evidence"
        title="Lead detail"
        description="The requested stakeholder lead could not be matched to the current operations queue."
        returnHref={returnTarget.href}
        returnLabel={returnTarget.label}
      >
        <section
          role="alert"
          data-admin-module
          className="rounded-lg border border-border-subtle bg-bg-default p-4 text-sm text-content-subtle shadow-sm"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="font-medium text-content-emphasis">Lead not found</p>
              <p className="mt-1 max-w-xl">
                Lead id {leadId ? `"${leadId}"` : "was not provided"} is not present in
                the current stakeholder activity queue.
              </p>
            </div>
          </div>
        </section>
      </AdminDetailShell>
    );
  }

  const statusTone = getLeadStatusTone(lead.status);
  const decisionCopy = buildLeadDecisionCopy({
    interest: lead.interest,
    status: lead.status,
  });
  const actions: EvidenceCommandAction[] = [
    {
      label: "Email stakeholder",
      href: `mailto:${lead.workEmail}`,
      priority: "primary",
      icon: "mail",
    },
    {
      label: "Return to queue",
      href: returnTarget.href,
      priority: "secondary",
      icon: "queue",
    },
  ];
  const headerActions = actions.filter((action) => action.priority === "secondary");
  const chips: EvidenceCommandChipModel[] = [
    {
      label: formatEvidenceLabel(lead.status),
      tone: statusTone,
    },
    {
      label: formatEvidenceLabel(lead.interest),
      tone: "info",
    },
    {
      label: lead.organization,
      tone: "neutral",
    },
  ];
  const metrics: EvidenceCommandMetric[] = [
    {
      label: "Follow-up state",
      value: formatEvidenceLabel(lead.status),
      detail: "Current activity queue status",
      tone: statusTone,
      icon: "user",
    },
    {
      label: "Focus",
      value: formatEvidenceLabel(lead.interest),
      detail: "Buying or partner context",
      tone: "info",
      icon: "activity",
    },
    {
      label: "Created",
      value: formatDateTime(lead.createdAt),
      detail: "Inbound request timestamp",
      tone: "neutral",
      icon: "clock",
    },
    {
      label: "Contact",
      value: lead.name,
      detail: lead.role,
      tone: "neutral",
      icon: "mail",
    },
  ];
  const fields: EvidenceCommandField[] = [
    {
      label: "Name",
      value: lead.name,
      emphasis: true,
    },
    {
      label: "Email",
      value: lead.workEmail,
      href: `mailto:${lead.workEmail}`,
    },
    {
      label: "Organisation",
      value: lead.organization,
    },
    {
      label: "Role",
      value: lead.role,
    },
    {
      label: "Focus",
      value: formatEvidenceLabel(lead.interest),
      tone: "info",
    },
    {
      label: "Status",
      value: formatEvidenceLabel(lead.status),
      tone: statusTone,
    },
    {
      label: "Created",
      value: formatDateTime(lead.createdAt),
    },
    {
      label: "Follow-up note",
      value: lead.note,
      emphasis: true,
    },
  ];
  const timeline: EvidenceCommandTimelineItem[] = [
    {
      label: "Captured",
      title: "Stakeholder request recorded",
      description: `${lead.name} entered the operations queue from the booking/demo workflow.`,
      timestamp: formatDateTime(lead.createdAt),
      tone: "info",
    },
    {
      label: "Current status",
      title: `${formatEvidenceLabel(lead.status)} follow-up`,
      description: lead.note,
      tone: statusTone,
    },
    {
      label: "Next",
      title: decisionCopy.title,
      description: decisionCopy.nextStep,
      tone: decisionCopy.tone,
    },
  ];

  return (
    <AdminDetailShell
      eyebrow="Operations evidence"
      title="Lead detail"
      description={lead.note}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <EvidenceCommandHeader
        eyebrow="Operations evidence"
        title="Stakeholder follow-up brief"
        description={lead.note}
        actions={headerActions}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{lead.name}</span>
          <span>{lead.role}</span>
          <span>{lead.organization}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <EvidenceCommandChip chip={chip} key={`${chip.label}-${chip.tone}`} />
          ))}
        </div>
      </EvidenceCommandHeader>
      <EvidenceCommandMetricStrip metrics={metrics} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid min-w-0 gap-4">
          <EvidencePacketPanel
            title="Stakeholder packet"
            description="Follow-up evidence captured from the stakeholder activity queue."
            fields={fields}
          />
        </div>
        <div className="grid min-w-0 gap-4 content-start">
          <EvidenceDecisionPanel
            decision={{
              contextLabel: "Stakeholder handoff",
              title: decisionCopy.title,
              scoreLabel: "State",
              scoreValue: formatEvidenceLabel(lead.status),
              chips,
              nextStep: decisionCopy.nextStep,
              nextStepTone: decisionCopy.tone,
              impactTitle: "Pipeline impact",
              impact: decisionCopy.impact,
              verificationTitle: "Qualification check",
              verification: decisionCopy.verification,
              evidence: {
                label: lead.note,
                detail: `${lead.name} - ${lead.organization}`,
              },
              actions,
            }}
          />
          <EvidenceTimeline
            title="Lead timeline"
            description="The operational context for deciding how this stakeholder should be handled."
            items={timeline}
          />
        </div>
      </div>
    </AdminDetailShell>
  );
}
