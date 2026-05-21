import Link from "next/link";
import type { ReactNode } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRight,
  CheckCircle2Icon,
  Clock3Icon,
  ClipboardCheckIcon,
  FileText,
  MapPin,
  RadioTowerIcon,
  RouteIcon,
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

export function SeverityActionPanel({
  selectedAction,
  selectedItem,
}: SeverityActionPanelProps) {
  if (!selectedItem || !selectedAction) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Clinic command brief
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">No clinic selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Select a queue item to review recommended action, verification need, and evidence links.
        </p>
      </section>
    );
  }

  const primaryReport = selectedAction.reportLinks[0] ?? null;
  const primaryEvidence = primaryReport ? splitEvidenceDetail(primaryReport.detail) : null;

  return (
    <section
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
      data-district-severity-action
    >
      <div className="border-b border-border-subtle p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Clinic command brief
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
              {selectedItem.clinicName}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-md border border-border-subtle bg-bg-muted px-2 py-1">
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
      </div>

      <div className="border-b border-border-subtle bg-amber-50/35 px-4 py-3 text-amber-950 dark:bg-amber-950/15 dark:text-amber-100">
        <div className="flex min-w-0 gap-3">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-normal text-current/70">
              Next action
            </p>
            <p className="break-words text-sm font-semibold leading-5">
              {selectedAction.recommendedAction}
            </p>
            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-current/75">
              <span>Owner: District manager</span>
              <span>
                Evidence: {primaryEvidence?.timestamp ?? "No report attached"}
              </span>
              <span>{selectedAction.availableAlternatives} alternatives</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <BriefSection title="Signal summary">
          <div className="overflow-hidden rounded-md border border-border-subtle">
            <SignalRow
              icon={<ActivityIcon className="size-3.5" />}
              label="Service"
              tone={selectedItem.status === "operational" ? "clear" : "attention"}
              value={formatLabel(selectedItem.status)}
            />
            <SignalRow
              icon={<RadioTowerIcon className="size-3.5" />}
              label="Alert"
              tone={selectedItem.hasActiveAlert ? "attention" : "clear"}
              value={selectedItem.hasActiveAlert ? "Active alert" : "No active alert"}
            />
            <SignalRow
              icon={<ClipboardCheckIcon className="size-3.5" />}
              label="Freshness"
              tone={selectedItem.freshness === "fresh" ? "clear" : "attention"}
              value={formatLabel(selectedItem.freshness)}
            />
            <SignalRow
              icon={<RouteIcon className="size-3.5" />}
              label="Capacity"
              tone={selectedAction.availableAlternatives > 0 ? "clear" : "blocked"}
              value={`${selectedAction.availableAlternatives} alternatives`}
            />
          </div>
        </BriefSection>

        <BriefSection title="Patient impact">
          <p className="break-words text-sm leading-5 text-muted-foreground">
            {selectedAction.patientImpact}
          </p>
        </BriefSection>

        <BriefSection title="Operational timeline">
          <div className="relative grid gap-3 before:absolute before:left-[0.45rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border-subtle">
            {primaryReport ? (
              <TimelineEntry
                detail={primaryEvidence?.source}
                href={primaryReport.href}
                icon={<FileText className="size-3.5" />}
                label={primaryReport.label}
                time={primaryEvidence?.timestamp ?? "Latest evidence"}
              />
            ) : (
              <TimelineEntry
                detail="No report evidence is attached to this clinic in the current scenario state."
                icon={<FileText className="size-3.5" />}
                label="No evidence attached"
                time="Evidence"
              />
            )}
            <TimelineEntry
              detail={selectedAction.verificationNeed}
              icon={<CheckCircle2Icon className="size-3.5" />}
              label="Verification needed"
              time="Pending"
            />
          </div>
        </BriefSection>

        <div className="grid gap-2 border-t border-border-subtle pt-4 sm:grid-cols-2">
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
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
                buttonVariants({ size: "sm" }),
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

function SignalRow({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: "attention" | "blocked" | "clear";
  value: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(6rem,0.55fr)_minmax(0,1fr)] items-center gap-3 border-b border-border-subtle bg-bg-muted px-3 py-2.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-md border",
            tone === "clear" &&
              "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
            tone === "attention" &&
              "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
            tone === "blocked" &&
              "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
          )}
        >
          {icon}
        </span>
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="break-words text-sm font-semibold capitalize text-foreground">
        {value}
      </p>
    </div>
  );
}

function TimelineEntry({
  detail,
  href,
  icon,
  label,
  time,
}: {
  detail?: string;
  href?: string;
  icon: ReactNode;
  label: string;
  time: string;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="relative z-10 mt-1 inline-flex size-4 items-center justify-center rounded-full border border-border-subtle bg-bg-default text-muted-foreground"
      >
        <Clock3Icon className="size-2.5" />
      </span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon}
          <span className="truncate">{time}</span>
        </span>
        <span className="mt-1 block break-words text-sm font-semibold text-foreground">
          {label}
        </span>
        {detail ? (
          <span className="mt-0.5 block break-words text-xs leading-4 text-muted-foreground">
            {detail}
          </span>
        ) : null}
      </span>
      {href ? (
        <ArrowRight className="mt-5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        className="group grid min-w-0 grid-cols-[1rem_minmax(0,1fr)_auto] gap-3 rounded-md p-1.5 transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        href={href}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-[1rem_minmax(0,1fr)] gap-3 p-1.5">
      {content}
    </div>
  );
}

function splitEvidenceDetail(detail: string) {
  const [source, ...timestampParts] = detail.split(" - ");
  const timestamp = timestampParts.join(" - ");

  return {
    source: source || detail,
    timestamp: timestamp || detail,
  };
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
