import type { ComponentProps } from "react";
import { MapPin, Radio, Search, Smartphone } from "lucide-react";

import {
  ProductRow,
  StatusPill,
} from "@/components/landing/product-preview-primitives";
import { productSurfacePreviewRows } from "@/lib/landing/openpanel-refactor-content";

type PreviewType = keyof typeof productSurfacePreviewRows;
type PreviewTone =
  (typeof productSurfacePreviewRows)[PreviewType][number]["tone"];
type StatusTone = NonNullable<ComponentProps<typeof StatusPill>["tone"]>;

const toneMap: Record<PreviewTone, StatusTone> = {
  critical: "critical",
  warning: "warning",
  healthy: "healthy",
  neutral: "neutral",
} as const;

export function ProductSurfacePreview({ type }: { type: PreviewType }) {
  if (type === "field-report") {
    return <FieldReportPreview />;
  }

  if (type === "district-console") {
    return <DistrictConsolePreview />;
  }

  return <PatientReroutePreview />;
}

function FieldReportPreview() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="mx-auto max-w-[15rem] rounded-2xl border border-neutral-300 bg-white p-2 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-950">
            <Smartphone className="size-3.5 text-primary" />
            Field report
          </div>
          <StatusPill tone="warning">offline</StatusPill>
        </div>
        <div className="mt-2 grid gap-2">
          {productSurfacePreviewRows["field-report"].map((row) => (
            <ProductRow key={row.label}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-500">{row.label}</span>
                <StatusPill tone={toneMap[row.tone]}>{row.value}</StatusPill>
              </div>
            </ProductRow>
          ))}
        </div>
      </div>
    </div>
  );
}

function DistrictConsolePreview() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-950">
            <Radio className="size-3.5 text-primary" />
            District console
          </div>
          <StatusPill tone="healthy">live</StatusPill>
        </div>
        <div className="mt-3 grid gap-2">
          {productSurfacePreviewRows["district-console"].map((row, index) => (
            <ProductRow key={row.label} active={index === 0}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-500">{row.label}</span>
                <StatusPill tone={toneMap[row.tone]}>{row.value}</StatusPill>
              </div>
            </ProductRow>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatientReroutePreview() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-2 text-xs text-neutral-500">
          <Search className="size-3.5" />
          Mamelodi ARV pickup
        </div>
        <div className="mt-3 grid gap-2">
          {productSurfacePreviewRows["patient-reroute"].map((row, index) => (
            <ProductRow key={row.label} active={index === 0}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-500">{row.label}</span>
                <StatusPill tone={toneMap[row.tone]}>{row.value}</StatusPill>
              </div>
            </ProductRow>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white">
          <MapPin className="size-3.5" />
          Open route
        </div>
      </div>
    </div>
  );
}
