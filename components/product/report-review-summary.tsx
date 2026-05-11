import { ProductPanel } from "@/components/product/panel";
import type { PendingReportReviewSummary } from "@/lib/product/report-review";

type ReportReviewSummaryProps = {
  summary: PendingReportReviewSummary;
  title?: string;
  description?: string;
};

export function ReportReviewSummary({
  summary,
  title = "Report review pressure",
  description = "Pending field reports waiting for operational review.",
}: ReportReviewSummaryProps) {
  const metrics = [
    {
      label: "Pending",
      value: summary.pending,
      description: "Awaiting decision",
    },
    {
      label: "Offline",
      value: summary.offline,
      description: "Captured without live sync",
    },
    {
      label: "Critical",
      value: summary.criticalSignals,
      description: "Reports carrying critical signals",
    },
  ];

  return (
    <ProductPanel title={title} description={description}>
      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 rounded-lg border border-border-subtle bg-bg-muted p-4"
          >
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
              {metric.label}
            </p>
            <p className="mt-3 tabular-nums text-3xl font-semibold leading-none text-content-emphasis">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-5 text-content-default">
              {metric.description}
            </p>
          </div>
        ))}
      </div>
    </ProductPanel>
  );
}
