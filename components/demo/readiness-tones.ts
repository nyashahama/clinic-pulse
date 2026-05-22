export type ReadinessTone = "clear" | "watch" | "attention" | "info";

const readinessBadgeToneClassNames: Record<ReadinessTone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  watch:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
  attention:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200",
  info:
    "border-border-subtle bg-bg-subtle text-content-default dark:border-border-subtle dark:bg-bg-subtle dark:text-content-default",
};

const readinessMetricToneClassNames: Record<ReadinessTone, string> = {
  clear: "text-emerald-700 dark:text-emerald-300",
  watch: "text-amber-700 dark:text-amber-200",
  attention: "text-rose-700 dark:text-rose-300",
  info: "text-content-emphasis",
};

export function getReadinessBadgeToneClassName(tone: ReadinessTone) {
  return readinessBadgeToneClassNames[tone];
}

export function getReadinessMetricToneClassName(tone: ReadinessTone) {
  return readinessMetricToneClassNames[tone];
}
