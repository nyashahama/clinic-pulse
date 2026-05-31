"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRightIcon,
  FileJsonIcon,
  SearchIcon,
  ShieldCheckIcon,
  TablePropertiesIcon,
} from "lucide-react";

import { AdminStatusBadge } from "@/components/product/admin-module";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterExportSchemaSections,
  getDefaultExportSchemaSectionId,
  getExportSchemaSectionStateLabel,
  type ExportSchemaField,
  type ExportSchemaModel,
  type ExportSchemaSection,
  type ExportSchemaStateFilter,
  type ExportSchemaSummaryMetric,
  type ExportSchemaTone,
} from "@/lib/product/export-schema";
import { cn } from "@/lib/utils";

type ExportSchemaWorkspaceProps = {
  model: ExportSchemaModel;
};

const stateOptions: Array<{ id: ExportSchemaStateFilter; label: string }> = [
  { id: "all", label: "All states" },
  { id: "needs-review", label: "Needs review" },
  { id: "ready", label: "Ready" },
  { id: "info", label: "Info" },
];

const metricToneClassName: Record<ExportSchemaTone, string> = {
  clear: "border-emerald-200 bg-emerald-50/55 text-emerald-950",
  attention: "border-amber-200 bg-amber-50/65 text-amber-950",
  blocked: "border-rose-200 bg-rose-50/65 text-rose-950",
  info: "border-sky-200 bg-sky-50/55 text-sky-950",
};

export function ExportSchemaWorkspace({ model }: ExportSchemaWorkspaceProps) {
  const [stateFilter, setStateFilter] = useState<ExportSchemaStateFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    getDefaultExportSchemaSectionId(model.sections),
  );
  const visibleSections = useMemo(
    () => filterExportSchemaSections(model.sections, { state: stateFilter, query }),
    [model.sections, query, stateFilter],
  );
  const selectedSection =
    model.sections.find((section) => section.id === selectedId) ??
    model.sections[0] ??
    null;
  const hasActiveFilters = stateFilter !== "all" || query.trim().length > 0;

  const onSelectSection = (sectionId: string) => {
    setSelectedId(sectionId);
  };

  const onClearFilters = () => {
    setStateFilter("all");
    setQuery("");
  };

  return (
    <section
      id="export-schema-workspace"
      aria-label="Export schema workspace"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
    >
      <div className="grid gap-3 border-b border-border-subtle bg-bg-default px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Export schema workspace
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
            Select a package section to inspect field constraints, sample values, privacy
            boundary, validation state, and source proof before releasing the export.
          </p>
        </div>
        <ExportSchemaSummary metrics={model.summaryMetrics} />
      </div>

      <div
        aria-label="Export schema controls"
        className="grid gap-3 border-b border-border-subtle bg-bg-default p-3 lg:grid-cols-[minmax(260px,1fr)_minmax(12rem,auto)_auto] lg:items-center"
      >
        <label className="relative min-w-0">
          <span className="sr-only">Search export schema sections</span>
          <SearchIcon
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search export schema sections"
            className="pl-8"
            placeholder="Search sections, fields, constraints, proof..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          State
          <select
            aria-label="Filter export schema by state"
            className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={stateFilter}
            onChange={(event) =>
              setStateFilter(event.target.value as ExportSchemaStateFilter)
            }
          >
            {stateOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-border-subtle bg-bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <AdminStatusBadge tone="info">Read-only</AdminStatusBadge>{" "}
          <span>{visibleSections.length} visible sections</span>
        </div>
      </div>

      <div className="grid items-start xl:grid-cols-[minmax(0,0.78fr)_minmax(460px,1.22fr)]">
        <SchemaSectionList
          hasActiveFilters={hasActiveFilters}
          sections={visibleSections}
          selectedId={selectedSection?.id ?? null}
          onClearFilters={onClearFilters}
          onSelectSection={onSelectSection}
        />
        <SelectedSchemaSection section={selectedSection} />
      </div>
    </section>
  );
}

