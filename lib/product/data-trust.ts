export type DataSource =
  | "seeded_demo"
  | "pilot_import"
  | "field_report"
  | "system_reconciliation"
  | "partner_export";

export type DataFreshness = "fresh" | "needs_confirmation" | "stale" | "unknown";

export type ReviewState =
  | "reviewed"
  | "pending_review"
  | "rejected"
  | "not_required"
  | "unknown";

export type TrustConfidence = "high" | "medium" | "low" | "unknown";

export type TrustTone = "clear" | "attention" | "blocked";

export type DataTrustInput = {
  source: DataSource;
  freshness: DataFreshness;
  reviewState: ReviewState;
  lastVerifiedAt?: string;
  evidenceHref?: string;
};

export type DataTrustState = {
  tone: TrustTone;
  confidence: TrustConfidence;
  label: string;
  description: string;
  evidenceHref?: string;
};

const sourceLabels: Record<DataSource, string> = {
  seeded_demo: "Demo data",
  pilot_import: "Imported data",
  field_report: "Field data",
  system_reconciliation: "System reconciliation data",
  partner_export: "Partner export data",
};

const freshnessLabels: Record<DataFreshness, string> = {
  fresh: "fresh freshness",
  needs_confirmation: "needs confirmation",
  stale: "stale freshness",
  unknown: "unknown freshness",
};

const reviewLabels: Record<ReviewState, string> = {
  reviewed: "reviewed review",
  pending_review: "pending review",
  rejected: "rejected review",
  not_required: "review not required",
  unknown: "unknown review",
};

export function formatTrustLabel(
  source: DataSource,
  freshness: DataFreshness,
  reviewState: ReviewState,
): string {
  return `${sourceLabels[source]} / ${freshnessLabels[freshness]} / ${reviewLabels[reviewState]}`;
}

export function buildDataTrustState(input: DataTrustInput): DataTrustState {
  const base = { evidenceHref: input.evidenceHref };

  if (input.reviewState === "rejected") {
    return {
      ...base,
      tone: "blocked",
      confidence: "low",
      label: "Rejected data",
      description: `${sourceLabels[input.source]} was rejected during review.`,
    };
  }

  if (input.freshness === "stale") {
    return {
      ...base,
      tone: "blocked",
      confidence: "low",
      label: `Stale ${sourceLabels[input.source].toLowerCase()}`,
      description: `${sourceLabels[input.source]} is stale and should be refreshed before use.`,
    };
  }

  if (input.reviewState === "pending_review" || input.freshness === "needs_confirmation") {
    return {
      ...base,
      tone: "attention",
      confidence: "medium",
      label: "Pending review",
      description: `${sourceLabels[input.source]} needs review before it is treated as confirmed.`,
    };
  }

  if (input.source === "seeded_demo") {
    return {
      ...base,
      tone: "attention",
      confidence: "low",
      label: "Demo data",
      description: "Seeded demo data is useful for walkthroughs, not pilot decisions.",
    };
  }

  if (
    input.freshness === "fresh" &&
    (input.reviewState === "reviewed" || input.reviewState === "not_required")
  ) {
    return {
      ...base,
      tone: "clear",
      confidence: "high",
      label: reviewedLabel(input.source),
      description: freshReviewedDescription(input),
    };
  }

  return {
    ...base,
    tone: "attention",
    confidence: "unknown",
    label: "Trust state unknown",
    description: formatTrustLabel(input.source, input.freshness, input.reviewState),
  };
}

function reviewedLabel(source: DataSource): string {
  if (source === "field_report") {
    return "Reviewed field data";
  }

  return `Reviewed ${sourceLabels[source].toLowerCase()}`;
}

function freshReviewedDescription(input: DataTrustInput): string {
  const source = input.source === "field_report" ? "field-submitted data" : sourceLabels[input.source].toLowerCase();
  const verifiedAt = input.lastVerifiedAt ? ` at ${formatUtcMinute(input.lastVerifiedAt)}` : "";

  return `Fresh ${source} reviewed${verifiedAt}.`;
}

function formatUtcMinute(value: string): string {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}
