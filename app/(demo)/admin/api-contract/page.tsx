import Link from "next/link";
import {
  ArrowRightIcon,
  BracesIcon,
  DatabaseIcon,
  FileJsonIcon,
  KeyRoundIcon,
  SendIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { AdminDetailShell } from "@/components/product/admin-detail";
import {
  AdminStatusBadge,
  getAdminToneClassName,
  type AdminTone,
} from "@/components/product/admin-module";
import { buttonVariants } from "@/components/ui/button";
import {
  buildAdminExportRunDetailHref,
  getAdminReturnSource,
  getAdminReturnTarget,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { cn } from "@/lib/utils";
import { requireDemoWorkflowAccess } from "../../workflow-guard";

type ApiContractPageProps = {
  searchParams: Promise<AdminSearchParams>;
};

const endpointContract = [
  {
    id: "clinics",
    method: "GET",
    path: "/v1/clinics",
    purpose: "Operational clinic directory for authenticated operations users.",
    owner: "Operations API",
    auth: "Operations session",
    consumer: "District dashboards and admin export review.",
    evidenceHref: "/admin/reporting-coverage",
    request: ["Optional district scope", "Same-origin browser proxy allowed"],
    response: ["Clinic id, facility code, operating status, freshness, and reason"],
    safety: ["Requires signed-in operations user", "No reporter private identity"],
    tone: "clear" as AdminTone,
  },
  {
    id: "reports",
    method: "POST",
    path: "/v1/reports",
    purpose: "Field report submission that enters review before changing trusted state.",
    owner: "Field reporting",
    auth: "Reporter session",
    consumer: "Reporter cockpit and governance review queue.",
    evidenceHref: "/admin/reporting-coverage",
    request: ["clinicId", "status", "reason", "source", "offline receipt when queued"],
    response: ["Report id, review state, receivedAt, and validation messages"],
    safety: ["Review required before trusted clinic state changes", "Validation failures stay visible"],
    tone: "attention" as AdminTone,
  },
  {
    id: "alternatives",
    method: "GET",
    path: "/v1/partner/alternatives",
    purpose: "Partner-safe alternative clinic recommendations.",
    owner: "Partner API",
    auth: "Partner bearer key",
    consumer: "Partner search and referral workflows.",
    evidenceHref: "/admin/partner-readiness",
    request: ["Clinic id or service need", "Optional radius and service filters"],
    response: ["Ranked clinics, distance hints, operating state, and reason"],
    safety: ["Only partner-safe clinic metadata", "No internal audit metadata"],
    tone: "clear" as AdminTone,
  },
  {
    id: "export-latest",
    method: "GET",
    path: "/v1/partner/export/latest",
    purpose: "Latest generated partner export metadata and package location.",
    owner: "Partner handoff",
    auth: "Partner bearer key",
    consumer: "Analytics, BI, and partner ingestion jobs.",
    evidenceHref: buildAdminExportRunDetailHref(4, "admin-api-contract"),
    request: ["Partner key", "Optional format query for json or csv"],
    response: ["GeneratedAt, scope, record counts, checksum, and download reference"],
    safety: ["Checksum required before ingestion", "Export package excludes internal-only fields"],
    tone: "info" as AdminTone,
  },
  {
    id: "integration-status",
    method: "GET",
    path: "/v1/partner/integration-status",
    purpose: "Partner-visible readiness and integration status.",
    owner: "Integration operations",
    auth: "Partner bearer key",
    consumer: "Partner readiness review and support escalation.",
    evidenceHref: "/admin/integrations",
    request: ["Partner key", "Optional check group"],
    response: ["Webhook health, export freshness, key state, and readiness label"],
    safety: ["Status only; no raw webhook payload leakage", "Failed checks remain reviewable"],
    tone: "attention" as AdminTone,
  },
];

const contractStats = [
  {
    label: "Endpoints",
    value: endpointContract.length,
    detail: "Operations, reporter, and partner-facing routes.",
    tone: "info" as AdminTone,
  },
  {
    label: "Auth modes",
    value: "3",
    detail: "Operations session, reporter session, and partner bearer key.",
    tone: "clear" as AdminTone,
  },
  {
    label: "Safety boundary",
    value: "Partner-safe",
    detail: "Reporter identity and internal audit metadata stay out of partner responses.",
    tone: "clear" as AdminTone,
  },
  {
    label: "Consumer handoff",
    value: "Evidence linked",
    detail: "Every endpoint points back to an admin review surface.",
    tone: "attention" as AdminTone,
  },
];

function methodTone(method: string): AdminTone {
  return method === "POST" ? "attention" : "clear";
}

export default async function Page({ searchParams }: ApiContractPageProps) {
  await requireDemoWorkflowAccess("admin");

  const query = await searchParams;
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

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
            Review endpoint ownership, request contract, response contract, auth model, and
            safety boundary before a partner or internal consumer builds against the API.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className={buttonVariants({ size: "sm" })} href="#endpoint-rail">
              <BracesIcon aria-hidden="true" />
              <span>Review endpoints</span>
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
              Partner consumers get stable payload semantics, checksum-aware export metadata,
              and no reporter-private fields.
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
        aria-label="API contract summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {contractStats.map((metric) => (
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
        id="endpoint-rail"
        className="grid scroll-mt-24 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]"
      >
        <aside
          aria-label="Endpoint rail"
          className="h-fit min-w-0 rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm lg:sticky lg:top-4"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Endpoint rail
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Contract map
          </h2>
          <nav className="mt-3 grid gap-2" aria-label="API contract endpoints">
            {endpointContract.map((endpoint) => (
              <a
                key={endpoint.id}
                href={`#endpoint-${endpoint.id}`}
                className="group grid min-w-0 gap-1 rounded-md border border-border-subtle bg-bg-muted/45 p-2.5 transition hover:bg-bg-muted"
              >
                <span className="flex min-w-0 items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold",
                      getAdminToneClassName(methodTone(endpoint.method)),
                    )}
                  >
                    {endpoint.method}
                  </span>
                  <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </span>
                <code className="min-w-0 break-words text-xs text-foreground">
                  {endpoint.path}
                </code>
              </a>
            ))}
          </nav>
        </aside>

        <div className="grid min-w-0 gap-4">
          {endpointContract.map((endpoint) => (
            <article
              key={endpoint.id}
              id={`endpoint-${endpoint.id}`}
              className="scroll-mt-24 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
            >
              <div className="grid gap-3 border-b border-border-subtle p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge tone={endpoint.tone}>{endpoint.owner}</AdminStatusBadge>
                    <span
                      className={cn(
                        "rounded border px-2 py-1 font-mono text-xs font-semibold",
                        getAdminToneClassName(methodTone(endpoint.method)),
                      )}
                    >
                      {endpoint.method}
                    </span>
                  </div>
                  <h3 className="mt-2 break-words font-mono text-base font-semibold text-foreground">
                    {endpoint.path}
                  </h3>
                  <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                    {endpoint.purpose}
                  </p>
                </div>
                <Link
                  href={endpoint.evidenceHref}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "w-fit",
                  )}
                >
                  <ShieldCheckIcon aria-hidden="true" />
                  <span>Open evidence</span>
                </Link>
              </div>

              <div className="grid gap-0 divide-y divide-border-subtle lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <div className="min-w-0 p-4">
                  <div className="flex items-center gap-2">
                    <SendIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h4 className="text-sm font-semibold text-foreground">
                      Request contract
                    </h4>
                  </div>
                  <dl className="mt-3 grid gap-3">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                        Authentication
                      </dt>
                      <dd className="mt-1 break-words text-sm text-foreground">
                        {endpoint.auth}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                        Required input
                      </dt>
                      <dd className="mt-2 flex flex-wrap gap-2">
                        {endpoint.request.map((item) => (
                          <span
                            key={item}
                            className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-content-default"
                          >
                            {item}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="min-w-0 p-4">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h4 className="text-sm font-semibold text-foreground">
                      Response contract
                    </h4>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm leading-5 text-muted-foreground">
                    {endpoint.response.map((item) => (
                      <li key={item} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-0 border-t border-border-subtle lg:grid-cols-2 lg:divide-x lg:divide-border-subtle">
                <div className="min-w-0 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h4 className="text-sm font-semibold text-foreground">
                      Safety boundary
                    </h4>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm leading-5 text-muted-foreground">
                    {endpoint.safety.map((item) => (
                      <li key={item} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="min-w-0 p-4">
                  <div className="flex items-center gap-2">
                    <KeyRoundIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h4 className="text-sm font-semibold text-foreground">
                      Consumer handoff
                    </h4>
                  </div>
                  <p className="mt-3 break-words text-sm leading-5 text-muted-foreground">
                    {endpoint.consumer}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminDetailShell>
  );
}
