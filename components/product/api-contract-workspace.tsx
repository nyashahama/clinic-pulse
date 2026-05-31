"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRightIcon,
  BracesIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Code2Icon,
  FileJsonIcon,
  KeyRoundIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { AdminStatusBadge, getAdminToneClassName } from "@/components/product/admin-module";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterApiContractEndpoints,
  getDefaultApiContractEndpointId,
  type ApiContractEndpoint,
  type ApiContractMethodFilter,
  type ApiContractModel,
  type ApiContractReadinessFilter,
  type ApiContractSummaryMetric,
  type ApiContractTone,
} from "@/lib/product/api-contract";
import { cn } from "@/lib/utils";

type ApiContractWorkspaceProps = {
  model: ApiContractModel;
};

const methodOptions: Array<{ id: ApiContractMethodFilter; label: string }> = [
  { id: "all", label: "All methods" },
  { id: "GET", label: "GET" },
  { id: "POST", label: "POST" },
];

const readinessOptions: Array<{ id: ApiContractReadinessFilter; label: string }> = [
  { id: "all", label: "All states" },
  { id: "needs-review", label: "Needs review" },
  { id: "ready", label: "Ready" },
];

const methodToneClassName: Record<ApiContractEndpoint["method"], string> = {
  GET: "border-emerald-200 bg-emerald-50 text-emerald-950",
  POST: "border-amber-200 bg-amber-50 text-amber-950",
};

const metricToneClassName: Record<ApiContractTone, string> = {
  clear: "border-emerald-200 bg-emerald-50/55 text-emerald-950",
  attention: "border-amber-200 bg-amber-50/65 text-amber-950",
  blocked: "border-rose-200 bg-rose-50/65 text-rose-950",
  info: "border-sky-200 bg-sky-50/55 text-sky-950",
};

