import Link from "next/link";
import { FileJsonIcon, Link2Icon, ShieldCheckIcon, TablePropertiesIcon } from "lucide-react";

import { AdminDetailJsonBlock, AdminDetailShell } from "@/components/product/admin-detail";
import { AdminStatusBadge } from "@/components/product/admin-module";
import { ExportSchemaWorkspace } from "@/components/product/export-schema-workspace";
import { buttonVariants } from "@/components/ui/button";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import {
  buildExportSchemaModel,
  getExportSchemaShape,
} from "@/lib/product/export-schema";
import { requireWorkspaceWorkflowAccess } from "../../workflow-guard";
import { loadAdminGovernanceData } from "../admin-loaders";

type ExportSchemaPageProps = {
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({ searchParams }: ExportSchemaPageProps) {
  await requireWorkspaceWorkflowAccess("admin");

  const [query, governanceData] = await Promise.all([
    searchParams,
    loadAdminGovernanceData(),
  ]);
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const model = buildExportSchemaModel({
    readiness: governanceData.partnerReadiness,
    auditEvents: governanceData.auditEvents,
  });
  const exportSchemaShape = getExportSchemaShape(model);
  const reviewSections = model.sections.filter(
    (section) => section.tone === "attention" || section.tone === "blocked",
  ).length;

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
            Inspect section ownership, field constraints, sample values, privacy
            boundaries, and source proof before the package reaches analytics, BI,
            or partner systems.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className={buttonVariants({ size: "sm" })} href="#export-schema-workspace">
              <TablePropertiesIcon aria-hidden="true" />
              <span>Inspect field contract</span>
            </a>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/admin/api-contract?from=admin-export-schema"
            >
              <FileJsonIcon aria-hidden="true" />
              <span>Open API contract</span>
            </Link>
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
            <AdminStatusBadge tone={reviewSections ? "attention" : "clear"}>
              Review
            </AdminStatusBadge>
          </div>
          <dl className="mt-3 divide-y divide-border-subtle">
            {[
              {
                label: "Schema owner",
                value: "Org admin operations",
                detail: "Owns status, freshness, and evidence language before partner use.",
              },
              {
                label: "Contract state",
                value: reviewSections ? "Ready with review notes" : "Ready",
                detail: "No private reporter identity or internal-only metadata in partner package.",
              },
              {
                label: "Consumer path",
                value: "JSON and CSV export",
                detail: "Mirrors the browser download and the partner export API contract.",
              },
            ].map((item) => (
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
        aria-label="Export source policy"
        className="grid gap-3 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:grid-cols-3"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Contract policy
          </p>
          <p className="mt-1 text-sm leading-5 text-foreground">
            Field rows are the review artifact. Section prose only explains why a
            field exists and which source proof backs it.
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
          <ShieldCheckIcon className="size-4 text-emerald-700" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-foreground">
            Partner-safe boundary
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Reporter credentials, raw secrets, and internal audit metadata stay out
            of export payloads.
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
          <Link2Icon className="size-4 text-sky-700" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-foreground">
            Source-linked proof
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Each package section keeps an admin proof route before external handoff.
          </p>
        </div>
      </section>

      <ExportSchemaWorkspace model={model} />

      <section id="export-schema-shape" className="scroll-mt-24">
        <AdminDetailJsonBlock title="Raw schema shape" value={exportSchemaShape} />
      </section>
    </AdminDetailShell>
  );
}
