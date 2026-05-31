import Link from "next/link";
import type { ReactNode } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRight,
  BadgeCheckIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileText,
  Mail,
  MapPin,
  RadioTowerIcon,
  RotateCcwIcon,
  UserRound,
  WifiOffIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type {
  EvidenceCommandAction,
  EvidenceCommandChip,
  EvidenceCommandDecision,
  EvidenceCommandEvidenceLink,
  EvidenceCommandField,
  EvidenceCommandMetric,
  EvidenceCommandSection,
  EvidenceCommandTimelineItem,
  EvidenceCommandTone,
} from "@/lib/product/evidence-command";
import { cn } from "@/lib/utils";

const toneChipClassName: Record<EvidenceCommandTone, string> = {
  critical:
    "border-red-200 bg-red-50 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  watch:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
  stable:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  info:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
  neutral: "border-border-subtle bg-bg-muted text-muted-foreground",
};

const toneSoftClassName: Record<EvidenceCommandTone, string> = {
  critical:
    "border-red-200/80 bg-red-50/45 text-red-950 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-100",
  attention:
    "border-amber-200/80 bg-amber-50/45 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100",
  watch:
    "border-sky-200/80 bg-sky-50/45 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-100",
  stable:
    "border-emerald-200/80 bg-emerald-50/45 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100",
  info:
    "border-sky-200/80 bg-sky-50/45 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-100",
  neutral: "border-border-subtle bg-bg-muted text-muted-foreground",
};

const toneRailClassName: Record<EvidenceCommandTone, string> = {
  critical: "bg-red-500",
  attention: "bg-amber-500",
  watch: "bg-sky-500",
  stable: "bg-emerald-500",
  info: "bg-sky-500",
  neutral: "bg-muted-foreground/45",
};

const toneCalloutClassName: Record<EvidenceCommandTone, string> = {
  critical: "border-l-red-400 dark:border-l-red-700",
  attention: "border-l-amber-300 dark:border-l-amber-700",
  watch: "border-l-sky-300 dark:border-l-sky-700",
  stable: "border-l-emerald-300 dark:border-l-emerald-700",
  info: "border-l-sky-300 dark:border-l-sky-700",
  neutral: "border-l-muted-foreground/40",
};

function EvidenceToneIcon({
  icon,
  tone,
}: {
  icon?: EvidenceCommandMetric["icon"];
  tone: EvidenceCommandTone;
}) {
  const iconClassName = "size-4";

  if (icon === "clock") {
    return <Clock3Icon className={iconClassName} />;
  }

  if (icon === "mail") {
    return <Mail className={iconClassName} />;
  }

  if (icon === "user") {
    return <UserRound className={iconClassName} />;
  }

  if (icon === "offline") {
    return <WifiOffIcon className={iconClassName} />;
  }

  if (icon === "radio") {
    return <RadioTowerIcon className={iconClassName} />;
  }

  if (icon === "check") {
    return <BadgeCheckIcon className={iconClassName} />;
  }

  if (tone === "stable") {
    return <CheckCircle2Icon className={iconClassName} />;
  }

  if (icon === "alert" || tone === "critical" || tone === "attention") {
    return <AlertTriangleIcon className={iconClassName} />;
  }

  return <ActivityIcon className={iconClassName} />;
}

function EvidenceActionIcon({ icon }: { icon: EvidenceCommandAction["icon"] }) {
  const iconClassName = "size-3.5";

  if (icon === "clinic") {
    return <MapPin className={iconClassName} />;
  }

  if (icon === "mail") {
    return <Mail className={iconClassName} />;
  }

  if (icon === "queue") {
    return <RotateCcwIcon className={iconClassName} />;
  }

  if (icon === "stream") {
    return <RadioTowerIcon className={iconClassName} />;
  }

  return <FileText className={iconClassName} />;
}

export function EvidenceCommandChip({
  chip,
  className,
}: {
  chip: EvidenceCommandChip;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        toneChipClassName[chip.tone ?? "neutral"],
        className,
      )}
    >
      {chip.label}
    </span>
  );
}

