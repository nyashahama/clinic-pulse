"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  ClipboardCheckIcon,
  FileSearchIcon,
  MapPinnedIcon,
  RouteIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DistrictHomeModuleId,
  DistrictHomeTone,
  DistrictHomeViewModel,
} from "@/lib/demo/district-home-view-model";

type DistrictHomeProps = {
  children: ReactNode;
  viewModel: DistrictHomeViewModel;
};

const moduleIcons: Record<DistrictHomeModuleId, ReactNode> = {
  severity: <ActivityIcon />,
  network: <MapPinnedIcon />,
  evidence: <FileSearchIcon />,
  interventions: <RouteIcon />,
};

function toneClasses(tone: DistrictHomeTone) {
  if (tone === "blocked") {
    return {
      border: "border-red-200 dark:border-red-900/60",
      chip: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100",
      rail: "border-l-red-500",
      text: "text-red-700 dark:text-red-200",
    };
  }

  if (tone === "attention") {
    return {
      border: "border-amber-200 dark:border-amber-900/60",
      chip: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100",
      rail: "border-l-amber-500",
      text: "text-amber-800 dark:text-amber-100",
    };
  }

  if (tone === "clear") {
    return {
      border: "border-emerald-200 dark:border-emerald-900/60",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-100",
      rail: "border-l-emerald-500",
      text: "text-emerald-800 dark:text-emerald-100",
    };
  }

  return {
    border: "border-sky-200 dark:border-sky-900/60",
    chip: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-100",
    rail: "border-l-sky-500",
    text: "text-sky-800 dark:text-sky-100",
  };
}

function moduleAriaLabel(card: DistrictHomeViewModel["moduleCards"][number]) {
  return `${card.actionLabel}: ${card.title}`;
}

function pinToneClasses(tone: DistrictHomeTone) {
  if (tone === "blocked") {
    return {
      dot: "border-red-100 bg-red-600 shadow-red-500/30 dark:border-red-950",
      label: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/80 dark:text-red-100",
    };
  }

  if (tone === "attention") {
    return {
      dot: "border-amber-100 bg-amber-500 shadow-amber-500/30 dark:border-amber-950",
      label: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/80 dark:text-amber-100",
    };
  }

  if (tone === "clear") {
    return {
      dot: "border-emerald-100 bg-emerald-500 shadow-emerald-500/30 dark:border-emerald-950",
      label: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/80 dark:text-emerald-100",
    };
  }

  return {
    dot: "border-sky-100 bg-sky-500 shadow-sky-500/30 dark:border-sky-950",
    label: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/80 dark:text-sky-100",
  };
}

