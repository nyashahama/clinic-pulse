import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  FileJsonIcon,
  Link2Icon,
  ShieldCheckIcon,
  TablePropertiesIcon,
} from "lucide-react";

import {
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
  buildAdminAuditEventDetailHref,
  buildAdminExportRunDetailHref,
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

const schemaSections = [
  {
    id: "metadata",
    title: "Package metadata",
    description: "Identifies when the export was generated and which district scope it covers.",
    recordScope: "One package header",
    fields: ["generatedAt", "district", "province"],
    valueContract: "ISO timestamp plus canonical district and province names.",
    source: "Partner export run",
    evidenceHref: buildAdminExportRunDetailHref(4, "admin-export-schema"),
    tone: "clear" as AdminTone,
  },
  {
    id: "clinics",
    title: "Clinic operating state",
    description: "Carries the current trusted facility record that downstream teams reconcile.",
    recordScope: "One row per clinic",
    fields: ["id", "name", "facilityCode", "status", "freshness", "reason"],
    valueContract: "Status and freshness enums match the reporting coverage review surface.",
    source: "Reporting coverage",
    evidenceHref: "/admin/reporting-coverage",
    tone: "attention" as AdminTone,
  },
  {
    id: "leads",
    title: "Stakeholder leads",
    description: "Shows partner and operator contacts without exposing reporter credentials.",
    recordScope: "One row per captured lead",
    fields: ["name", "workEmail", "organization", "interest", "status", "createdAt"],
    valueContract: "Lead status stays in new, contacted, scheduled, or completed.",
    source: "Admin leads",
    evidenceHref: "/admin",
    tone: "info" as AdminTone,
  },
  {
    id: "alerts",
    title: "Alert trail",
    description: "Preserves operational warning events as reviewable context for the handoff.",
    recordScope: "Audit and alert summaries",
    fields: ["eventType", "summary", "createdAt", "metadata"],
    valueContract: "Every alert keeps a human summary and source metadata for review.",
    source: "Audit evidence",
    evidenceHref: buildAdminAuditEventDetailHref(10, "admin-export-schema"),
    tone: "clear" as AdminTone,
  },
  {
    id: "reports",
    title: "Reviewed reports",
    description: "Exports reports after governance review rather than raw field submissions.",
    recordScope: "One row per report",
    fields: ["id", "clinicId", "status", "reason", "receivedAt", "source"],
    valueContract: "Report state is downstream-safe only after review and source attribution.",
    source: "Report review",
    evidenceHref: "/admin/reporting-coverage",
    tone: "attention" as AdminTone,
  },
];

const handoffPacket = [
  {
    label: "Schema owner",
    value: "Org admin operations",
    detail: "Owns status, freshness, and evidence language before partner use.",
  },
  {
    label: "Contract state",
    value: "Ready with review notes",
    detail: "No private reporter identity or internal-only metadata in partner package.",
  },
  {
    label: "Consumer path",
    value: "JSON and CSV export",
    detail: "Mirrors the browser download and the partner export API contract.",
  },
];

const sourceEvidence = [
  {
    label: "Export run checksum",
    detail: "The generated package is tied to an export run, scope, record counts, and checksum.",
    href: buildAdminExportRunDetailHref(4, "admin-export-schema"),
    tone: "clear" as AdminTone,
    Icon: BadgeCheckIcon,
  },
  {
    label: "Coverage readiness",
    detail: "Clinic freshness and status values come from the reporting coverage ledger.",
    href: "/admin/reporting-coverage",
    tone: "attention" as AdminTone,
    Icon: TablePropertiesIcon,
  },
  {
    label: "Partner API contract",
    detail: "Endpoint semantics and payload boundaries are reviewed before handoff.",
    href: "/admin/api-contract?from=admin-export-schema",
    tone: "info" as AdminTone,
    Icon: Link2Icon,
  },
];

const valueGuardrails = [
  "Clinic status: operational, degraded, non_functional, unknown",
  "Freshness: fresh, needs_confirmation, stale, unknown",
  "Lead status: new, contacted, scheduled, completed",
  "Reports: exported only with source and receivedAt attribution",
];

export default async function Page({ searchParams }: ExportSchemaPageProps) {
  await requireDemoWorkflowAccess("admin");

  const query = await searchParams;
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const packageSectionCount = schemaSections.length;
  const schemaKeyCount = Object.keys(exportSchema).length;

  return (
    <AdminDetailShell
      eyebrow="Operations package"
      title="Export schema detail"
      description="Review the JSON and CSV export contract before handing operations data into analytics or BI tools."
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
      hideHeader
    >
      <section
        data-admin-module
        className="grid gap-4 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:p-5"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Operations package
          </p>
          <h1 className="mt-1 max-w-4xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Export contract cockpit
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Inspect the handoff packet, field contract, value guardrails, and source evidence
            before the package reaches analytics, BI, or partner systems.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className={buttonVariants({ size: "sm" })} href="#field-contract">
              <TablePropertiesIcon aria-hidden="true" />
              <span>Review field contract</span>
            </a>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/admin/api-contract?from=admin-export-schema"
            >
              <FileJsonIcon aria-hidden="true" />
              <span>Open API contract</span>
            </Link>
          </div>
          <div className="mt-5 hidden gap-2 sm:grid sm:grid-cols-3">
            {[
              {
                label: "Handoff packet",
                value: "Ready",
                detail: "Owner, contract state, and consumer path.",
              },
              {
                label: "Field contract",
                value: `${packageSectionCount} sections`,
                detail: "Package metadata through reviewed reports.",
              },
              {
                label: "Source evidence",
                value: `${sourceEvidence.length} links`,
                detail: "Checksum, coverage, and API contract proof.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-md border border-border-subtle bg-bg-muted/55 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-foreground">
                  {item.value}
                </p>
                <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside
          aria-label="Handoff packet"
          className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/55 p-3"
        >
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Handoff packet
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                Partner-safe export proof
              </h2>
            </div>
            <AdminStatusBadge tone="clear">Ready</AdminStatusBadge>
          </div>
          <dl className="mt-3 divide-y divide-border-subtle">
            {handoffPacket.map((item) => (
              <div key={item.label} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                <dt className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="break-words text-sm font-semibold text-foreground">
                  {item.value}
                </dd>
                <dd className="break-words text-xs leading-5 text-muted-foreground">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section
        aria-label="Export contract summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: "Supported formats",
            value: "JSON + CSV",
            detail: "Browser export and partner API package.",
            tone: "clear" as AdminTone,
          },
          {
            label: "Payload sections",
            value: packageSectionCount,
            detail: "Metadata, clinics, leads, alerts, and reports.",
            tone: "info" as AdminTone,
          },
          {
            label: "Source evidence",
            value: sourceEvidence.length,
            detail: "Checksum, coverage, and contract proof linked.",
            tone: "clear" as AdminTone,
          },
          {
            label: "Schema keys",
            value: schemaKeyCount,
            detail: "Top-level JSON keys in the raw schema shape.",
            tone: "attention" as AdminTone,
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className={cn(
              "min-w-0 rounded-lg border p-4 shadow-sm",
              getAdminToneClassName(metric.tone),
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-normal opacity-75">
              {metric.label}
            </p>
            <p className="mt-1 break-words text-2xl font-semibold leading-tight">
              {metric.value}
            </p>
            <p className="mt-1 break-words text-xs leading-5 opacity-80">
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      <section
        aria-label="Source evidence"
        className="grid gap-3 md:grid-cols-3"
      >
        {sourceEvidence.map(({ Icon, ...evidence }) => (
          <Link
            key={evidence.label}
            href={evidence.href}
            className="group min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm transition hover:bg-bg-muted/60"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
                  getAdminToneClassName(evidence.tone),
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <ArrowRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Source evidence
            </p>
            <h2 className="mt-1 break-words text-base font-semibold text-foreground">
              {evidence.label}
            </h2>
            <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
              {evidence.detail}
            </p>
          </Link>
        ))}
      </section>

      <section
        id="field-contract"
        aria-label="Field contract"
        className="scroll-mt-24 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <div className="grid gap-3 border-b border-border-subtle p-4 md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.45fr)] md:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Field contract
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Export fields by package section
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Each section states the downstream record shape, source proof, and value contract
              an admin should verify before release.
            </p>
          </div>
          <div className="rounded-md border border-border-subtle bg-bg-muted/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Value guardrails
            </p>
            <ul className="mt-2 grid gap-2 text-xs leading-5 text-muted-foreground">
              {valueGuardrails.map((guardrail) => (
                <li key={guardrail} className="break-words">
                  {guardrail}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divide-y divide-border-subtle">
          {schemaSections.map((section) => (
            <article
              key={section.id}
              className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(13rem,0.45fr)]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminStatusBadge tone={section.tone}>{section.recordScope}</AdminStatusBadge>
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    {section.source}
                  </p>
                </div>
                <h3 className="mt-2 break-words text-base font-semibold text-foreground">
                  {section.title}
                </h3>
                <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                  {section.description}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Fields
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {section.fields.map((field) => (
                    <code
                      key={field}
                      className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-content-default"
                    >
                      {field}
                    </code>
                  ))}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Value contract
                </p>
                <p className="mt-1 break-words text-sm leading-5 text-foreground">
                  {section.valueContract}
                </p>
              </div>

              <div className="min-w-0 lg:text-right">
                <Link
                  href={section.evidenceHref}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "max-w-full whitespace-normal text-left lg:text-right",
                  )}
                >
                  <ShieldCheckIcon aria-hidden="true" />
                  <span>Open source proof</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="export-schema-shape" className="scroll-mt-24">
        <AdminDetailJsonBlock title="Raw schema shape" value={exportSchema} />
      </section>
    </AdminDetailShell>
  );
}