export function EvidenceCommandHeader({
  actions,
  children,
  description,
  eyebrow,
  title,
}: {
  actions?: EvidenceCommandAction[];
  children?: ReactNode;
  description: ReactNode;
  eyebrow: ReactNode;
  title: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-default px-4 py-4 text-content-default shadow-sm sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-1 break-words text-xl font-semibold leading-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-4xl break-words text-sm leading-5 text-muted-foreground">
            {description}
          </p>
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
        {actions?.length ? (
          <div className="flex min-w-0 flex-wrap gap-2 lg:justify-end">
            {actions.map((action) => (
              <EvidenceCommandActionLink action={action} key={action.label} compact />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function EvidenceCommandMetricStrip({
  ariaLabel = "Evidence command signals",
  metrics,
}: {
  ariaLabel?: string;
  metrics: EvidenceCommandMetric[];
}) {
  return (
    <section
      aria-label={ariaLabel}
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <div className={cn("h-1", toneRailClassName[metric.tone])} aria-hidden="true" />
          <div className="grid min-h-[6.25rem] gap-3 p-4">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {metric.label}
              </p>
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-md border",
                  toneSoftClassName[metric.tone],
                )}
              >
                <EvidenceToneIcon icon={metric.icon} tone={metric.tone} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="break-words text-xl font-semibold leading-tight text-foreground">
                {metric.value}
              </p>
              <p className="mt-2 break-words text-xs leading-4 text-muted-foreground">
                {metric.detail}
              </p>
            </div>
            {metric.href && metric.actionLabel ? (
              <Link
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "mt-auto justify-between gap-1.5",
                )}
                href={metric.href}
              >
                {metric.actionLabel}
                <ArrowRight className="size-3.5" />
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}

export function EvidencePacketPanel({
  description,
  fields,
  title,
}: {
  description: string;
  fields: EvidenceCommandField[];
  title: string;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
      <div className="border-b border-border-subtle bg-bg-muted/60 px-3 py-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</p>
      </div>
      <dl className="divide-y divide-border-subtle">
        {fields.map((field) => (
          <div
            className="grid min-w-0 gap-1 px-3 py-3 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-4"
            key={field.label}
          >
            <dt className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {field.label}
            </dt>
            <dd
              className={cn(
                "min-w-0 break-words text-sm text-foreground",
                field.emphasis ? "font-medium" : "font-normal",
              )}
            >
              {field.tone ? (
                <EvidenceCommandChip chip={{ label: field.value, tone: field.tone }} />
              ) : field.href ? (
                <Link
                  className="break-words underline-offset-4 hover:underline"
                  href={field.href}
                >
                  {field.value}
                </Link>
              ) : (
                field.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function EvidenceCaseBriefPanel({
  description,
  primaryFields,
  sections,
  summary,
  title,
}: {
  description: string;
  primaryFields: EvidenceCommandField[];
  sections: EvidenceCommandSection[];
  summary: EvidenceCommandField;
  title: string;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs leading-4 text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4 p-4">
        <div
          className={cn(
            "rounded-md border border-border-subtle border-l-2 bg-bg-muted/60 p-3",
            toneCalloutClassName[summary.tone ?? "info"],
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            {summary.label}
          </p>
          <p
            className={cn(
              "mt-1 break-words text-sm leading-5 text-foreground",
              summary.emphasis ? "font-medium" : "font-normal",
            )}
          >
            {summary.href ? (
              <Link className="underline-offset-4 hover:underline" href={summary.href}>
                {summary.value}
              </Link>
            ) : (
              summary.value
            )}
          </p>
        </div>

        {primaryFields.length ? (
          <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {primaryFields.map((field) => (
              <EvidenceBriefField field={field} key={field.label} />
            ))}
          </dl>
        ) : null}

        {sections.map((section) => (
          <section className="border-t border-border-subtle pt-4" key={section.title}>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {section.title}
              </h3>
              {section.description ? (
                <p className="mt-1 text-xs leading-4 text-muted-foreground">
                  {section.description}
                </p>
              ) : null}
            </div>
            <dl className="mt-3 grid gap-2 md:grid-cols-2">
              {section.fields.map((field) => (
                <EvidenceBriefField field={field} key={field.label} />
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}

export function EvidenceDecisionPanel({
  decision,
}: {
  decision: EvidenceCommandDecision;
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm">
      <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            {decision.contextLabel}
          </p>
          <h2 className="mt-1 break-words text-base font-semibold leading-tight text-foreground">
            {decision.title}
          </h2>
        </div>
        {decision.scoreLabel && decision.scoreValue ? (
          <div className="flex h-7 shrink-0 items-center gap-1.5 self-start rounded-md border border-border-subtle bg-bg-muted px-2">
            <ActivityIcon className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {decision.scoreLabel}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {decision.scoreValue}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {decision.chips.map((chip) => (
          <EvidenceCommandChip chip={chip} key={`${chip.label}-${chip.tone ?? "neutral"}`} />
        ))}
      </div>

      <div
        className={cn(
          "mt-3 rounded-md border border-border-subtle border-l-2 bg-bg-muted/60 p-2.5",
          toneCalloutClassName[decision.nextStepTone],
        )}
      >
        <div className="flex min-w-0 gap-2.5">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border",
              toneSoftClassName[decision.nextStepTone],
            )}
          >
            <AlertTriangleIcon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Recommended action
            </p>
            <p className="mt-0.5 break-words text-sm font-medium leading-5 text-foreground">
              {decision.nextStep}
            </p>
          </div>
        </div>
      </div>

      <BriefSection title={decision.impactTitle} className="mt-4">
        <p className="break-words text-sm leading-5 text-muted-foreground">
          {decision.impact}
        </p>
      </BriefSection>

      {decision.verification ? (
        <BriefSection title={decision.verificationTitle ?? "Verification"} className="mt-4">
          <p className="break-words text-sm leading-5 text-muted-foreground">
            {decision.verification}
          </p>
        </BriefSection>
      ) : null}

      {decision.evidence ? (
        <BriefSection title="Evidence" className="mt-4">
          <EvidenceLink evidence={decision.evidence} />
        </BriefSection>
      ) : null}

      <div className="mt-4 grid gap-2 border-t border-border-subtle pt-3 sm:grid-cols-2">
        {decision.actions.map((action) => (
          <EvidenceCommandActionLink action={action} key={action.label} />
        ))}
      </div>
    </section>
  );
}

function EvidenceBriefField({ field }: { field: EvidenceCommandField }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border border-border-subtle bg-bg-muted/45 px-3 py-2",
        field.fullWidth && "md:col-span-2 xl:col-span-3",
      )}
    >
      <dt className="text-[0.6875rem] font-semibold uppercase tracking-normal text-muted-foreground">
        {field.label}
      </dt>
      <dd
        className={cn(
          "mt-1 min-w-0 break-words text-sm text-foreground",
          field.emphasis ? "font-semibold" : "font-medium",
        )}
      >
        {field.tone ? (
          <EvidenceCommandChip chip={{ label: field.value, tone: field.tone }} />
        ) : field.href ? (
          <Link className="break-words underline-offset-4 hover:underline" href={field.href}>
            {field.value}
          </Link>
        ) : (
          field.value
        )}
      </dd>
    </div>
  );
}

export function EvidenceTimeline({
  description,
  items,
  title,
}: {
  description: string;
  items: EvidenceCommandTimelineItem[];
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      <ol className="mt-4 space-y-4 border-l border-border-subtle pl-4">
        {items.map((item) => (
          <li className="relative" key={`${item.label}-${item.title}`}>
            <span
              className={cn(
                "absolute -left-[1.35rem] top-1 size-2.5 rounded-full border bg-bg-default",
                item.tone === "critical"
                  ? "border-red-500"
                  : item.tone === "attention"
                    ? "border-amber-500"
                    : item.tone === "stable"
                      ? "border-emerald-500"
                      : "border-sky-500",
              )}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {item.label}
              </p>
              {item.timestamp ? (
                <p className="text-xs text-muted-foreground">{item.timestamp}</p>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EvidenceLink({ evidence }: { evidence: EvidenceCommandEvidenceLink }) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-border-subtle bg-bg-default text-muted-foreground"
      >
        <FileText className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block break-words text-sm font-medium text-foreground">
          {evidence.label}
        </span>
        <span className="mt-0.5 block break-words text-xs leading-4 text-muted-foreground">
          {evidence.detail}
        </span>
      </span>
      {evidence.href ? (
        <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      ) : null}
    </>
  );

  const className = cn(
    "group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-2.5 rounded-md border border-border-subtle bg-bg-muted/60 p-2.5 text-left transition-colors",
    evidence.href && "hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  );

  if (evidence.href) {
    return (
      <Link className={className} href={evidence.href}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function EvidenceCommandActionLink({
  action,
  compact = false,
}: {
  action: EvidenceCommandAction;
  compact?: boolean;
}) {
  return (
    <Link
      className={cn(
        buttonVariants({
          size: "sm",
          variant: action.priority === "primary" ? "default" : "outline",
        }),
        "min-w-0 justify-between gap-2",
        action.priority === "secondary" &&
          "border-border-subtle bg-bg-muted/60 text-foreground hover:bg-bg-muted",
        compact && "h-8",
      )}
      href={action.href}
    >
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <EvidenceActionIcon icon={action.icon} />
        <span className="truncate">{action.label}</span>
      </span>
      <ArrowRight className="size-3.5 shrink-0 opacity-80 transition-transform group-hover/button:translate-x-0.5" />
    </Link>
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
