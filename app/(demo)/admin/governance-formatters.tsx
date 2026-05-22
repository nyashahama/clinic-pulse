import type { ReactNode } from "react";

import { AdminStatusBadge, type AdminTone } from "@/components/product/admin-module";

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

export function getReportingCoverageTone({
  status,
  freshness,
}: {
  status?: string | null;
  freshness?: string | null;
}): AdminTone {
  const normalizedStatus = status?.toString().toLowerCase();
  const normalizedFreshness = freshness?.toString().toLowerCase();

  if (
    !normalizedStatus ||
    normalizedStatus === "unknown" ||
    normalizedFreshness === "unknown" ||
    normalizedFreshness === "stale"
  ) {
    return "attention";
  }

  if (
    normalizedStatus === "needs_confirmation" ||
    normalizedFreshness === "needs_confirmation"
  ) {
    return "attention";
  }

  return "clear";
}

export function StatusBadge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: AdminTone;
}) {
  return <AdminStatusBadge tone={tone}>{children}</AdminStatusBadge>;
}
