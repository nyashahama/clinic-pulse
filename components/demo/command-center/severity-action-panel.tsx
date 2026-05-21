import Link from "next/link";
import type { ReactNode } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRight,
  FileText,
  MapPin,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type {
  DistrictSeverityQueueViewModel,
  DistrictSeveritySelectedAction,
} from "@/lib/demo/district-severity-queue-view-model";
import { cn } from "@/lib/utils";

type SeverityActionPanelProps = {
  selectedItem: DistrictSeverityQueueViewModel["selectedItem"];
  selectedAction: DistrictSeveritySelectedAction | null;
};

type SeverityTone = NonNullable<
  DistrictSeverityQueueViewModel["selectedItem"]
>["severityLabel"];

const nextStepToneClassName: Record<
  SeverityTone,
  {
    callout: string;
    icon: string;
  }
> = {
  critical: {
    callout: "border-l-red-400 dark:border-l-red-700",
    icon: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100",
  },
  attention: {
    callout: "border-l-amber-300 dark:border-l-amber-700",
    icon: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  },
  watch: {
    callout: "border-l-sky-300 dark:border-l-sky-700",
    icon: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
  },
  stable: {
    callout: "border-l-emerald-300 dark:border-l-emerald-700",
    icon: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  },
};

export function SeverityActionPanel({
  selectedAction,
  selectedItem,
}: SeverityActionPanelProps) {
  if (!selectedItem || !selectedAction) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Selected clinic decision
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">No clinic selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Select a queue item to review recommended action, verification need, and evidence links.
        </p>
      </section>
    );
  }

  const primaryReport = selectedAction.reportLinks[0] ?? null;
  const nextStepTone = nextStepToneClassName[selectedItem.severityLabel];

  return (
    <section
      className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm"
      data-district-severity-action
    >
      <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Selected clinic decision
          </p>
          <h2 className="mt-1 break-words text-base font-semibold leading-tight text-foreground">
            {selectedItem.clinicName}
          </h2>
        </div>
        <div className="flex h-7 shrink-0 items-center gap-1.5 self-start rounded-md border border-border-subtle bg-bg-muted px-2">
          <ActivityIcon className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Score</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {selectedItem.score}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <PostureChip tone={selectedItem.severityLabel}>
          {selectedItem.severityLabel}
        </PostureChip>
        <PostureChip>{formatLabel(selectedItem.status)}</PostureChip>
        {selectedItem.hasActiveAlert ? (
          <PostureChip tone="attention">active alert</PostureChip>
        ) : null}
        {selectedItem.isInOfflineQueue ? (
          <PostureChip tone="info">offline queue</PostureChip>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-3 rounded-md border border-border-subtle border-l-2 bg-bg-muted/60 p-2.5",
          nextStepTone.callout,
        )}
        data-district-severity-next-step
        data-tone={selectedItem.severityLabel}
      >
        <div className="flex min-w-0 gap-2.5">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border",
              nextStepTone.icon,
            )}
          >
            <AlertTriangleIcon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Next step
            </p>
            <p className="mt-0.5 break-words text-sm font-medium leading-5 text-foreground">
              {selectedAction.recommendedAction}
            </p>
          </div>
        </div>
      </div>

      <BriefSection title="Patient impact" className="mt-4">
        <p className="break-words text-sm leading-5 text-muted-foreground">
          {selectedAction.patientImpact}
        </p>
      </BriefSection>

      <BriefSection title="Evidence" className="mt-4">
        {primaryReport ? (
          <Link
            className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-2.5 rounded-md border border-border-subtle bg-bg-muted/60 p-2.5 text-left transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={primaryReport.href}
          >
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-border-subtle bg-bg-default text-muted-foreground"
            >
              <FileText className="size-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block break-words text-sm font-medium text-foreground">
                {primaryReport.label}
              </span>
              <span className="mt-0.5 block break-words text-xs leading-4 text-muted-foreground">
                {primaryReport.detail}
              </span>
            </span>
            <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <div className="rounded-md border border-dashed border-border-subtle p-3 text-sm text-muted-foreground">
            <FileText className="mb-2 size-4" />
            No recent report evidence is attached to this clinic in the current scenario state.
          </div>
        )}
      </BriefSection>

      <div className="mt-4 grid gap-2 border-t border-border-subtle pt-3 sm:grid-cols-2">
        <Link
          className={cn(
            buttonVariants({ size: "sm" }),
            "justify-between",
          )}
          href={selectedAction.clinicHref}
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5" />
            Open clinic detail
          </span>
          <ArrowRight className="size-3.5" />
        </Link>
        {primaryReport ? (
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "justify-between",
            )}
            href={primaryReport.href}
          >
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <FileText className="size-3.5" />
              View report evidence
            </span>
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function BriefSection({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function PostureChip({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "critical" | "attention" | "watch" | "stable" | "info" | "neutral";
}) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        tone === "critical" &&
          "border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100",
        tone === "attention" &&
          "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
        tone === "watch" &&
          "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
        tone === "stable" &&
          "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
        tone === "info" &&
          "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
        tone === "neutral" && "border-border-subtle bg-bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
