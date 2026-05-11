import type { ReactNode } from "react";

import type { AdminTone } from "@/components/product/admin-module";
import { cn } from "@/lib/utils";

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

const numberFormatter = new Intl.NumberFormat("en-ZA");

export function formatCount(value: number) {
  return numberFormatter.format(value);
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return dateTimeFormatter.format(date);
}

export function formatLabel(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return value.replaceAll("_", " ");
}

export function toneForAttention(value: number): AdminTone {
  return value > 0 ? "attention" : "clear";
}

export function StatusBadge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: AdminTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        tone === "clear" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
        tone === "attention" &&
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
        tone === "blocked" &&
          "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
        tone === "info" &&
          "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
      )}
    >
      {children}
    </span>
  );
}
