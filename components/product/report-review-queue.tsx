"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { ProductPanel } from "@/components/product/panel";
import { SurfaceState } from "@/components/product/surface-state";
import { Button } from "@/components/ui/button";
import type { PendingReportReview } from "@/lib/product/report-review";

export type ReportReviewDecision = "accepted" | "rejected";

export type ReportReviewQueueActionInput = {
  reportId: number;
  decision: ReportReviewDecision;
  notes?: string;
};

type ReportReviewQueueProps = {
  items: PendingReportReview[];
  onReview: (input: ReportReviewQueueActionInput) => Promise<unknown>;
  onReviewed?: () => void;
  title?: string;
  description?: string;
};

const defaultTitle = "Report review queue";
const defaultDescription = "Review pending field reports before they update clinic status.";

type ReportReviewQueueActionResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

type ReviewedReportState = {
  items: PendingReportReview[];
  reportIds: ReadonlySet<number>;
};

export function getVisibleReportReviewItems(
  items: PendingReportReview[],
  reviewedReportIds: ReadonlySet<number>,
): PendingReportReview[] {
  return items.filter((item) => !reviewedReportIds.has(item.reportId));
}

export function pruneReviewedReportIds(
  reviewedReportIds: ReadonlySet<number>,
  items: PendingReportReview[],
): ReadonlySet<number> {
  const itemIds = new Set(items.map((item) => item.reportId));
  const next = new Set<number>();

  reviewedReportIds.forEach((reportId) => {
    if (itemIds.has(reportId)) {
      next.add(reportId);
    }
  });

  return next;
}

export async function runReportReviewQueueAction({
  reportId,
  decision,
  onReview,
  onReviewed,
}: ReportReviewQueueActionInput & {
  onReview: (input: ReportReviewQueueActionInput) => Promise<unknown>;
  onReviewed?: () => void;
}): Promise<ReportReviewQueueActionResult> {
  try {
    await onReview({ reportId, decision });
    onReviewed?.();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : "Unable to review report.",
    };
  }
}

export function composeReportReviewCallbacks(
  onReviewed: (() => void) | undefined,
  refresh: () => void,
): () => void {
  return () => {
    onReviewed?.();
    refresh();
  };
}

export function ReportReviewQueueErrorAlert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100"
    >
      {message}
    </p>
  );
}

export function ReportReviewQueueView({
  items,
  onReview,
  onReviewed,
  title = defaultTitle,
  description = defaultDescription,
}: ReportReviewQueueProps) {
  const [pendingReportIds, setPendingReportIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [reviewedReportState, setReviewedReportState] =
    useState<ReviewedReportState>(() => ({
      items,
      reportIds: new Set(),
    }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  let reviewedReportIds = reviewedReportState.reportIds;

  if (reviewedReportState.items !== items) {
    reviewedReportIds = pruneReviewedReportIds(reviewedReportState.reportIds, items);
    setReviewedReportState({ items, reportIds: reviewedReportIds });
  }

  const visibleItems = useMemo(
    () => getVisibleReportReviewItems(items, reviewedReportIds),
    [items, reviewedReportIds],
  );

  async function handleReview(reportId: number, decision: ReportReviewDecision) {
    if (pendingReportIds.has(reportId) || reviewedReportIds.has(reportId)) {
      return;
    }

    setErrorMessage(null);
    setPendingReportIds((current) => new Set(current).add(reportId));

    const result = await runReportReviewQueueAction({
      reportId,
      decision,
      onReview,
      onReviewed,
    });

    if (result.ok) {
      setReviewedReportState((current) => {
        const baseReportIds =
          current.items === items
            ? current.reportIds
            : pruneReviewedReportIds(current.reportIds, items);

        return {
          items,
          reportIds: new Set(baseReportIds).add(reportId),
        };
      });
    } else {
      setErrorMessage(result.errorMessage);
      setPendingReportIds((current) => {
        const next = new Set(current);
        next.delete(reportId);
        return next;
      });
    }
  }

  return (
    <ProductPanel
      title={title}
      description={description}
      contentClassName="space-y-3"
    >
      <div data-testid="report-review-queue" className="space-y-3">
        {errorMessage ? (
          <ReportReviewQueueErrorAlert message={errorMessage} />
        ) : null}

        {visibleItems.length === 0 ? (
          <SurfaceState
            variant="empty"
            title="No pending reports"
            description="New field reports that need review will appear here."
            size="compact"
          />
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const isActionDisabled =
                pendingReportIds.has(item.reportId) ||
                reviewedReportIds.has(item.reportId);

              return (
                <article
                  key={item.reportId}
                  data-testid="report-review-item"
                  className="rounded-lg border border-border-subtle bg-bg-default p-4"
                >
                  <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-content-emphasis">
                            {item.clinicName}
                          </h3>
                          <span className="rounded-full border border-border-subtle bg-bg-muted px-2 py-0.5 text-xs font-medium text-content-default">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-content-default">
                          {item.facilityCode} · {item.district}
                        </p>
                      </div>

                      <p className="text-sm leading-6 text-content-emphasis">
                        {item.reason}
                      </p>

                      <dl className="grid gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                            Staff
                          </dt>
                          <dd className="mt-1 text-content-default">
                            {item.staffPressure}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                            Stock
                          </dt>
                          <dd className="mt-1 text-content-default">
                            {item.stockPressure}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                            Queue
                          </dt>
                          <dd className="mt-1 text-content-default">
                            {item.queuePressure}
                          </dd>
                        </div>
                      </dl>

                      <p className="text-xs leading-5 text-content-subtle">
                        Reported by {item.reporterName} from {item.source}.{" "}
                        {item.offlineCreated
                          ? "Created offline and synced later."
                          : "Created from an online source."}{" "}
                        Received {item.receivedAt}.
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        data-testid="accept-report-review"
                        disabled={isActionDisabled}
                        onClick={() => void handleReview(item.reportId, "accepted")}
                        size="sm"
                      >
                        <Check aria-hidden="true" className="size-3.5" />
                        Accept
                      </Button>
                      <Button
                        data-testid="reject-report-review"
                        disabled={isActionDisabled}
                        onClick={() => void handleReview(item.reportId, "rejected")}
                        size="sm"
                        variant="destructive"
                      >
                        <X aria-hidden="true" className="size-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ProductPanel>
  );
}

export function ReportReviewQueue(props: ReportReviewQueueProps) {
  const router = useRouter();

  return (
    <ReportReviewQueueView
      {...props}
      onReviewed={composeReportReviewCallbacks(props.onReviewed, () =>
        router.refresh(),
      )}
    />
  );
}
