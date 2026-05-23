"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  Building2Icon,
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

export function DistrictHome({ children, viewModel }: DistrictHomeProps) {
  const decisionTone = toneClasses(viewModel.hero.primaryDecision.tone);

  return (
    <div
      className="grid min-w-0 gap-4 pb-6"
      data-district-home="command-page"
      data-role-dashboard="district_manager"
      id="district-home"
    >
      <section
        aria-labelledby="district-home-title"
        className="grid min-w-0 gap-4 rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start"
      >
        <div className="grid min-w-0 content-start gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {viewModel.hero.eyebrow}
              </p>
              <h1
                className="mt-1 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl"
                id="district-home-title"
              >
                {viewModel.hero.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {viewModel.hero.description}
              </p>
            </div>
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
          </div>

          <div
            className={cn(
              "grid gap-3 border-l-4 bg-bg-muted/50 p-3",
              decisionTone.border,
              decisionTone.rail,
            )}
          >
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
                {viewModel.hero.primaryDecision.label} {viewModel.hero.primaryDecision.score}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.6fr)] md:items-end">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-normal text-foreground">
                  {viewModel.hero.primaryDecision.clinicName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-content-default">
                  {viewModel.hero.primaryDecision.action}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {viewModel.hero.primaryDecision.impact}
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-default p-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  <ShieldCheckIcon className="size-4" />
                  Verify before action
                </p>
                <p className="mt-2 text-sm leading-5 text-foreground">
                  {viewModel.hero.primaryDecision.verification}
                </p>
              </div>
            </div>
          </div>

          <p className="rounded-lg border border-border-subtle bg-bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
            Pilot safety: confirm stale or pending data before operational decisions.{" "}
            <Link href="/legal/safety" className="font-medium text-foreground underline">
              Read safety notes
            </Link>
            .
          </p>
        </div>

        <div className="grid min-w-0 content-start gap-3">
          <div className="order-2 grid grid-cols-2 gap-2 lg:order-1">
            {viewModel.hero.signals.map((signal) => {
              const tone = toneClasses(signal.tone);

              return (
                <div
                  className={cn(
                    "min-w-0 rounded-lg border bg-bg-muted/45 p-3",
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

          <div className="order-1 grid grid-cols-2 gap-2 lg:order-2" id="district-modules">
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
        </div>
      </section>

      <section
        aria-labelledby="district-command-preview-title"
        className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]"
      >
        <div
          className="rounded-lg border border-border-subtle bg-bg-default shadow-sm"
          id="severity-queue"
        >
          <div className="border-b border-border-subtle p-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              Queue preview
            </p>
            <h2
              className="mt-1 text-lg font-semibold text-foreground"
              id="district-command-preview-title"
            >
              Next clinic decisions
            </h2>
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
        </div>

        <div className="grid min-w-0 gap-3">
          <article
            className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
            id="clinic-network"
          >
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              <Building2Icon className="size-4" />
              Network context
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              {viewModel.commandPreview.selectedClinic?.clinicName ?? "No clinic selected"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {viewModel.commandPreview.selectedClinic?.recommendedAction ??
                "Select a clinic to inspect routing capacity."}
            </p>
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
              {viewModel.commandPreview.interventionPlan?.stageLabel ?? "No active plan"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {viewModel.commandPreview.interventionPlan?.routePlan ??
                "No intervention route plan is selected."}
            </p>
          </article>

          <article
            className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
            id="clinic-evidence"
          >
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              <AlertTriangleIcon className="size-4" />
              Evidence packet
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              {viewModel.commandPreview.selectedEvidence?.clinicName ?? "No evidence selected"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {viewModel.commandPreview.selectedEvidence?.recommendedAction ??
                "Review linked evidence before closing the decision."}
            </p>
          </article>
        </div>
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
