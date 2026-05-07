"use client";

import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  Radio,
  Webhook,
} from "lucide-react";

import { SectionHeader } from "@/components/demo/section-header";
import {
  incidentReplaySteps,
  type IncidentReplayStepId,
  type IncidentReplayWebhookPreview,
} from "@/lib/demo/incident-replay";
import { cn } from "@/lib/utils";

type IncidentReplayPanelStatus = "idle" | "running" | "complete";

export type IncidentReplayPanelProps = {
  status: IncidentReplayPanelStatus;
  activeStepId: IncidentReplayStepId | null;
  completedStepIds: IncidentReplayStepId[];
  completedAtByStepId: Partial<Record<IncidentReplayStepId, string>>;
  webhookPreview: IncidentReplayWebhookPreview | null;
};

type ReplayStepVisualState = "queued" | "live" | "complete";

const stepToneClassNames: Record<ReplayStepVisualState, string> = {
  queued:
    "border-border-subtle bg-bg-subtle text-content-subtle",
  live: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100",
  complete:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStepVisualState({
  stepId,
  activeStepId,
  completedStepIds,
}: Pick<
  IncidentReplayPanelProps,
  "activeStepId" | "completedStepIds"
> & {
  stepId: IncidentReplayStepId;
}): ReplayStepVisualState {
  if (completedStepIds.includes(stepId)) {
    return "complete";
  }

  if (activeStepId === stepId) {
    return "live";
  }

  return "queued";
}

function StepStateIcon({ state }: { state: ReplayStepVisualState }) {
  if (state === "complete") {
    return <CheckCircle2 aria-hidden="true" className="size-4" />;
  }

  if (state === "live") {
    return <Radio aria-hidden="true" className="size-4" />;
  }

  return <CircleDashed aria-hidden="true" className="size-4" />;
}

function StepStateLabel({ state }: { state: ReplayStepVisualState }) {
  if (state === "complete") {
    return "Complete";
  }

  if (state === "live") {
    return "Live";
  }

  return "Queued";
}

export function IncidentReplayPanel({
  status,
  activeStepId,
  completedStepIds,
  completedAtByStepId,
  webhookPreview,
}: IncidentReplayPanelProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Simulation timeline"
        title="Incident replay"
        description="Trace each deterministic replay step from field report through Partner webhook delivery."
      />

      <div className="mt-4 grid gap-3">
        {incidentReplaySteps.map((step, index) => {
          const stepState = getStepVisualState({
            stepId: step.id,
            activeStepId,
            completedStepIds,
          });
          const completedAt = formatTimestamp(completedAtByStepId[step.id]);

          return (
            <article
              key={step.id}
              className={cn(
                "grid gap-3 rounded-lg border p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center",
                stepToneClassNames[stepState],
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full border border-current/20 bg-white/70">
                  <StepStateIcon state={stepState} />
                </span>
                <span className="rounded-md border border-current/15 bg-white/70 px-2 py-1 font-mono text-[11px] font-semibold">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-content-emphasis">{step.title}</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-current/15 bg-white/70 px-2 py-1 text-[11px] font-medium">
                    <StepStateLabel state={stepState} />
                  </span>
                </div>
                <p className="mt-1 text-xs text-content-subtle">
                  {Math.round(step.durationMs / 100) / 10}s planned duration
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs text-content-subtle md:justify-end">
                <Clock3 aria-hidden="true" className="size-3.5" />
                <span>{completedAt ? completedAt : stepState === "live" ? "In progress" : "Pending"}</span>
              </div>
            </article>
          );
        })}
      </div>

      {webhookPreview ? (
        <div className="mt-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Partner webhook
              </p>
              <h3 className="mt-1 text-sm font-semibold text-content-emphasis">
                Delivered preview
              </h3>
              <p className="mt-1 text-sm text-content-default">{webhookPreview.summary}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
              <Webhook aria-hidden="true" className="size-3.5" />
              {webhookPreview.deliveryStatus}
            </span>
          </div>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-md border border-border-subtle bg-bg-default p-3">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Clinic
              </dt>
              <dd className="mt-1 font-semibold text-content-emphasis">
                {webhookPreview.clinic.name}
              </dd>
              <dd className="text-xs text-content-subtle">
                {webhookPreview.clinic.facilityCode}
              </dd>
            </div>
            <div className="rounded-md border border-border-subtle bg-bg-default p-3">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Delivered at
              </dt>
              <dd className="mt-1 font-semibold text-content-emphasis">
                {formatTimestamp(webhookPreview.deliveredAt) ?? webhookPreview.deliveredAt}
              </dd>
              <dd className="text-xs text-content-subtle">{webhookPreview.status}</dd>
            </div>
            <div className="rounded-md border border-border-subtle bg-bg-default p-3 md:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Reason
              </dt>
              <dd className="mt-1 text-content-default">{webhookPreview.reason}</dd>
            </div>
            <div className="rounded-md border border-border-subtle bg-bg-default p-3 md:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Recommended alternative
              </dt>
              <dd className="mt-1 text-content-default">
                {webhookPreview.recommendedAlternative
                  ? `${webhookPreview.recommendedAlternative.name} (${webhookPreview.recommendedAlternative.facilityCode})`
                  : "No alternative clinic available"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
