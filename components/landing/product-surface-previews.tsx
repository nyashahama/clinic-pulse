import type { ComponentProps } from "react";
import { Database, MapPin, Radio, Search, Smartphone } from "lucide-react";

import {
  ProductRow,
  StatusPill,
} from "@/components/landing/product-preview-primitives";
import { productSurfacePreviewRows } from "@/lib/landing/openpanel-refactor-content";

type PreviewType = keyof typeof productSurfacePreviewRows;
type PreviewTone =
  (typeof productSurfacePreviewRows)[PreviewType][number]["tone"];
type PreviewRow = {
  label: string;
  tone: PreviewTone;
  value: string;
};
type StatusTone = NonNullable<ComponentProps<typeof StatusPill>["tone"]>;

const toneMap: Record<PreviewTone, StatusTone> = {
  critical: "critical",
  warning: "warning",
  healthy: "healthy",
  neutral: "neutral",
} as const;

export function ProductSurfacePreview({
  type,
}: {
  type: PreviewType;
}) {
  switch (type) {
    case "field-report":
      return <FieldReportPreview />;
    case "district-console":
      return <DistrictConsolePreview />;
    case "patient-reroute":
      return <PatientReroutePreview />;
    case "audit-ledger":
      return <AuditLedgerPreview />;
    default: {
      const exhaustiveType: never = type;
      return exhaustiveType;
    }
  }
}

function PreviewRowContent({ row }: { row: PreviewRow }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
      <span className="min-w-0 break-words text-neutral-500 dark:text-muted-foreground">{row.label}</span>
      <StatusPill tone={toneMap[row.tone]}>{row.value}</StatusPill>
    </div>
  );
}

function FieldReportPreview() {
  return (
    <div
      data-motion-layer="true"
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-border dark:bg-muted"
    >
      <div className="mx-auto max-w-[15rem] rounded-2xl border border-neutral-300 bg-white p-2 shadow-sm dark:border-border dark:bg-card">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-950 dark:text-card-foreground">
            <Smartphone className="size-3.5 text-primary" />
            Field report
          </div>
          <span
            data-motion-object="true"
            className="[animation:clinic-soft-blink_2.8s_ease-in-out_infinite]"
          >
            <StatusPill tone="warning">offline</StatusPill>
          </span>
        </div>
        <div className="mt-2 grid gap-2">
          {productSurfacePreviewRows["field-report"].map((row) => (
            <ProductRow key={row.label}>
              <PreviewRowContent row={row} />
            </ProductRow>
          ))}
        </div>
      </div>
    </div>
  );
}

function DistrictConsolePreview() {
  return (
    <div
      data-motion-layer="true"
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-border dark:bg-muted"
    >
      <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-border dark:bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2 dark:border-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-950 dark:text-card-foreground">
            <Radio className="size-3.5 text-primary" />
            District console
          </div>
          <StatusPill tone="healthy">live</StatusPill>
        </div>
        <div className="mt-3 grid gap-2">
          {productSurfacePreviewRows["district-console"].map((row, index) => {
            const isActiveRow = index === 0;

            return (
              <div
                key={row.label}
                data-motion-object={isActiveRow ? "true" : undefined}
                className={
                  isActiveRow
                    ? "[animation:clinic-soft-blink_2.8s_ease-in-out_infinite]"
                    : undefined
                }
              >
                <ProductRow
                  active={isActiveRow}
                  activeTone={toneMap[row.tone]}
                >
                  <PreviewRowContent row={row} />
                </ProductRow>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PatientReroutePreview() {
  return (
    <div
      data-motion-layer="true"
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-border dark:bg-muted"
    >
      <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-border dark:bg-card">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-2 text-xs text-neutral-500 dark:border-border dark:text-muted-foreground">
          <Search className="size-3.5" />
          Mamelodi ARV pickup
        </div>
        <div className="mt-3 grid gap-2">
          {productSurfacePreviewRows["patient-reroute"].map((row, index) => {
            const isActiveRow = index === 0;

            return (
              <div
                key={row.label}
                data-motion-object={isActiveRow ? "true" : undefined}
                className={
                  isActiveRow
                    ? "[animation:clinic-soft-blink_2.8s_ease-in-out_infinite]"
                    : undefined
                }
              >
                <ProductRow
                  active={isActiveRow}
                  activeTone={toneMap[row.tone]}
                >
                  <PreviewRowContent row={row} />
                </ProductRow>
              </div>
            );
          })}
        </div>
        <div
          data-motion-object="true"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white [animation:clinic-soft-blink_2.8s_ease-in-out_infinite]"
        >
          <MapPin className="size-3.5" />
          Open route
        </div>
      </div>
    </div>
  );
}

function AuditLedgerPreview() {
  return (
    <div
      data-motion-layer="true"
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-border dark:bg-muted"
    >
      <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-border dark:bg-card">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-neutral-100 pb-2 dark:border-border">
          <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-neutral-950 dark:text-card-foreground">
            <Database className="size-3.5 shrink-0 text-primary" />
            <span className="min-w-0 break-words">Audit ledger</span>
          </div>
          <StatusPill tone="neutral">recording</StatusPill>
        </div>
        <div className="mt-3 grid gap-2">
          {productSurfacePreviewRows["audit-ledger"].map((row, index, rows) => {
            const isEvidenceRow = index === 1;
            const isFinalRow = index === rows.length - 1;

            return (
              <div
                key={row.label}
                data-motion-object={isEvidenceRow || isFinalRow ? "true" : undefined}
                className={
                  isEvidenceRow || isFinalRow
                    ? "[animation:clinic-soft-blink_2.8s_ease-in-out_infinite]"
                    : undefined
                }
              >
                <ProductRow
                  active={isEvidenceRow}
                  activeTone={toneMap[row.tone]}
                >
                  <PreviewRowContent row={row} />
                </ProductRow>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
