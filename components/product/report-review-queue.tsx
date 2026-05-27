"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useState } from "react";
import { Check, FileText, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { ProductPanel } from "@/components/product/panel";
import { SurfaceState } from "@/components/product/surface-state";
import { Button, buttonVariants } from "@/components/ui/button";
import type { PendingReportReview } from "@/lib/product/report-review";
import { cn } from "@/lib/utils";

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
  getReportDetailHref?: (item: PendingReportReview) => string;
  listClassName?: string;
  title?: string;
  description?: string;
};

const defaultTitle = "Report review queue";
const defaultDescription = "Review pending field reports before they update clinic status.";

const VISIT_PROOF_TONE_CLASS = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100",
} as const;

type ReportReviewQueueActionResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export type ReviewedReportState = {
  items: PendingReportReview[];
  reportIds: ReadonlySet<number>;
};

type ReviewedReportStateAction =
  | { type: "itemsRefreshed"; items: PendingReportReview[] }
  | {
      type: "reviewSucceeded";
      items: PendingReportReview[];
      reportId: number;
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

export function markReportReviewSucceeded(
  reviewedReportIds: ReadonlySet<number>,
  reportId: number,
): ReadonlySet<number> {
  return new Set(reviewedReportIds).add(reportId);
}

export function deriveReviewedReportIdsForItems(
  reviewedReportIds: ReadonlySet<number>,
  items: PendingReportReview[],
): ReadonlySet<number> {
  return pruneReviewedReportIds(reviewedReportIds, items);
}

function areReportIdSetsEqual(
  first: ReadonlySet<number>,
  second: ReadonlySet<number>,
): boolean {
  if (first.size !== second.size) {
    return false;
  }

  for (const reportId of first) {
    if (!second.has(reportId)) {
      return false;
    }
  }

  return true;
}

export function reconcileReviewedReportStateForItems(
  current: ReviewedReportState,
  items: PendingReportReview[],
): ReviewedReportState {
  const reportIds = pruneReviewedReportIds(current.reportIds, items);

  if (current.items === items && areReportIdSetsEqual(current.reportIds, reportIds)) {
    return current;
  }

  return {
    items,
    reportIds,
  };
}

function reviewedReportStateReducer(
  current: ReviewedReportState,
  action: ReviewedReportStateAction,
): ReviewedReportState {
  if (action.type === "itemsRefreshed") {
    return reconcileReviewedReportStateForItems(current, action.items);
  }

  const currentReportIds = deriveReviewedReportIdsForItems(
    current.reportIds,
    action.items,
  );

  return {
    items: action.items,
    reportIds: markReportReviewSucceeded(currentReportIds, action.reportId),
  };
}

export async function runReportReviewQueueAction({
  reportId,
  decision,
  notes,
  onReview,
  onReviewed,
}: ReportReviewQueueActionInput & {
  onReview: (input: ReportReviewQueueActionInput) => Promise<unknown>;
  onReviewed?: () => void;
}): Promise<ReportReviewQueueActionResult> {
  try {
    await onReview({
      reportId,
      decision,
      ...(notes !== undefined ? { notes } : {}),
    });
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
  getReportDetailHref,
  listClassName,
  title = defaultTitle,
  description = defaultDescription,
}: ReportReviewQueueProps) {
  const [pendingReportIds, setPendingReportIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [reviewedReportState, dispatchReviewedReportState] =
    useReducer(reviewedReportStateReducer, undefined, () => ({
      items,
      reportIds: new Set<number>(),
    }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reviewedReportIds = reviewedReportState.reportIds;

  useEffect(() => {
    dispatchReviewedReportState({ type: "itemsRefreshed", items });
  }, [items]);

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
      dispatchReviewedReportState({
        type: "reviewSucceeded",
        items,
        reportId,
      });
      setPendingReportIds((current) => {
        const next = new Set(current);
        next.delete(reportId);
        return next;
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
          <div className={cn("space-y-3", listClassName)}>
            {visibleItems.map((item) => {
              const isActionDisabled =
                pendingReportIds.has(item.reportId) ||
                reviewedReportIds.has(item.reportId);
              const reportDetailHref = getReportDetailHref?.(item);

              return (
                <article
                  key={item.reportId}
                  data-testid="report-review-item"
                  data-report-id={item.reportId}
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

                      {item.visitVerification ? (
                        <div
                          className={`rounded-lg border px-3 py-2 text-xs leading-5 ${
                            VISIT_PROOF_TONE_CLASS[item.visitVerification.tone]
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-1.5 font-medium">
                            <MapPin aria-hidden="true" className="size-3.5" />
                            <span>Visit proof</span>
                            <span>{item.visitVerification.statusLabel}</span>
                          </div>
                          <p className="mt-1">
                            {item.visitVerification.distanceLabel} from selected clinic ·{" "}
                            {item.visitVerification.accuracyLabel}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {reportDetailHref ? (
                        <Link
                          className={buttonVariants({ size: "sm", variant: "outline" })}
                          href={reportDetailHref}
                        >
                          <FileText aria-hidden="true" className="size-3.5" />
                          Open details
                        </Link>
                      ) : null}
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