function ExportSchemaSummary({ metrics }: { metrics: ExportSchemaSummaryMetric[] }) {
  return (
    <dl
      aria-label="Export schema summary"
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

function SchemaSectionList({
  hasActiveFilters,
  sections,
  selectedId,
  onClearFilters,
  onSelectSection,
}: {
  hasActiveFilters: boolean;
  sections: ExportSchemaSection[];
  selectedId: string | null;
  onClearFilters: () => void;
  onSelectSection: (sectionId: string) => void;
}) {
  return (
    <div
      aria-label="Schema section list"
      className="min-w-0 border-b border-border-subtle p-3 xl:border-b-0 xl:border-r"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Schema section list
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Select first, then open source proof.
          </p>
        </div>
        {hasActiveFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2">
        {sections.length ? (
          sections.map((section) => {
            const isSelected = section.id === selectedId;

            return (
              <button
                key={section.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Select ${section.title} schema section`}
                className={cn(
                  "group grid min-w-0 gap-3 rounded-lg border p-3 text-left transition",
                  isSelected
                    ? "border-foreground bg-bg-muted"
                    : "border-border-subtle bg-bg-default hover:bg-bg-muted/60",
                )}
                onClick={() => onSelectSection(section.id)}
              >
                <span className="flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone={section.tone}>
                        {getExportSchemaSectionStateLabel(section)}
                      </AdminStatusBadge>
                      <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {section.recordScope}
                      </span>
                    </span>
                    <span className="mt-2 block break-words text-sm font-semibold text-foreground">
                      {section.title}
                    </span>
                  </span>
                  <ArrowUpRightIcon
                    className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="break-words text-sm leading-5 text-muted-foreground">
                  {section.description}
                </span>
                <span className="flex min-w-0 flex-wrap gap-2">
                  <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {section.sourceLabel}
                  </span>
                  <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {section.fields.length} fields
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-muted/35 p-4 text-sm text-muted-foreground">
            No schema sections match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedSchemaSection({ section }: { section: ExportSchemaSection | null }) {
  if (!section) {
    return (
      <aside
        aria-label="Selected schema section"
        className="p-4 text-sm text-muted-foreground"
      >
        Select a schema section to inspect field contracts and source proof.
      </aside>
    );
  }

  return (
    <aside
      aria-label="Selected schema section"
      className="grid min-w-0 gap-4 bg-bg-muted/25 p-3 sm:p-4"
    >
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
        <div className="grid gap-3 border-b border-border-subtle px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge tone={section.tone}>
                {getExportSchemaSectionStateLabel(section)}
              </AdminStatusBadge>
              <AdminStatusBadge tone="info">{section.sourceLabel}</AdminStatusBadge>
              <AdminStatusBadge tone="clear">{section.recordScope}</AdminStatusBadge>
            </div>
            <h2 className="mt-2 break-words text-lg font-semibold leading-tight text-foreground">
              {section.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {section.description}
            </p>
          </div>
          <Link
            href={section.sourceHref}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            Open source proof
            <ArrowUpRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <dl className="grid gap-0 divide-y divide-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <SectionFact icon={ShieldCheckIcon} label="Value contract">
            {section.valueContract}
          </SectionFact>
          <SectionFact icon={FileJsonIcon} label="Proof">
            {section.proofLabel}
          </SectionFact>
          <SectionFact icon={TablePropertiesIcon} label="Consumer note">
            {section.consumerNote}
          </SectionFact>
        </dl>
      </div>

      <section
        aria-label="Field contract"
        className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm"
      >
        <div className="flex min-w-0 items-start gap-2 border-b border-border-subtle px-4 py-3">
          <TablePropertiesIcon
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Field contract</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Field-level type, requirement, constraint, sample, and validation state.
            </p>
          </div>
        </div>

        <div className="divide-y divide-border-subtle">
          {section.fields.map((field) => (
            <FieldContractRow key={`${section.id}-${field.name}`} field={field} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Privacy boundary
        </p>
        <p className="mt-2 break-words text-sm leading-5 text-foreground">
          {section.privacyBoundary}
        </p>
      </section>
    </aside>
  );
}

function FieldContractRow({ field }: { field: ExportSchemaField }) {
  return (
    <div className="grid min-w-0 gap-3 p-3 lg:grid-cols-[minmax(8rem,0.64fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
      <div className="min-w-0">
        <p className="break-words font-mono text-sm font-semibold text-foreground">
          {field.name}
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap gap-2">
          <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-muted-foreground">
            {field.requirement}
          </span>
          <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs text-muted-foreground">
            {field.validationState}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="break-words text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {field.type}
        </p>
        <p className="mt-1 break-words text-sm leading-5 text-foreground">
          {field.description}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Constraint
        </p>
        <p className="mt-1 break-words text-sm leading-5 text-foreground">
          {field.constraint}
        </p>
        <p className="mt-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Sample
        </p>
        <p className="mt-1 break-words font-mono text-xs leading-5 text-foreground">
          {field.sampleValue}
        </p>
      </div>
    </div>
  );
}

function SectionFact({
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
