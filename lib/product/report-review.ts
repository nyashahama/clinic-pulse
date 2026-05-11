import type { ReportApiResponse } from "@/lib/demo/api-types";
import type {
  ClinicRow,
  ClinicStatus,
  QueuePressure,
  StaffPressure,
  StockPressure,
} from "@/lib/demo/types";

export type PendingReportReview = {
  reportId: number;
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  district: string;
  reporterName: string;
  source: string;
  offlineCreated: boolean;
  submittedAt: string;
  receivedAt: string;
  status: ClinicStatus | string;
  reason: string;
  staffPressure: StaffPressure | string;
  stockPressure: StockPressure | string;
  queuePressure: QueuePressure | string;
  notes: string;
  reviewState: string;
};

export type PendingReportReviewSummary = {
  pending: number;
  offline: number;
  criticalSignals: number;
  oldestReceivedAt: string | null;
};

export function buildPendingReportReviews(
  reports: ReportApiResponse[],
  clinics: ClinicRow[],
): PendingReportReview[] {
  const clinicsById = new Map(clinics.map((clinic) => [clinic.id, clinic]));

  return reports
    .filter((report) => report.reviewState === "pending")
    .map((report) => {
      const clinic = clinicsById.get(report.clinicId);

      return {
        reportId: report.id,
        clinicId: report.clinicId,
        clinicName: clinic?.name || report.clinicId,
        facilityCode: clinic?.facilityCode || "Unknown facility",
        district: clinic?.district || "Unknown district",
        reporterName: report.reporterName || "ClinicPulse reporter",
        source: report.source,
        offlineCreated: report.offlineCreated,
        submittedAt: report.submittedAt,
        receivedAt: report.receivedAt,
        status: report.status,
        reason: report.reason || "No reason supplied.",
        staffPressure: report.staffPressure || "unknown",
        stockPressure: report.stockPressure || "unknown",
        queuePressure: report.queuePressure || "unknown",
        notes: report.notes || "",
        reviewState: report.reviewState,
      };
    })
    .sort((left, right) => Date.parse(right.receivedAt) - Date.parse(left.receivedAt));
}

export function summarizePendingReportReviews(
  reviews: PendingReportReview[],
): PendingReportReviewSummary {
  return {
    pending: reviews.length,
    offline: reviews.filter((review) => review.offlineCreated).length,
    criticalSignals: reviews.filter(hasCriticalSignal).length,
    oldestReceivedAt: findOldestReceivedAt(reviews),
  };
}

function hasCriticalSignal(review: PendingReportReview): boolean {
  return (
    review.status === "non_functional" ||
    review.staffPressure === "critical" ||
    review.stockPressure === "stockout" ||
    review.queuePressure === "high"
  );
}

function findOldestReceivedAt(reviews: PendingReportReview[]): string | null {
  if (reviews.length === 0) {
    return null;
  }

  return reviews.reduce((oldest, review) =>
    Date.parse(review.receivedAt) < Date.parse(oldest.receivedAt) ? review : oldest,
  ).receivedAt;
}
