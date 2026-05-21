import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminDetailTone = "clear" | "attention" | "blocked" | "info" | "neutral";
export type AdminDetailPressureKind = "staff" | "stock" | "queue";

export type AdminDetailField = {
  label: ReactNode;
  value: ReactNode;
  className?: string;
};

export type AdminDetailStat = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: AdminDetailTone;
};

export type AdminDetailSignal = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: AdminDetailTone;
};

export type AdminDetailEvidenceItem = {
  label: ReactNode;
  value: ReactNode;
  emphasis?: boolean;
};

export type AdminDetailTimelineItem = {
  label: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: ReactNode;
  tone?: AdminDetailTone;
};

function detailToneClassName(tone: AdminDetailTone = "neutral") {
  switch (tone) {
    case "clear":
      return "border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100";
    case "attention":
      return "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100";
    case "blocked":
      return "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/15";
    case "info":
      return "border-sky-200 bg-sky-50/70 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100";
    default:
      return "border-border-subtle bg-bg-muted text-content-default";
  }
}

function detailToneDotClassName(tone: AdminDetailTone = "neutral") {
  switch (tone) {
    case "clear":
      return "bg-emerald-500";
    case "attention":
      return "bg-amber-500";
    case "blocked":
      return "bg-destructive";
    case "info":
      return "bg-sky-500";
    default:
      return "bg-muted-foreground/45";
  }
}

export function getAdminDetailPressureTone(
  value: string,
  kind?: AdminDetailPressureKind,
): AdminDetailTone {
  if (value === "unknown") {
    return "neutral";
  }

  if (value === "high" || value === "critical" || value === "stockout" || value === "none") {
    return "blocked";
  }

  if (value === "strained" || value === "medium" || value === "moderate") {
    return "attention";
  }

  if (value === "low") {
    return kind === "stock" ? "attention" : "clear";
  }

  return "clear";
}

export function AdminDetailShell({
  eyebrow,
  title,
  description,
  returnHref,
  returnLabel,
  hideHeader = false,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  returnHref: string;
  returnLabel: string;
  hideHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Link
        href={returnHref}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "w-fit",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        <span>{returnLabel}</span>
      </Link>
      {hideHeader ? null : (
        <AdminDetailHero eyebrow={eyebrow} title={title} description={description} />
      )}
      {children}
    </div>
  );
}

export function AdminDetailFieldGrid({
  fields,
  className,
}: {
  fields: AdminDetailField[];
  className?: string;
}) {
  return (
    <section
      data-admin-module
      className={cn("grid gap-3 text-content-default sm:grid-cols-2 xl:grid-cols-3", className)}
    >
      {fields.map((field, index) => (
        <div
          key={index}
          className={cn(
            "min-w-0 rounded-lg border border-border-subtle bg-bg-default p-3 shadow-sm",
            field.className,
          )}
        >
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {field.label}
          </p>
          <div className="mt-1 min-w-0 break-words text-sm font-medium text-foreground">
            {field.value}
          </div>
        </div>
      ))}
    </section>
  );
}

export function AdminDetailSignalBar({
  signals,
  className,
}: {
  signals: AdminDetailSignal[];
  className?: string;
}) {
  return (
    <section
      data-admin-module
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm",
        className,
      )}
    >
      <dl className="grid divide-y divide-border-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {signals.map((signal, index) => (
          <div key={index} className="min-w-0 px-4 py-3">
            <dt className="flex min-w-0 items-center gap-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", detailToneDotClassName(signal.tone))}
              />
              <span className="min-w-0 truncate">{signal.label}</span>
            </dt>
            <dd className="mt-1 min-w-0 break-words text-lg font-semibold leading-tight text-foreground">
              {signal.value}
            </dd>
            {signal.detail ? (
              <dd className="mt-1 min-w-0 break-words text-xs leading-5 text-muted-foreground">
                {signal.detail}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AdminDetailEvidenceList({
  title,
  description,
  items,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  items: AdminDetailEvidenceItem[];
  className?: string;
}) {
  return (
    <section
      data-admin-module
      className={cn(
        "min-w-0 rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm",
        className,
      )}
    >
      <div className="min-w-0 border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <dl className="min-w-0 divide-y divide-border-subtle">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4"
          >
            <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              {item.label}
            </dt>
            <dd
              className={cn(
                "min-w-0 break-words text-sm text-foreground",
                item.emphasis ? "font-medium" : "font-normal",
              )}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AdminDetailHero({
  eyebrow,
  title,
  description,
  status,
  actions,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      data-admin-module
      className="min-w-0 rounded-lg border border-border-subtle bg-bg-default px-4 py-4 text-content-default shadow-sm sm:px-5"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              {eyebrow}
            </p>
            {status ? <div className="shrink-0">{status}</div> : null}
          </div>
          <h1 className="mt-2 max-w-4xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AdminDetailStatStrip({
  stats,
  className,
}: {
  stats: AdminDetailStat[];
  className?: string;
}) {
  return (
    <section
      data-admin-module
      className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "min-w-0 rounded-lg border px-4 py-3 shadow-sm",
            detailToneClassName(stat.tone),
          )}
        >
          <p className="text-xs font-medium uppercase tracking-normal opacity-75">
            {stat.label}
          </p>
          <div className="mt-1 min-w-0 break-words text-xl font-semibold leading-tight">
            {stat.value}
          </div>
          {stat.detail ? (
            <p className="mt-1 min-w-0 break-words text-xs leading-5 opacity-80">
              {stat.detail}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}

export function AdminDetailActionPanel({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-admin-module
      className={cn(
        "min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm",
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export function AdminDetailTimeline({
  title,
  description,
  items,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  items: AdminDetailTimelineItem[];
  className?: string;
}) {
  return (
    <section
      data-admin-module
      className={cn(
        "min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm",
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      <ol className="mt-4 space-y-4 border-l border-border-subtle pl-4">
        {items.map((item, index) => (
          <li key={index} className="relative">
            <span
              className={cn(
                "absolute -left-[1.35rem] top-1 size-2.5 rounded-full border bg-bg-default",
                item.tone === "blocked"
                  ? "border-destructive"
                  : item.tone === "attention"
                    ? "border-amber-500"
                    : item.tone === "clear"
                      ? "border-emerald-500"
                      : "border-sky-500",
              )}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {item.label}
              </p>
              {item.timestamp ? (
                <p className="font-mono text-xs text-muted-foreground">{item.timestamp}</p>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AdminDetailJsonBlock({
  title,
  value,
}: {
  title: ReactNode;
  value: unknown;
}) {
  return (
    <section
      data-admin-module
      className="min-w-0 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <pre className="mt-3 max-h-[28rem] overflow-auto rounded-md bg-bg-muted p-3 text-xs leading-5 text-content-default">
        {formatAdminDetailJson(value)}
      </pre>
    </section>
  );
}

export function formatAdminDetailList(values: string[]) {
  return values.length ? values.join(", ") : "None recorded";
}

export function formatAdminDetailRecord(value: Record<string, unknown>) {
  const entries = Object.entries(value);

  if (!entries.length) {
    return "None recorded";
  }

  return entries.map(([key, entryValue]) => `${key}: ${String(entryValue)}`).join("; ");
}

export function formatAdminDetailJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}
