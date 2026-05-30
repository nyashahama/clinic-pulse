"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  MapPinned,
  RefreshCw,
  Send,
} from "lucide-react";

import type {
  FieldVisitTaskQueueItem,
  FieldVisitTone,
} from "@/lib/workspace/field-visit-cockpit";
import { cn } from "@/lib/utils";

type FieldTaskQueueProps = {
  onNavigateToSection?: (href: FieldVisitTaskQueueItem["href"]) => void;
  tasks: FieldVisitTaskQueueItem[];
};

const toneStyles: Record<FieldVisitTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100",
  blocked:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100",
  info:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-100",
};

const icons = {
  "active-stop": MapPinned,
  "clinic-report": ClipboardList,
  "device-sync": RefreshCw,
  "district-review": Send,
} satisfies Record<FieldVisitTaskQueueItem["id"], typeof CheckCircle2>;

export function FieldTaskQueue({ onNavigateToSection, tasks }: FieldTaskQueueProps) {
  return (
    <div className="border-b border-border-subtle bg-bg-subtle p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-content-subtle">
            Next actions
          </p>
          <h2 className="text-lg font-semibold tracking-normal text-content-emphasis">
            Field task queue
          </h2>
        </div>
        <p className="text-sm text-content-subtle">
          Work the stop, report, sync, and review handoff from one queue.
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {tasks.map((task) => {
          const Icon = icons[task.id];

          return (
            <Link
              key={task.id}
              href={task.href}
              onClick={(event) => {
                if (!onNavigateToSection) {
                  return;
                }

                event.preventDefault();
                onNavigateToSection(task.href);
              }}
              className="group grid min-h-36 rounded-lg border border-border-subtle bg-bg-default p-3 text-left shadow-sm transition-colors hover:border-neutral-900/40 hover:bg-bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
                  toneStyles[task.tone],
                )}
              >
                <Icon className="size-3.5" />
                {task.stateLabel}
              </span>
              <span className="mt-3 text-sm font-semibold text-content-emphasis group-hover:text-foreground">
                {task.title}
              </span>
              <span className="mt-1 text-xs leading-5 text-content-subtle">
                {task.description}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
