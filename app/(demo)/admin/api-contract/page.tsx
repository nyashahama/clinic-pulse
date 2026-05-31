import Link from "next/link";
import {
  BracesIcon,
  FileJsonIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { AdminDetailShell } from "@/components/product/admin-detail";
import { AdminStatusBadge } from "@/components/product/admin-module";
import { ApiContractWorkspace } from "@/components/product/api-contract-workspace";
import { buttonVariants } from "@/components/ui/button";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { buildApiContractModel } from "@/lib/product/api-contract";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";
import { loadAdminPartnerReadiness } from "../admin-loaders";

type ApiContractPageProps = {
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({ searchParams }: ApiContractPageProps) {
  await requireDemoWorkflowAccess("admin");

  const [query, readiness] = await Promise.all([
    searchParams,
    loadAdminPartnerReadiness(),
  ]);
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));
  const model = buildApiContractModel(readiness);

  return (
    <AdminDetailShell
      eyebrow="Builder interface"
      title="API contract detail"
      description="Review the partner and operations API contract represented by the admin API preview."
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
            Builder interface
          </p>
          <h1 className="mt-1 max-w-4xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            API contract cockpit
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Inspect endpoint ownership, auth scope, request parameters, response states,
            sample payload, safety boundary, and current handoff evidence before a
            partner or internal consumer builds against the API.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className={buttonVariants({ size: "sm" })} href="#api-contract-workspace">
              <BracesIcon aria-hidden="true" />
              <span>Inspect endpoints</span>
            </a>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/admin/export-schema?from=admin-api-contract"
            >
              <FileJsonIcon aria-hidden="true" />
              <span>Open export schema</span>
            </Link>
          </div>
        </div>

        <aside
          aria-label="Consumer handoff"
          className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/55 p-3"
        >
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Consumer handoff
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                Build only after evidence review
              </h2>
            </div>
            <AdminStatusBadge tone="attention">Review</AdminStatusBadge>
          </div>
          <div className="mt-3 grid gap-3 text-sm leading-5 text-muted-foreground">
            <p>
              Endpoint contracts are read-only here: system admins select a path,
              verify readiness checks, then open the exact source evidence before
              handoff.
            </p>
            <Link
              href="/admin/integrations"
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "w-fit",
              )}
            >
              <KeyRoundIcon aria-hidden="true" />
              <span>Review integration keys</span>
            </Link>
          </div>
        </aside>
      </section>

      <section
        aria-label="Contract source policy"
        className="grid gap-3 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:grid-cols-3"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Contract policy
          </p>
          <p className="mt-1 text-sm leading-5 text-foreground">
            Request and response tables are stable review artifacts, not an ad hoc
            documentation dump.
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
          <ShieldCheckIcon className="size-4 text-emerald-700" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-foreground">
            Partner-safe boundary
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Internal audit fields, raw secrets, and reporter identity stay out of
            partner payloads.
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted/35 p-3">
          <FileJsonIcon className="size-4 text-sky-700" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-foreground">
            Evidence-linked handoff
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Export package, integration checks, and readiness evidence remain one
            click away.
          </p>
        </div>
      </section>

      <ApiContractWorkspace model={model} />
    </AdminDetailShell>
  );
}
