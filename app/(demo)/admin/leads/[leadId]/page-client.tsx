"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Mail } from "lucide-react";
import { useMemo } from "react";

import {
  AdminDetailActionPanel,
  AdminDetailEvidenceList,
  AdminDetailHero,
  AdminDetailShell,
  AdminDetailSignalBar,
  AdminDetailTimeline,
} from "@/components/product/admin-detail";
import { buttonVariants } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import type { DemoLead } from "@/lib/demo/types";
import type { AdminReturnTarget } from "@/lib/product/admin-detail-routes";

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

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function leadStatusTone(status: DemoLead["status"]) {
  if (status === "completed") {
    return "clear" as const;
  }

  if (status === "new") {
    return "attention" as const;
  }

  return "info" as const;
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

  return (
    <AdminDetailShell
      eyebrow="Operations evidence"
      title="Lead detail"
      description={lead.note}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <AdminDetailHero
        eyebrow="Operations evidence"
        title="Lead detail"
        description={lead.note}
        status={
          <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs font-medium capitalize text-content-default">
            {formatLabel(lead.status)}
          </span>
        }
        actions={
          <>
            <Link
              className={buttonVariants({ size: "sm" })}
              href={`mailto:${lead.workEmail}`}
            >
              <Mail className="size-3.5" />
              Contact lead
            </Link>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={returnTarget.href}
            >
              Return to queue
            </Link>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{lead.name}</span>
          <span>{lead.role}</span>
          <span>{lead.organization}</span>
        </div>
      </AdminDetailHero>
      <AdminDetailSignalBar
        signals={[
          {
            label: "Status",
            value: formatLabel(lead.status),
            detail: "Follow-up state",
            tone: leadStatusTone(lead.status),
          },
          {
            label: "Focus",
            value: formatLabel(lead.interest),
            detail: "Buying context",
            tone: "info",
          },
          {
            label: "Created",
            value: formatDateTime(lead.createdAt),
            detail: "Inbound request timestamp",
            tone: "neutral",
          },
          {
            label: "Organisation",
            value: lead.organization,
            detail: lead.role,
            tone: "neutral",
          },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="grid min-w-0 gap-4">
          <AdminDetailEvidenceList
            title="Stakeholder properties"
            description="Follow-up details captured from the stakeholder activity queue."
            items={[
              {
                label: "Name",
                value: lead.name,
              },
              {
                label: "Email",
                value: (
                  <Link
                    className="break-all underline-offset-4 hover:underline"
                    href={`mailto:${lead.workEmail}`}
                  >
                    {lead.workEmail}
                  </Link>
                ),
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
                value: formatLabel(lead.interest),
              },
              {
                label: "Status",
                value: formatLabel(lead.status),
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
            ]}
          />
        </div>
        <div className="grid min-w-0 gap-4 content-start">
          <AdminDetailActionPanel
            title="Recommended next action"
            description="Contact the stakeholder or return to the activity queue to review adjacent leads."
          >
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={`mailto:${lead.workEmail}`}
            >
              <Mail className="size-3.5" />
              Email stakeholder
            </Link>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/admin#users-roles"
            >
              Back to stakeholder queue
            </Link>
          </AdminDetailActionPanel>
          <AdminDetailTimeline
            title="Lead timeline"
            description="The operational context for deciding how this stakeholder should be handled."
            items={[
              {
                label: "Captured",
                title: "Stakeholder request recorded",
                description: `${lead.name} entered the operations queue from the booking/demo workflow.`,
                timestamp: formatDateTime(lead.createdAt),
                tone: "info",
              },
              {
                label: "Current status",
                title: `${formatLabel(lead.status)} follow-up`,
                description: lead.note,
                tone: leadStatusTone(lead.status),
              },
              {
                label: "Next",
                title: "Review access and readiness fit",
                description:
                  "Use this record to decide whether to schedule, complete, or close follow-up.",
                tone: "attention",
              },
            ]}
          />
        </div>
      </div>
    </AdminDetailShell>
  );
}
