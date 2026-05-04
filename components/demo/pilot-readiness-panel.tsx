import { AlertTriangle, CheckCircle2, Info, ShieldCheck } from "lucide-react";

import { SectionHeader } from "@/components/demo/section-header";
import type { SyncSummaryApiResponse } from "@/lib/demo/api-types";
import {
  buildPilotReadinessModel,
  type PilotReadinessMetric,
  type PilotReadinessSeverity,
} from "@/lib/demo/pilot-readiness";
import { cn } from "@/lib/utils";

type PilotReadinessPanelProps = {
  summary: SyncSummaryApiResponse;
};

const severityStyles: Record<
  PilotReadinessSeverity,
  {
    icon: typeof CheckCircle2;
    badgeClassName: string;
  }
> = {
  clear: {
    icon: CheckCircle2,
    badgeClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  },
  watch: {
    icon: ShieldCheck,
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
  },
  attention: {
    icon: AlertTriangle,
    badgeClassName:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200",
  },
};

const metricToneClassNames: Record<PilotReadinessMetric["tone"], string> = {
  clear: "text-emerald-700 dark:text-emerald-300",
  watch: "text-amber-700 dark:text-amber-200",
  attention: "text-rose-700 dark:text-rose-300",
  info: "text-content-emphasis",
};

function ReadinessBadge({ severity }: { severity: PilotReadinessSeverity }) {
  const styles = severityStyles[severity];
  const Icon = styles.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        styles.badgeClassName,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {severity}
    </span>
  );
}

export function PilotReadinessPanel({ summary }: PilotReadinessPanelProps) {
  const model = buildPilotReadinessModel(summary);

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Pilot readiness"
        title={model.title}
        description={model.description}
        actions={<ReadinessBadge severity={model.severity} />}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-content-subtle">
        <Info aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="min-w-0 break-words">{model.windowLabel}</span>
      </div>

      <dl className="mt-4 grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {model.metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 border-t border-border-subtle pt-3"
          >
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
              {metric.label}
            </dt>
            <dd
              className={cn(
                "mt-1 break-words text-2xl font-semibold leading-tight tabular-nums",
                metricToneClassNames[metric.tone],
              )}
            >
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
