import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  FileJson,
  FileText,
  MapPin,
  Radio,
  ShieldCheck,
  Stethoscope,
  UserRound,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { toClientAuthSession } from "@/lib/auth/session";
import { buildDistrictSeverityQueueViewModel } from "@/lib/demo/district-severity-queue-view-model";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getRecentReportStream } from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";
import { requireDashboardWorkflowAccess } from "../../../workflow-guard";

type DistrictReportEvidencePageProps = {
  params: Promise<{
    reportId: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
};

type EvidenceTone = "clear" | "attention" | "blocked" | "info" | "neutral";

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusTone: Record<string, EvidenceTone> = {
  operational: "clear",
  degraded: "attention",
  non_functional: "blocked",
  unknown: "attention",
};

const sourceLabels: Record<string, string> = {
  clinic_coordinator: "Clinic coordinator",
  demo_control: "Demo control",
  field_worker: "Field worker",
  seed: "Seed state",
};

const toneClassName: Record<EvidenceTone, string> = {
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100",
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  info:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
  neutral: "border-border-subtle bg-bg-muted text-muted-foreground",
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return dateTimeFormatter.format(date);
}

function formatDuration(startValue: string, endValue: string) {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "Unavailable";
  }

  const minutes = Math.max(0, Math.round((end - start) / 60_000));

  if (minutes === 0) {
    return "Same minute";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function sourceLabel(source: string) {
  return sourceLabels[source] ?? formatLabel(source);
}

function returnTarget(from?: string) {
  if (from === "district-severity-queue") {
    return {
      href: "/district/severity-queue",
      label: "Back to severity queue",
    };
  }

  return {
    href: "/district",
    label: "Back to district overview",
  };
}

function pressureTone(kind: "queue" | "staff" | "stock", value: string): EvidenceTone {
  if (
    (kind === "staff" && value === "critical") ||
    (kind === "stock" && value === "stockout") ||
    (kind === "queue" && value === "high")
  ) {
    return "blocked";
  }

  if (
    (kind === "staff" && value === "strained") ||
    (kind === "stock" && value === "low") ||
    (kind === "queue" && value === "moderate")
  ) {
    return "attention";
  }

  if (
    (kind === "staff" && value === "normal") ||
    (kind === "stock" && value === "normal") ||
    (kind === "queue" && value === "low")
  ) {
    return "clear";
  }

  return "info";
}

function payloadForReport(report: {
  clinicId: string;
  facilityCode: string;
  id: string;
  notes: string;
  offlineCreated: boolean;
  queuePressure: string;
  reason: string;
  receivedAt: string;
  reporterName: string;
  source: string;
  staffPressure: string;
  status: string;
  stockPressure: string;
  submittedAt: string;
}) {
  return {
    id: report.id,
    clinicId: report.clinicId,
    facilityCode: report.facilityCode,
    reporterName: report.reporterName,
    source: report.source,
    offlineCreated: report.offlineCreated,
    submittedAt: report.submittedAt,
    receivedAt: report.receivedAt,
    status: report.status,
    reason: report.reason,
    pressure: {
      staff: report.staffPressure,
      stock: report.stockPressure,
      queue: report.queuePressure,
    },
    notes: report.notes,
  };
}

function EvidenceBadge({
  children,
  icon: Icon,
  tone = "neutral",
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: EvidenceTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium capitalize",
        toneClassName[tone],
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-muted text-muted-foreground"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold uppercase tracking-normal text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function EvidencePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function ProvenanceRow({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 gap-3 py-3 first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-muted text-muted-foreground"
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
        {detail ? (
          <dd className="mt-1 break-words text-xs leading-4 text-muted-foreground">
            {detail}
          </dd>
        ) : null}
      </div>
    </div>
  );
}

function SignalRow({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: EvidenceTone;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border",
            toneClassName[tone],
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <dt className="text-sm font-medium text-foreground">{label}</dt>
          <dd className="mt-1 text-xs leading-4 text-muted-foreground">{detail}</dd>
        </div>
      </div>
      <dd className="shrink-0 rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs font-medium capitalize text-foreground">
        {value}
      </dd>
    </div>
  );
}

function TimelineItem({
  detail,
  icon: Icon,
  time,
  title,
}: {
  detail: string;
  icon: LucideIcon;
  time: string;
  title: string;
}) {
  return (
    <li className="relative pb-5 pl-8 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 inline-flex size-6 items-center justify-center rounded-md border border-border-subtle bg-bg-default text-muted-foreground"
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-4 text-muted-foreground">{detail}</p>
        <p className="mt-1 text-xs font-medium text-content-default">{time}</p>
      </div>
    </li>
  );
}

export default async function DistrictReportEvidencePage({
  params,
  searchParams,
}: DistrictReportEvidencePageProps) {
  const session = await requireDashboardWorkflowAccess("district");
  const clientSession = toClientAuthSession(session);

  const [{ reportId }, query] = await Promise.all([params, searchParams]);
  const decodedReportId = decodeURIComponent(reportId);
  const state = createInitialDemoState();
  const report = getRecentReportStream(state).find((item) => item.id === decodedReportId);

  if (!report) {
    notFound();
  }

  const target = returnTarget(query.from);
  const clinicHref = `/district/clinics/${encodeURIComponent(
    report.clinicId,
  )}?from=district-severity-queue`;
  const severityView = buildDistrictSeverityQueueViewModel({
    filters: {
      alertState: "all",
      freshness: "all",
      offlineState: "all",
      service: "all",
      status: "all",
    },
    selectedClinicId: report.clinicId,
    session: clientSession,
    state,
  });
  const decision = severityView.selectedAction;
  const payload = payloadForReport(report);
  const syncDelay = formatDuration(report.submittedAt, report.receivedAt);
  const isOfflineEvidence = report.offlineCreated;
  const recommendation =
    decision?.recommendedAction ??
    "Confirm the signal, update the clinic status, and keep the queue owner informed.";
  const patientImpact =
    decision?.patientImpact ??
    `${report.clinicName} reported ${formatLabel(report.status)} service state. Confirm whether patient routing or district escalation is required.`;

  return (
    <div className="space-y-4">
      <Link
        href={target.href}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
      >
        <ArrowLeft aria-hidden="true" />
        <span>{target.label}</span>
      </Link>

      <EvidencePanel>
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              District evidence
            </p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight text-foreground">
              Report evidence
            </h1>
            <p className="mt-2 break-words text-lg font-medium leading-6 text-content-emphasis">
              {report.clinicName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {report.facilityCode} - Received {formatDateTime(report.receivedAt)}
            </p>
          </div>

          <div className="flex max-w-full flex-wrap gap-2 lg:justify-end">
            <EvidenceBadge tone={statusTone[report.status] ?? "info"} icon={Activity}>
              {formatLabel(report.status)}
            </EvidenceBadge>
            <EvidenceBadge tone="info" icon={Radio}>
              {sourceLabel(report.source)}
            </EvidenceBadge>
            <EvidenceBadge tone={isOfflineEvidence ? "attention" : "clear"} icon={WifiOff}>
              {isOfflineEvidence ? "Offline synced" : "Online report"}
            </EvidenceBadge>
          </div>
        </div>
      </EvidencePanel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <EvidencePanel>
            <SectionHeader
              icon={FileText}
              title="What happened"
              description="The latest report attached to this queue decision."
            />
            <div className="mt-5 space-y-4">
              <p className="break-words text-xl font-semibold leading-7 text-foreground">
                {report.reason}
              </p>
              <div className="border-t border-border-subtle pt-4">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Report notes
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-content-default">
                  {report.notes}
                </p>
              </div>
            </div>
          </EvidencePanel>

          <EvidencePanel>
            <SectionHeader
              icon={ClipboardCheck}
              title="Decision context"
              description="Why this evidence is visible from the severity queue."
            />
            <div className="mt-5 divide-y divide-border-subtle border-y border-border-subtle">
              <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)]">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Queue decision
                </p>
                <p className="break-words text-base font-semibold leading-6 text-foreground">
                  {recommendation}
                </p>
              </div>
              <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)]">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Patient impact
                </p>
                <p className="break-words text-sm leading-6 text-content-default">
                  {patientImpact}
                </p>
              </div>
              <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)]">
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Alternative capacity
                </p>
                <p className="text-sm leading-6 text-content-default">
                  {decision
                    ? `${decision.availableAlternatives} alternatives available from the current queue model.`
                    : "Alternative capacity is unavailable for this report."}
                </p>
              </div>
            </div>
          </EvidencePanel>

          <EvidencePanel>
            <SectionHeader
              icon={Clock3}
              title="Evidence timeline"
              description="The report path from field submission to district review."
            />
            <ol className="relative mt-5 border-l border-border-subtle">
              <TimelineItem
                icon={UserRound}
                title="Submitted by reporter"
                detail={`${report.reporterName} submitted from ${sourceLabel(report.source)}.`}
                time={formatDateTime(report.submittedAt)}
              />
              <TimelineItem
                icon={Radio}
                title="Received by district queue"
                detail={`${syncDelay} after submission${isOfflineEvidence ? "; created offline and synced later" : ""}.`}
                time={formatDateTime(report.receivedAt)}
              />
              <TimelineItem
                icon={ClipboardCheck}
                title="Attached to severity queue"
                detail={`${report.clinicName} uses this evidence in the current district decision context.`}
                time="Current scenario state"
              />
            </ol>
          </EvidencePanel>

          <details className="group rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-foreground sm:px-5">
              <span className="inline-flex min-w-0 items-center gap-2">
                <FileJson aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span>Technical payload</span>
              </span>
              <span className="text-xs font-medium text-muted-foreground group-open:hidden">
                Collapsed
              </span>
              <span className="hidden text-xs font-medium text-muted-foreground group-open:inline">
                Expanded
              </span>
            </summary>
            <div className="border-t border-border-subtle px-4 pb-4 sm:px-5">
              <pre className="mt-4 max-h-[28rem] overflow-auto rounded-md bg-bg-muted p-3 text-xs leading-5 text-content-default">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </details>
        </div>

        <aside className="space-y-4">
          <EvidencePanel>
            <SectionHeader
              icon={ShieldCheck}
              title="Trust and provenance"
              description="Source metadata for validating the signal."
            />
            <dl className="mt-5 divide-y divide-border-subtle">
              <ProvenanceRow
                icon={UserRound}
                label="Reporter"
                value={report.reporterName}
                detail={sourceLabel(report.source)}
              />
              <ProvenanceRow
                icon={MapPin}
                label="Clinic"
                value={report.clinicName}
                detail={report.facilityCode}
              />
              <ProvenanceRow
                icon={Clock3}
                label="Received"
                value={formatDateTime(report.receivedAt)}
                detail={`${syncDelay} after submission`}
              />
              <ProvenanceRow
                icon={WifiOff}
                label="Sync state"
                value={isOfflineEvidence ? "Offline synced" : "Online report"}
                detail={
                  isOfflineEvidence
                    ? "Captured before connectivity returned."
                    : "Received without offline backlog."
                }
              />
            </dl>
          </EvidencePanel>

          <EvidencePanel>
            <SectionHeader
              icon={Stethoscope}
              title="Operational signals"
              description="Pressure indicators carried by this report."
            />
            <dl className="mt-5 divide-y divide-border-subtle">
              <SignalRow
                icon={AlertTriangle}
                label="Staff pressure"
                value={formatLabel(report.staffPressure)}
                tone={pressureTone("staff", report.staffPressure)}
                detail="Capacity available to keep service lines running."
              />
              <SignalRow
                icon={ShieldCheck}
                label="Stock pressure"
                value={formatLabel(report.stockPressure)}
                tone={pressureTone("stock", report.stockPressure)}
                detail="Availability of medicine, vaccine, or consumable stock."
              />
              <SignalRow
                icon={Activity}
                label="Queue pressure"
                value={formatLabel(report.queuePressure)}
                tone={pressureTone("queue", report.queuePressure)}
                detail="Patient flow pressure reported by the field signal."
              />
            </dl>
          </EvidencePanel>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Link
              href={clinicHref}
              className={cn(buttonVariants({ size: "sm" }), "justify-between")}
            >
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                Open clinic detail
              </span>
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
            <Link
              href={target.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "justify-between",
              )}
            >
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                Return to queue
              </span>
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
