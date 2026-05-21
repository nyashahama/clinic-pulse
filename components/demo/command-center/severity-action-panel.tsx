import Link from "next/link";
import type { ReactNode } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRight,
  CheckCircle2Icon,
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
          Situation brief
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">No clinic selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Select a queue item to review recommended action, verification need, and evidence links.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
      data-district-severity-action
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Situation brief
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

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-amber-200 bg-background/70 dark:border-amber-900/60 dark:bg-background/10">
            <AlertTriangleIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-current/70">
              Recommended next move
            </p>
            <p className="mt-1 break-words text-sm font-semibold leading-5">
              {selectedAction.recommendedAction}
            </p>
          </div>
        </div>
      </div>

      <BriefSection title="Why this clinic is in queue" className="mt-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <SignalDriver
            icon={<ActivityIcon className="size-3.5" />}
            label="Service state"
            tone={selectedItem.status === "operational" ? "clear" : "attention"}
            value={formatLabel(selectedItem.status)}
          />
          <SignalDriver
            icon={<RadioTowerIcon className="size-3.5" />}
            label="Alert state"
            tone={selectedItem.hasActiveAlert ? "attention" : "clear"}
            value={selectedItem.hasActiveAlert ? "Active alert" : "No active alert"}
          />
          <SignalDriver
            icon={<ClipboardCheckIcon className="size-3.5" />}
            label="Evidence freshness"
            tone={selectedItem.freshness === "fresh" ? "clear" : "attention"}
            value={formatLabel(selectedItem.freshness)}
          />
          <SignalDriver
            icon={<RouteIcon className="size-3.5" />}
            label="Alternative capacity"
            tone={selectedAction.availableAlternatives > 0 ? "clear" : "blocked"}
            value={`${selectedAction.availableAlternatives} alternatives`}
          />
        </div>
      </BriefSection>

      <BriefSection title="Patient impact" className="mt-4">
        <p className="break-words text-sm leading-5 text-muted-foreground">
          {selectedAction.patientImpact}
        </p>
      </BriefSection>

      <BriefSection title="Verification needed" className="mt-4">
        <div className="flex min-w-0 gap-2 rounded-md border border-border-subtle bg-bg-muted p-3">
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="break-words text-sm leading-5 text-foreground">
            {selectedAction.verificationNeed}
          </p>
        </div>
      </BriefSection>

      <BriefSection title="Evidence trail" className="mt-4">
        {selectedAction.reportLinks.length ? (
          <div className="grid gap-2">
            {selectedAction.reportLinks.map((report) => (
              <Link
                key={report.id}
                className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-md border border-border-subtle bg-bg-muted p-3 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={report.href}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex size-7 items-center justify-center rounded-md border border-border-subtle bg-bg-default text-muted-foreground"
                >
                  <FileText className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium text-foreground">
                    {report.label}
                  </span>
                  <span className="mt-0.5 block break-words text-xs leading-4 text-muted-foreground">
                    {report.detail}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border-subtle p-3 text-sm text-muted-foreground">
            <FileText className="mb-2 size-4" />
            No recent report evidence is attached to this clinic in the current scenario state.
          </div>
        )}
      </BriefSection>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <Link
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full justify-between",
          )}
          href={selectedAction.clinicHref}
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5" />
            Open clinic detail
          </span>
          <ArrowRight className="size-3.5" />
        </Link>
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

function SignalDriver({
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
    <div className="min-w-0 rounded-md border border-border-subtle bg-bg-muted p-3">
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
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 break-words text-sm font-semibold capitalize text-foreground">
            {value}
          </p>
        </div>
      </div>
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