export function ApiContractWorkspace({ model }: ApiContractWorkspaceProps) {
  const [method, setMethod] = useState<ApiContractMethodFilter>("all");
  const [readiness, setReadiness] = useState<ApiContractReadinessFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    getDefaultApiContractEndpointId(model.endpoints),
  );
  const visibleEndpoints = useMemo(
    () => filterApiContractEndpoints(model.endpoints, { method, readiness, query }),
    [method, model.endpoints, query, readiness],
  );
  const selectedEndpoint =
    model.endpoints.find((endpoint) => endpoint.id === selectedId) ??
    model.endpoints[0] ??
    null;
  const hasActiveFilters =
    method !== "all" || readiness !== "all" || query.trim().length > 0;

  const onSelectEndpoint = (endpointId: string) => {
    setSelectedId(endpointId);
  };

  const onClearFilters = () => {
    setMethod("all");
    setReadiness("all");
    setQuery("");
  };

  return (
    <section
      id="api-contract-workspace"
      aria-label="API contract workspace"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-3 border-b border-border-subtle bg-bg-default px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            API contract workspace
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
            Select an endpoint to inspect its auth boundary, request parameters, response
            states, sample payload, readiness checks, and source evidence before handoff.
          </p>
        </div>
        <ApiContractSummary metrics={model.summaryMetrics} />
      </div>

      <div
        aria-label="API contract controls"
        className="grid gap-3 border-b border-border-subtle bg-bg-default p-3 lg:grid-cols-[minmax(260px,1fr)_minmax(10rem,auto)_minmax(12rem,auto)_auto] lg:items-center"
      >
        <label className="relative min-w-0">
          <span className="sr-only">Search API contract endpoints</span>
          <SearchIcon
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search API contract endpoints"
            className="pl-8"
            placeholder="Search paths, scopes, fields, consumers..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Method
          <select
            aria-label="Filter API contract by method"
            className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={method}
            onChange={(event) => setMethod(event.target.value as ApiContractMethodFilter)}
          >
            {methodOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Readiness
          <select
            aria-label="Filter API contract by readiness"
            className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={readiness}
            onChange={(event) =>
              setReadiness(event.target.value as ApiContractReadinessFilter)
            }
          >
            {readinessOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-border-subtle bg-bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <AdminStatusBadge tone="info">Read-only</AdminStatusBadge>{" "}
          <span>{visibleEndpoints.length} visible endpoints</span>
        </div>
      </div>

      <div className="grid items-start xl:grid-cols-[minmax(0,0.86fr)_minmax(420px,1.14fr)]">
        <EndpointList
          endpoints={visibleEndpoints}
          hasActiveFilters={hasActiveFilters}
          selectedId={selectedEndpoint?.id ?? null}
          onClearFilters={onClearFilters}
          onSelectEndpoint={onSelectEndpoint}
        />
        <EndpointInspector endpoint={selectedEndpoint} />
      </div>
    </section>
  );
}

function ApiContractSummary({ metrics }: { metrics: ApiContractSummaryMetric[] }) {
  return (
    <dl
      aria-label="API contract summary"
      className="grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className={cn(
            "min-w-0 rounded-lg border px-3 py-2",
            metricToneClassName[metric.tone],
          )}
        >
          <dt className="text-xs font-medium leading-4 text-current/70">
            {metric.label}
          </dt>
          <dd className="mt-1 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
            <span className="font-mono text-lg font-semibold leading-none text-current">
              {metric.value}
            </span>
            <span className="min-w-0 text-xs leading-4 text-current/70">
              {metric.detail}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EndpointList({
  endpoints,
  hasActiveFilters,
  selectedId,
  onClearFilters,
  onSelectEndpoint,
}: {
  endpoints: ApiContractEndpoint[];
  hasActiveFilters: boolean;
  selectedId: string | null;
  onClearFilters: () => void;
  onSelectEndpoint: (endpointId: string) => void;
}) {
  return (
    <div
      aria-label="Contract endpoint list"
      className="min-w-0 border-b border-border-subtle p-3 xl:border-b-0 xl:border-r"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Contract endpoint list
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Select first, then open source evidence.
          </p>
        </div>
        {hasActiveFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2">
        {endpoints.length ? (
          endpoints.map((endpoint) => {
            const isSelected = endpoint.id === selectedId;

            return (
              <button
                key={endpoint.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Select ${endpoint.method} ${endpoint.path} endpoint contract`}
                className={cn(
                  "group grid min-w-0 gap-3 rounded-lg border p-3 text-left transition",
                  isSelected
                    ? "border-foreground bg-bg-muted"
                    : "border-border-subtle bg-bg-default hover:bg-bg-muted/60",
                )}
                onClick={() => onSelectEndpoint(endpoint.id)}
              >
                <span className="flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold",
                          methodToneClassName[endpoint.method],
                        )}
                      >
                        {endpoint.method}
                      </span>
                      <AdminStatusBadge tone={endpoint.readinessTone}>
                        {endpoint.readinessLabel}
                      </AdminStatusBadge>
                    </span>
                    <span className="mt-2 block break-all font-mono text-sm font-semibold text-foreground">
                      {endpoint.path}
                    </span>
                  </span>
                  <ArrowUpRightIcon
                    className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="break-words text-sm leading-5 text-muted-foreground">
                  {endpoint.purpose}
                </span>
                <span className="flex min-w-0 flex-wrap gap-2">
                  <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {endpoint.owner}
                  </span>
                  <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {endpoint.requiredScopes.length
                      ? endpoint.requiredScopes.join(", ")
                      : endpoint.authMode}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-muted/35 p-4 text-sm text-muted-foreground">
            No endpoint contracts match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

function EndpointInspector({ endpoint }: { endpoint: ApiContractEndpoint | null }) {
  if (!endpoint) {
    return (
      <aside
        aria-label="Selected endpoint contract"
        className="p-4 text-sm text-muted-foreground"
      >
        Select an endpoint contract to inspect request and response evidence.
      </aside>
    );
  }

  return (
    <aside
      aria-label="Selected endpoint contract"
      className="grid min-w-0 gap-4 bg-bg-muted/25 p-3 sm:p-4"
    >
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
        <div className="grid gap-3 border-b border-border-subtle px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded border px-2 py-1 font-mono text-xs font-semibold",
                  methodToneClassName[endpoint.method],
                )}
              >
                {endpoint.method}
              </span>
              <AdminStatusBadge tone={endpoint.readinessTone}>
                {endpoint.readinessLabel}
              </AdminStatusBadge>
              <AdminStatusBadge tone="info">{endpoint.owner}</AdminStatusBadge>
            </div>
            <h2 className="mt-2 break-all font-mono text-lg font-semibold leading-tight text-foreground">
              {endpoint.path}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {endpoint.purpose}
            </p>
          </div>
          <Link
            href={endpoint.sourceHref}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            Open source evidence
            <ArrowUpRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <dl className="grid gap-0 divide-y divide-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <EndpointFact icon={KeyRoundIcon} label="Auth boundary">
            {endpoint.authDetail}
          </EndpointFact>
          <EndpointFact icon={BracesIcon} label="Consumer">
            {endpoint.consumer}
          </EndpointFact>
          <EndpointFact icon={ShieldCheckIcon} label="Source evidence">
            {endpoint.sourceLabel}
          </EndpointFact>
        </dl>
      </div>

      <section
        aria-label="Contract readiness checks"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm"
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Contract readiness checks
          </p>
        </div>
        <div className="grid gap-2 p-3">
          {endpoint.readinessChecks.map((check) => (
            <div
              key={check.id}
              className={cn(
                "grid min-w-0 gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto]",
                getAdminToneClassName(check.tone),
              )}
            >
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {check.tone === "clear" ? (
                    <CheckCircle2Icon className="size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CircleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  <p className="font-medium leading-5">{check.label}</p>
                  <span className="rounded-md bg-white/55 px-1.5 py-0.5 text-xs">
                    {check.state}
                  </span>
                </div>
                <p className="mt-2 break-words text-sm leading-5 text-current/75">
                  {check.detail}
                </p>
              </div>
              {check.sourceHref ? (
                <Link
                  href={check.sourceHref}
                  className="inline-flex h-fit items-center justify-center gap-1.5 rounded-md border border-current/20 bg-white/60 px-2.5 py-1.5 text-xs font-medium text-current transition hover:bg-white/80"
                >
                  Evidence
                  <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Request parameters"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm"
      >
        <ContractSectionHeader
          icon={Code2Icon}
          title="Request parameters"
          description="Inputs a consumer must supply before the endpoint is usable."
        />
        <div className="divide-y divide-border-subtle">
          {endpoint.parameters.map((parameter) => (
            <div
              key={`${endpoint.id}-${parameter.location}-${parameter.name}`}
              className="grid min-w-0 gap-3 p-3 md:grid-cols-[minmax(8rem,0.7fr)_minmax(0,1.3fr)]"
            >
              <div className="min-w-0">
                <p className="break-all font-mono text-sm font-semibold text-foreground">
                  {parameter.name}
                </p>
                <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                  <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">
                    {parameter.location}
                  </span>
                  <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {parameter.required ? "Required" : "Optional"}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="break-words text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  {parameter.type}
                </p>
                <p className="mt-1 break-words text-sm leading-5 text-foreground">
                  {parameter.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Response contract"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm"
      >
        <ContractSectionHeader
          icon={FileJsonIcon}
          title="Response contract"
          description="Status states and fields consumers should handle explicitly."
        />
        <div className="divide-y divide-border-subtle">
          {endpoint.responses.map((response) => (
            <div
              key={`${endpoint.id}-${response.status}`}
              className="grid min-w-0 gap-3 p-3 lg:grid-cols-[minmax(8rem,0.6fr)_minmax(0,0.9fr)_minmax(0,1.4fr)]"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-foreground">
                  {response.status}
                </p>
                <p className="mt-1 break-words text-xs font-medium text-muted-foreground">
                  {response.label}
                </p>
              </div>
              <p className="min-w-0 break-words text-sm leading-5 text-foreground">
                {response.description}
              </p>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Fields
                </p>
                <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                  {response.fields.map((field) => (
                    <span
                      key={`${response.status}-${field}`}
                      className="max-w-full break-all rounded-md border border-border-subtle bg-bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Sample payload"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm"
      >
        <ContractSectionHeader
          icon={BracesIcon}
          title="Sample payload"
          description="Representative response shape generated from current handoff evidence."
        />
        <pre className="max-h-[28rem] overflow-auto bg-zinc-950 p-4 text-xs leading-5 text-zinc-50">
          <code>{endpoint.samplePayload}</code>
        </pre>
      </section>
    </aside>
  );
}

function EndpointFact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof ShieldCheckIcon;
  label: string;
  children: string;
}) {
  return (
    <div className="min-w-0 p-4">
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm leading-5 text-foreground">{children}</dd>
    </div>
  );
}

function ContractSectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheckIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 border-b border-border-subtle px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