export function DistrictHome({ children, viewModel }: DistrictHomeProps) {
  const decisionTone = toneClasses(viewModel.hero.primaryDecision.tone);
  const decisionPacket = viewModel.commandPreview.decisionPacket;
  const mapPins = viewModel.commandPreview.commandMap.pins;

  return (
    <div
      className="grid min-w-0 gap-4 pb-6"
      data-district-home="command-page"
      data-role-dashboard="district_manager"
      id="district-home"
    >
      <section
        aria-labelledby="district-home-title"
        className="grid min-w-0 gap-4"
      >
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {viewModel.hero.eyebrow}
            </p>
            <h1
              className="mt-1 max-w-3xl text-2xl font-semibold tracking-normal text-foreground sm:text-3xl"
              id="district-home-title"
            >
              {viewModel.hero.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {viewModel.hero.description}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <Link
              className={buttonVariants({
                className: "w-full md:w-auto",
                size: "lg",
              })}
              href={viewModel.hero.primaryAction.href}
            >
              <ActivityIcon data-icon="inline-start" />
              {viewModel.hero.primaryAction.label}
            </Link>
            <Link
              className={buttonVariants({
                className: "w-full border-border-subtle bg-bg-default shadow-sm md:w-auto",
                size: "lg",
                variant: "outline",
              })}
              href={viewModel.hero.secondaryAction.href}
            >
              <FileSearchIcon data-icon="inline-start" />
              {viewModel.hero.secondaryAction.label}
            </Link>
          </div>
        </div>

        <div className="order-3 grid grid-cols-2 gap-2 lg:order-none lg:grid-cols-4">
          {viewModel.hero.signals.map((signal) => {
            const tone = toneClasses(signal.tone);

            return (
              <div
                className={cn(
                  "min-w-0 rounded-lg border bg-bg-default p-3 shadow-sm",
                  tone.border,
                )}
                key={signal.label}
              >
                <p className="truncate text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  {signal.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {signal.value}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {signal.detail}
                </p>
              </div>
            );
          })}
        </div>

        <section
          aria-label="Command cockpit"
          className="order-1 grid min-w-0 gap-4 xl:order-none xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]"
        >
          <article
            className="min-w-0 rounded-lg border border-border-subtle bg-bg-default shadow-sm"
            data-district-command-map
            id="clinic-network"
          >
            <div className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  <MapPinnedIcon className="size-4" />
                  Network map
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  Clinic coverage and active risk
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {viewModel.commandPreview.commandMap.scopeLabel} clinics are positioned by
                  district coordinates and ranked by the current severity model.
                </p>
              </div>
              <Link
                className={buttonVariants({
                  className: "w-full sm:w-auto",
                  size: "sm",
                  variant: "outline",
                })}
                href="/district/clinic-network"
              >
                <MapPinnedIcon data-icon="inline-start" />
                Map filters
              </Link>
            </div>
            <div className="relative min-h-[21rem] overflow-hidden bg-bg-muted/60">
              <div className="absolute inset-4 rounded-lg border border-border-subtle/70" />
              <div className="absolute left-[10%] right-[12%] top-[38%] h-px rotate-[7deg] bg-border-subtle" />
              <div className="absolute left-[18%] right-[18%] top-[58%] h-px -rotate-[10deg] bg-border-subtle" />
              <div className="absolute bottom-4 left-4 rounded-md border border-border-subtle bg-bg-default/90 px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                {mapPins.length} clinics visible
              </div>
              {mapPins.map((pin) => {
                const tone = pinToneClasses(pin.tone);

                return (
                  <Link
                    aria-label={`${pin.clinicName}: ${pin.label} ${pin.score}`}
                    className={cn(
                      "group absolute z-10 -translate-x-1/2 -translate-y-1/2",
                      pin.isSelected && "z-20",
                    )}
                    href={pin.href}
                    key={pin.clinicId}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    title={`${pin.clinicName}: ${pin.coverageLabel}`}
                  >
                    <span
                      className={cn(
                        "block size-4 rounded-full border-2 shadow-lg ring-4 ring-bg-default transition group-hover:scale-110",
                        tone.dot,
                        pin.isSelected && "size-5 ring-8",
                      )}
                    />
                    {pin.labelVisibility !== "dot" ? (
                      <span
                        className={cn(
                          "pointer-events-none absolute left-4 top-1/2 min-w-32 max-w-40 -translate-y-1/2 rounded-md border px-2 py-1 text-xs shadow-sm",
                          tone.label,
                          pin.labelVisibility === "primary"
                            ? "block max-w-48 font-medium"
                            : "hidden sm:block",
                        )}
                        data-district-map-pin-label
                      >
                        <span className="block truncate font-semibold">
                          {pin.clinicName}
                        </span>
                        <span className="block truncate">
                          {pin.coverageLabel}
                          {pin.score > 0 ? ` - ${pin.score}` : ""}
                        </span>
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </article>

          <article
            className="min-w-0 rounded-lg border border-border-subtle bg-bg-default shadow-sm"
            data-district-command-queue
            id="severity-queue"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  <ActivityIcon className="size-4" />
                  Severity queue
                </p>
                <h2
                  className="mt-1 text-lg font-semibold text-foreground"
                  id="district-command-preview-title"
                >
                  Next clinic decisions
                </h2>
              </div>
              <span className="rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                {viewModel.moduleCards[0]?.value ?? "0"} ranked
              </span>
            </div>
            <div className="divide-y divide-border-subtle">
              {viewModel.commandPreview.queueItems.map((item, index) => {
                const tone = toneClasses(item.tone);

                return (
                  <Link
                    className="grid gap-2 p-4 transition hover:bg-bg-muted/60 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start"
                    href={item.href}
                    key={item.clinicId}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {item.clinicName}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                        {item.action}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "inline-flex w-fit items-center rounded-md border px-2 py-1 text-xs font-semibold capitalize",
                        tone.chip,
                      )}
                    >
                      {item.label} {item.score}
                    </span>
                  </Link>
                );
              })}
            </div>
          </article>
        </section>

        <section
          aria-label="Selected clinic decision"
          className="order-2 grid min-w-0 gap-4 xl:order-none xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]"
          data-district-decision-packet
        >
          <article
            className={cn(
              "grid min-w-0 gap-4 border-l-4 bg-bg-default p-4 shadow-sm",
              decisionTone.border,
              decisionTone.rail,
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Primary district decision
                </span>
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-xs font-semibold capitalize",
                    decisionTone.chip,
                  )}
                >
                  {decisionPacket.severityLabel} {decisionPacket.score}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground">
                {decisionPacket.clinicName}
              </h2>
              <div className="mt-3 grid gap-3 text-sm leading-6 md:grid-cols-2">
                <p className="text-content-default">{decisionPacket.action}</p>
                <p className="text-muted-foreground">{decisionPacket.impact}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="min-w-0 border-l-2 border-border-subtle pl-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  <ShieldCheckIcon className="size-4" />
                  Verify
                </p>
                <p className="mt-2 text-sm leading-5 text-foreground">
                  {decisionPacket.verification}
                </p>
              </div>
              <div className="min-w-0 border-l-2 border-border-subtle pl-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  <RouteIcon className="size-4" />
                  Route
                </p>
                <p className="mt-2 text-sm leading-5 text-foreground">
                  {decisionPacket.routePlan}
                </p>
              </div>
              <div className="min-w-0 border-l-2 border-border-subtle pl-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  <FileSearchIcon className="size-4" />
                  Evidence
                </p>
                <p className="mt-2 text-sm leading-5 text-foreground">
                  {decisionPacket.evidenceDetail}
                </p>
              </div>
            </div>
          </article>

          <div className="grid min-w-0 gap-4">
            <article
              className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
              id="clinic-evidence"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    <AlertTriangleIcon className="size-4" />
                    Evidence packet
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    Why this clinic is first
                  </h2>
                </div>
                <Link
                  className={buttonVariants({
                    size: "sm",
                    variant: "outline",
                  })}
                  href="/district/clinic-evidence"
                >
                  <FileSearchIcon data-icon="inline-start" />
                  Open
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {decisionPacket.timeline.map((item) => {
                  const tone = toneClasses(item.tone);

                  return (
                    <Link
                      className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 rounded-md p-1 transition hover:bg-bg-muted/60"
                      href={item.href}
                      key={item.id}
                    >
                      <span
                        className={cn(
                          "mt-1 size-3 rounded-full border shadow-sm",
                          tone.chip,
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                          {item.detail}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </article>

            <article
              className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
              id="interventions"
            >
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                <ClipboardCheckIcon className="size-4" />
                Intervention handoff
              </p>
              <h2 className="mt-2 text-lg font-semibold text-foreground">
                {decisionPacket.interventionTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {decisionPacket.interventionDetail}
              </p>
            </article>
          </div>
        </section>

        <div
          className="order-3 grid grid-cols-2 gap-2 lg:order-none lg:grid-cols-4"
          id="district-modules"
        >
          {viewModel.moduleCards.map((card) => {
            const tone = toneClasses(card.tone);

            return (
              <article
                className={cn(
                  "grid min-h-[10.5rem] min-w-0 content-between gap-3 rounded-lg border bg-bg-default p-3 shadow-sm",
                  tone.border,
                )}
                data-district-home-module={card.id}
                key={card.id}
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn("rounded-md border p-1.5", tone.chip)}>
                      {moduleIcons[card.id]}
                    </span>
                    <span className="text-2xl font-semibold leading-none text-foreground">
                      {card.value}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {card.detail}
                  </p>
                </div>
                <Link
                  aria-label={moduleAriaLabel(card)}
                  className={buttonVariants({
                    className: "w-full justify-between",
                    size: "sm",
                    variant: card.id === "severity" ? "default" : "outline",
                  })}
                  href={card.href}
                >
                  {card.actionLabel}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </article>
            );
          })}
        </div>

        <p className="order-4 rounded-lg border border-border-subtle bg-bg-muted/60 p-3 text-xs leading-5 text-muted-foreground lg:order-none">
          Pilot safety: confirm stale or pending data before operational decisions.{" "}
          <Link href="/legal/safety" className="font-medium text-foreground underline">
            Read safety notes
          </Link>
          .
        </p>
      </section>

      <section
        aria-labelledby="district-supporting-title"
        className="grid min-w-0 gap-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Supporting operations
            </p>
            <h2
              className="text-lg font-semibold text-foreground"
              id="district-supporting-title"
            >
              Evidence, controls, reports, and roster
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {viewModel.supportingSections.map((section) => {
              const tone = toneClasses(section.tone);

              return (
                <span
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-medium",
                    tone.chip,
                  )}
                  key={section.id}
                >
                  {section.title}
                </span>
              );
            })}
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
