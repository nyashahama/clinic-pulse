import Link from "next/link";
import {
  ClipboardCheckIcon,
  DatabaseIcon,
  FileJsonIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  AdminDetailFieldGrid,
  AdminDetailJsonBlock,
  AdminDetailShell,
} from "@/components/product/admin-detail";
import {
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { buttonVariants } from "@/components/ui/button";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

type ExportSchemaPageProps = {
  searchParams: Promise<AdminSearchParams>;
};

const exportSchema = {
  generatedAt: "ISO-8601 timestamp",
  district: "District name represented in the package",
  province: "Province name represented in the package",
  clinics: [
    {
      id: "Clinic identifier",
      name: "Clinic display name",
      facilityCode: "Facility code",
      status: "operational | degraded | non_functional | unknown",
      freshness: "fresh | needs_confirmation | stale | unknown",
      reason: "Current operating-state reason",
    },
  ],
  leads: [
    {
      name: "Stakeholder name",
      workEmail: "Stakeholder work email",
      organization: "Organisation",
      interest: "Workflow interest",
      status: "new | contacted | scheduled | completed",
      createdAt: "ISO-8601 timestamp",
    },
  ],
  alerts: ["Audit and alert events included in the operations package"],
  reports: [
    {
      id: "Report identifier",
      clinicId: "Clinic identifier",
      status: "Reported operating status",
      reason: "Submitted context",
      receivedAt: "ISO-8601 timestamp",
      source: "Report source",
    },
  ],
};

export default async function Page({ searchParams }: ExportSchemaPageProps) {
  await requireDemoWorkflowAccess("admin");

  const query = await searchParams;
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const schemaSectionCount = Object.keys(exportSchema).length;
  const taskCards = [
    {
      id: "shape",
      title: "Review schema shape",
      description:
        "Confirm every package section is documented before handing operations data to analytics or BI tools.",
      href: "#export-schema-shape",
      stateLabel: `${schemaSectionCount} sections`,
      tone: "info" as AdminTone,
      Icon: FileJsonIcon,
    },
    {
      id: "status",
      title: "Confirm clinic status contract",
      description:
        "Keep status and freshness values consistent with the live operations and reporting coverage surfaces.",
      href: "#export-schema-fields",
      stateLabel: "4 status states",
      tone: "clear" as AdminTone,
      Icon: ClipboardCheckIcon,
    },
    {
      id: "audit",
      title: "Open export evidence",
      description:
        "Review persisted export runs, checksums, webhook delivery, and source audit evidence before partner handoff.",
      href: "/admin/audit-evidence",
      stateLabel: "Evidence linked",
      tone: "clear" as AdminTone,
      Icon: ShieldCheckIcon,
    },
    {
      id: "partner",
      title: "Validate partner handoff",
      description:
        "Generate the current export package from partner readiness once source freshness and review state are trusted.",
      href: "/admin/partner-readiness",
      stateLabel: "Partner proof",
      tone: "info" as AdminTone,
      Icon: DatabaseIcon,
    },
  ];

  return (
    <AdminDetailShell
      eyebrow="Operations package"
      title="Export schema detail"
      description="Review the JSON and CSV export contract before handing operations data into analytics or BI tools."
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <section className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
              Operations package
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              Export schema command centre
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">
              Review the JSON and CSV export contract before handing clinic, stakeholder, alert, and report data into analytics or partner systems.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                  Active blocker
                </p>
                <p className="mt-1 break-words text-xl font-semibold">
                  Export contract ready for partner proof
                </p>
              </div>
              <p className="text-xs text-neutral-400">
                Schema sections: {schemaSectionCount}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a className={buttonVariants({ size: "sm" })} href="#export-schema-shape">
              Review schema
            </a>
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
              href="/admin/partner-readiness"
            >
              Open partner readiness
            </Link>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-white/[0.03] sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Supported formats",
              value: "JSON + CSV",
              detail: "Export package can be copied or downloaded",
            },
            {
              label: "Payload sections",
              value: schemaSectionCount,
              detail: "Generated metadata, clinics, leads, alerts, and reports",
            },
            {
              label: "Clinic status",
              value: "4 states",
              detail: "Operational, degraded, non functional, or unknown",
            },
            {
              label: "Freshness field",
              value: "4 states",
              detail: "Fresh, needs confirmation, stale, or unknown",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="min-w-0 border-t border-white/10 px-5 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0"
            >
              <p className="text-xs font-semibold uppercase tracking-normal text-neutral-400">
                {metric.label}
              </p>
              <p className="mt-1 break-words text-2xl font-semibold">{metric.value}</p>
              <p className="mt-1 break-words text-xs leading-5 text-neutral-400">
                {metric.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Export schema task queue" className="grid gap-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Next actions
            </p>
            <h2 className="text-xl font-semibold text-foreground">Export proof queue</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Keep schema shape, value contracts, and generated export evidence aligned before handoff.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {taskCards.map(({ Icon, ...task }) => (
            <Link
              key={task.id}
              href={task.href}
              className="min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm transition hover:bg-bg-muted/60"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    getAdminToneClassName(task.tone),
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <AdminStatusBadge tone={task.tone}>{task.stateLabel}</AdminStatusBadge>
              </div>
              <h3 className="mt-4 break-words text-base font-semibold text-foreground">
                {task.title}
              </h3>
              <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
                {task.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="export-schema-fields" className="scroll-mt-24">
        <AdminDetailFieldGrid
          fields={[
            {
              label: "Primary purpose",
              value: "Operations review package for clinics, stakeholder leads, alerts, and reports.",
              className: "sm:col-span-2 xl:col-span-3",
            },
            {
              label: "Supported formats",
              value: "JSON and CSV",
            },
            {
              label: "Clinic status field",
              value: "operational, degraded, non functional, or unknown",
            },
            {
              label: "Freshness field",
              value: "fresh, needs confirmation, stale, or unknown",
            },
            {
              label: "Review note",
              value: "Use the export evidence pages for persisted partner export runs.",
              className: "sm:col-span-2 xl:col-span-3",
            },
          ]}
        />
      </section>
      <section id="export-schema-shape" className="scroll-mt-24">
        <AdminDetailJsonBlock title="Schema shape" value={exportSchema} />
      </section>
    </AdminDetailShell>
  );
}
